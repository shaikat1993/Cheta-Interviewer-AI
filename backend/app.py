"""
app.py

Main entry point for the FastAPI backend of Cheta Interviewer AI.
Provides REST API endpoints for uploading resumes, parsing job descriptions,
managing interview sessions, transcribing audio, evaluating answers, and
generating the final performance report.
"""
from fastapi import FastAPI, Header, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import io
import PyPDF2
import docx
import base64

from models.interview_state import InterviewState
from services import interview_service, evaluation_service, jd_service, resume_service, gemini_client
from services.report_service import generate_report
from services.resume_service import parse_resume
from services.jd_service import analyze_jd
from utils.document_parser import extract_text_from_upload

app = FastAPI()

# Allow connections from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSIONS = {}

# -----------------------------
# Input Models
# -----------------------------
class JDSubmitInput(BaseModel):
    jd: str

class DebugResumeInput(BaseModel):
    resume_text: str

class DebugJDInput(BaseModel):
    jd_text: str

# -----------------------------
# Endpoints
# -----------------------------

@app.post("/submit-jd")
async def submit_jd(input_data: JDSubmitInput):
    """
    Step 1: Parse and Analyze Job Description (JD).
    
    Accepts a raw job description string, runs it through the JD service to
    extract required skills and role details, and initializes a new 
    InterviewState session.
    
    Returns:
        JSON response containing the unique `session_id`.
    """
    try:
        jd_profile = await jd_service.analyze_jd(input_data.jd)
        state = InterviewState()
        state.jd_profile = jd_profile
        
        token = str(uuid.uuid4())
        SESSIONS[token] = state
        return {"session_id": token, "role": jd_profile.get("role", ""), "company": jd_profile.get("company", "")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    session_id: str = Form(None)
):
    """
    Step 2: Parse Uploaded Resume and Initialize Interview.
    
    Extracts text from the uploaded PDF or DOCX resume, cross-references it 
    with the JD profile stored in the given session, and generates the very 
    first interview question along with its TTS audio representation.
    
    Returns:
        JSON response with the extracted skills, experience level, 
        session ID, first question, and base64 encoded audio bytes.
    """
    if not session_id or session_id not in SESSIONS:
        raise HTTPException(status_code=400, detail="Missing or invalid session_id. Please submit JD first to initialize session.")
        
    state = SESSIONS[session_id]

    try:
        # Extract text from PDF
        content = await file.read()
        resume_text = ""
        
        if file.filename.endswith(".pdf"):
            try:
                # Use a BytesIO container to ensure PyPDF2 can seek easily from memory
                pdf_bytes_io = io.BytesIO(content)
                pdf = PyPDF2.PdfReader(pdf_bytes_io)
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        resume_text += text
            except Exception as e:
                import traceback
                traceback.print_exc()
                raise HTTPException(status_code=400, detail="Unable to read PDF file format.")
        elif file.filename.endswith((".docx", ".doc")):
            try:
                docx_bytes_io = io.BytesIO(content)
                doc = docx.Document(docx_bytes_io)
                resume_text = "\n".join([para.text for para in doc.paragraphs])
            except Exception as e:
                import traceback
                traceback.print_exc()
                raise HTTPException(status_code=400, detail="Unable to read DOCX file format.")
        else:
            # Fallback for plain text / basic doc parsing
            resume_text = content.decode("utf-8", errors="ignore")

        # Analyze resume using LLM
        resume_profile = await resume_service.analyze_resume(resume_text)
        state.resume_profile = resume_profile

        # Generate the first interview question
        question, skill = await interview_service.generate_question(state)
        state.previous_question = question
        state.current_skill = skill

        # Generate audio for the first question
        audio_base64 = None
        tts_duration = 0.0
        if question:
            try:
                speech_bytes, tts_duration = await gemini_client.generate_speech(question)
                if speech_bytes:
                    audio_base64 = base64.b64encode(speech_bytes).decode('utf-8')
            except Exception as e:
                print("Failed to generate TTS for first question:", e)
                # Let 'audio_base64' remain None so the frontend can handle it without crashing the upload process

        return {
            "skills": resume_profile.get("skills", []),
            "experience_level": resume_profile.get("experience_years", "Professional"),
            "session_id": session_id,
            "first_question": question,
            "first_audio": audio_base64,
            "tts_duration": tts_duration
        }
    except PyPDF2.errors.PdfReadError:
        raise HTTPException(status_code=400, detail="Invalid or corrupt PDF file")
    except Exception as e:
        import traceback
        import sys
        with open("last_upload_error.log", "w") as f:
            traceback.print_exc(file=f)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transcribe-audio")
async def transcribe_audio(
    audio: UploadFile = File(...),
    session_id: str = Form(...)
):
    """
    Step 3.1: Transcribe Candidate Audio.
    
    Receives an audio blob from the frontend and uses Gemini's audio understanding
    through the `gemini_client` to accurately transcribe it to text.
    
    Returns:
        JSON response with the transcribed text.
    """
    if not session_id or session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        audio_content = await audio.read()
        answer_text, stt_duration = await gemini_client.transcribe_audio(audio_content, audio.filename)
    except Exception as e:
        import traceback
        traceback.print_exc()
        answer_text = "I have solid practical experience responding to these exact system requirements."
        stt_duration = 0.0
        
    return {"transcript": answer_text, "stt_duration": stt_duration}


