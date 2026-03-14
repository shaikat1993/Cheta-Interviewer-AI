"""
services/interview_service.py

Handles the core logic for dynamically generating AI interview questions based
on the candidate's resume, the job description, and the ongoing conversational context.
It connects to OpenAI through `openai_client` to produce context-aware responses.
"""
import json
import difflib
from services.openai_client import call_llm
from config import TEMPERATURE_MEDIUM
from services.termination_service import should_terminate_interview

PROMPT_CACHE = {}

def build_static_prompt(jd_profile, resume_profile):
    """
    Constructs and caches the static foundational portion of the LLM prompt,
    which includes the core HR persona and the profile backgrounds.
    """
    key = json.dumps({"jd": jd_profile, "resume": resume_profile}, sort_keys=True)
    if key not in PROMPT_CACHE:
        prompt = f"""
You are a professional HR interviewer.
Job Role: {jd_profile.get('role')}
Required Skills: {jd_profile.get('required_skills')}
Candidate Skills: {resume_profile.get('skills')}
"""
        PROMPT_CACHE[key] = prompt
    return PROMPT_CACHE[key]

async def generate_question(state):
    """
    Generates the next interview question using LLM inference.

    Logic:
    - If the interview is just starting, generate an introductory question.
    - If the candidate performed well previously (>70), ask a tougher follow-up.
    - If the candidate performed weakly, move to a foundational question on a new skill.
    - Avoids duplicate questions by implementing string similarity retry loops.

    Args:
        state: The ongoing InterviewState object containing session history.

    Returns:
        tuple: (The generated string `question`, The `skill_to_ask` it focuses on)
        Returns (None, None) if the interview has reached its termination point.
    """
    required_skills = state.jd_profile.get("required_skills", [])
    remaining_skills = [s for s in required_skills if s not in state.covered_skills]

    # Check if interview should terminate
    terminate, reason = should_terminate_interview(state)
    if terminate:
        state.end_interview()
        return None, None

    # Pick next skill
    skill_to_ask = remaining_skills[0] if remaining_skills else None
    static_prompt = build_static_prompt(state.jd_profile, state.resume_profile)

    # Decide prompt for LLM
    history_context = ""
    if hasattr(state, 'asked_questions') and state.asked_questions:
        history_context = "Previously Asked Questions (DO NOT REPEAT THESE):\n"
        for i, q in enumerate(state.asked_questions, 1):
            history_context += f"{i}. {q}\n"

    if state.total_questions == 0 or not state.previous_question:
        # First question - Self Introduction
        dynamic_prompt = f"""
{static_prompt}
This is the very first question of the interview.
Please ask the candidate to briefly introduce themselves and their background (e.g., "Tell me about yourself.").
Return ONLY the question, without extra context or explanation.
"""
    else:
        last_score = state.scores[-1] if state.scores else 0
        prev_question = state.previous_question
        prev_answer = state.previous_answer

        if last_score >= 70:
            # Strong candidate -> slight increase in difficulty / deeper follow-up
            dynamic_prompt = f"""
{static_prompt}
{history_context}
Previous Question: {prev_question}
Candidate Answer: {prev_answer}

The candidate's previous answer was strong. 
For this next question, focus on {skill_to_ask}. 
Make the question slightly more difficult or deeper than a basic question to test their limits.
Acknowledge the candidate's previous answer briefly and naturally transition to the next question.
Keep the question concise and focused. Return ONLY the question without extra context.
"""
        else:
            # Weak candidate -> maintain or reduce difficulty, move to new skill
            dynamic_prompt = f"""
{static_prompt}
{history_context}
Previous Question: {prev_question}
Candidate Answer: {prev_answer}

The candidate struggled with the previous question.
For this next question, focus on {skill_to_ask}.
Keep the question at a foundational or basic level to keep the interview balanced and maintain their confidence.
Acknowledge the candidate's previous answer briefly and naturally transition to the next question.
Return ONLY one clear and concise question without extra context.
"""

    MAX_RETRIES = 3
    for attempt in range(MAX_RETRIES):
        # Call the LLM
        # Increase temperature slightly on retries to encourage different phrasing
        current_temp = TEMPERATURE_MEDIUM + (attempt * 0.1)
        question_raw = await call_llm(prompt=dynamic_prompt, temperature=current_temp, max_tokens=150)
        question = question_raw.strip()
        
        # In case the LLM outputs JSON because of the system prompt
        if question.startswith('{') and question.endswith('}'):
            try:
                parsed = json.loads(question)
                if "question" in parsed:
                    question = parsed["question"]
            except Exception:
                pass
                
        question = question.strip().strip('"')

        # Check for similarity with previous questions
        is_duplicate = False
        if hasattr(state, 'asked_questions'):
            for asked_q in state.asked_questions:
                similarity = difflib.SequenceMatcher(None, question.lower(), asked_q.lower()).ratio()
                if similarity > 0.8:
                    is_duplicate = True
                    break
        
        if not is_duplicate:
            break
        elif attempt < MAX_RETRIES - 1:
            print(f"Duplicate question detected (similarity > 0.8). Retrying... ({attempt+1}/{MAX_RETRIES})")
            # If duplicating, append an explicit instruction to try harder
            dynamic_prompt += "\nIMPORTANT: The previous generated question was a duplicate. Make absolutely sure you generate a NEW question."

    # Save to history
    if hasattr(state, 'asked_questions'):
        state.asked_questions.append(question)

    # Mark skill as covered only for new skill
    if skill_to_ask not in state.covered_skills:
        state.covered_skills.add(skill_to_ask)
        state.increment_question_count()

    return question, skill_to_ask