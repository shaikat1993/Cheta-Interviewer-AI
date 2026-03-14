"""
services/resume_service.py

Processes raw Resume text to extract a structured profile including skills,
projects, and experience level required to tailor the interview.
"""
import json
from fastapi import HTTPException
from services.openai_client import call_llm
from config import TEMPERATURE_LOW

async def analyze_resume(resume_text: str):
    return await parse_resume(resume_text)
    
async def parse_resume(resume_text: str) -> dict:
    """
    Extracts a structured resume profile from raw resume text using the LLM.
    
    Args:
        resume_text: Raw string text extracted from the candidate's PDF or DOCX.
        
    Returns:
        A validated dictionary compatible with InterviewState containing
        (candidate_name, skills, projects, experience_years, primary_domain).
    """

    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Resume content too short or empty."
        )

    prompt = f"""
You are a professional resume parser.

Extract structured information from the resume below.

Return STRICT JSON only in this format:

{{
  "candidate_name": "",
  "skills": [],
  "projects": [],
  "experience_years": "",
  "primary_domain": ""
}}

Rules:
- Skills must be technical skills only.
- Remove duplicates.
- Infer experience_years if not explicitly mentioned.
- primary_domain must be one of:
  Backend, Frontend, Full Stack, Data Science,
  Machine Learning, DevOps, Mobile, Cybersecurity, Other
- If something is missing, infer reasonably.
- Output JSON only. No explanation.

Resume:
{resume_text}
"""

    response = await call_llm(
        prompt=prompt,
        temperature=TEMPERATURE_LOW,
        max_tokens=500
    )

    try:
        structured_data = json.loads(response)
    except json.JSONDecodeError:
        # Clean if LLM wraps JSON in markdown
        cleaned = response.strip().replace("```json", "").replace("```", "")
        structured_data = json.loads(cleaned)

    _validate_resume_structure(structured_data)

    return structured_data


# -----------------------------------------
# Validation Layer
# -----------------------------------------

def _validate_resume_structure(data: dict):
    """
    Validates that the extracted resume dictionary contains all mandatory
    fields and correct data types expected by the system logic.
    """
    required_keys = {
        "candidate_name",
        "skills",
        "projects",
        "experience_years",
        "primary_domain"
    }

    if not all(key in data for key in required_keys):
        raise HTTPException(
            status_code=500,
            detail="Resume structure incomplete."
        )

    if not isinstance(data["skills"], list):
        raise HTTPException(
            status_code=500,
            detail="Skills must be a list."
        )

    if not isinstance(data["projects"], list):
        raise HTTPException(
            status_code=500,
            detail="Projects must be a list."
        )