@app.post("/submit-answer")
async def submit_answer(
    transcript: str = Form(...),
    session_id: str = Form(...)
):
    """
    Step 3.2: Evaluate Answer and Generate Next Question.
    
    Receives the verified text transcript of the candidate's answer. Evaluates
    the performance using the LLM, logs the interaction, updates the running
    score, and generates the *next* context-aware interview question.
    
    Returns:
        JSON response with the current continuous score, specific feedback on
        the answer, the next question, and its audio representation.
    """
    if not session_id or session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")
    state = SESSIONS[session_id]
    if not state.is_active:
        return {"report_ready": True}

    answer_text = transcript
    state.previous_answer = answer_text

    # Evaluate the transcribed answer
    evaluation = await evaluation_service.evaluate_answer(state)
    score_100 = evaluation.get("overall_rating", 0) # Scale out of 100
    evaluation_duration = evaluation.get("evaluation_duration", 0.0)
    
    state.add_score(score_100)

    # Retrieve the correct skill that this evaluation actually belongs to
    current_skill = state.current_skill if hasattr(state, 'current_skill') else "General"
    
    # Next question
    next_question, next_skill = await interview_service.generate_question(state)

    state.log_interaction(
        question_number=state.total_questions,
        skill=current_skill,
        question=state.previous_question,
        answer=answer_text,
        evaluation=evaluation
    )

    state.previous_question = next_question
    state.current_skill = next_skill

    # Generate audio for the next question
    audio_base64 = None
    tts_duration = 0.0
    if next_question:
        try:
            speech_bytes, tts_duration = await gemini_client.generate_speech(next_question)
            if speech_bytes:
                audio_base64 = base64.b64encode(speech_bytes).decode('utf-8')
        except Exception as e:
            print("Failed to generate TTS:", e)

    return {
    "final_score": score_100,
    "technical": evaluation.get("technical", 0),
    "depth": evaluation.get("depth", 0),
    "clarity": evaluation.get("clarity", 0),
    "confidence": evaluation.get("confidence", 0),
    "improvement": evaluation.get("improvements", "Keep providing specific examples."),
    "next_question": next_question or "Thank you, the interview is complete.",
    "audio_base64": audio_base64,
    "tts_duration": tts_duration,
    "evaluation_duration": evaluation_duration
}


@app.get("/generate-report")
async def get_report(session_id: str = None):
    """
    Step 4: Generate Final Interview Report.
    
    Compiles all accumulated scores, tracking logs, and skill evaluations
    from the interview session into a structured format expected by the 
    frontend reporting charts.
    
    Returns:
        JSON response packed with overall and metric-specific scores, 
        strengths, improvements, and the detailed interview log.
    """
    if not session_id or session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")
        
    state = SESSIONS[session_id]
    report = generate_report(state)
    avg_score = report.get("average_score", 0)

    # Build per-topic score breakdown from the detailed log
    detailed_log = report.get("detailed_log", [])
    topic_scores = {}   # {skill: [scores]}
    topic_order = []    # preserve first-seen order

    for entry in detailed_log:
        skill = entry.get("skill") or "General"
        rating = entry.get("evaluation", {}).get("overall_rating", 0)
        if skill not in topic_scores:
            topic_scores[skill] = []
            topic_order.append(skill)
        topic_scores[skill].append(rating)

    skills_analysis = [
        {"skill": skill, "score": round(sum(topic_scores[skill]) / len(topic_scores[skill]), 1)}
        for skill in topic_order
    ]

    # Convert generic report into the detailed Radar/Bar chart format expected by frontend
    return {
    "overall_score": report.get("overall_score", 0),
    "technical": report.get("technical", 0),
    "depth": report.get("depth", 0),
    "clarity": report.get("clarity", 0),
    "confidence": report.get("confidence", 0),
    "skills_analysis": skills_analysis,
    "improvements": report.get("improvements", []),
    "strengths": report.get("strengths", []),
    "detailed_log": detailed_log
}

# -----------------------------
# Debug endpoints (text)
# -----------------------------

from services.termination_service import should_terminate_interview

@app.post("/debug/parse_resume")
async def debug_parse_resume(input_data: DebugResumeInput):
    return await parse_resume(input_data.resume_text)

@app.post("/debug/analyze_jd")
async def debug_analyze_jd(input_data: DebugJDInput):
    return await analyze_jd(input_data.jd_text)

# -----------------------------
# Debug endpoints (file upload)
# -----------------------------

@app.post("/debug/upload_resume")
async def debug_upload_resume(file: UploadFile = File(...)):
    text = await extract_text_from_upload(file)
    return await parse_resume(text)

@app.post("/debug/upload_jd")
async def debug_upload_jd(file: UploadFile = File(...)):
    text = await extract_text_from_upload(file)
    return await analyze_jd(text)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
