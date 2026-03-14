"""
services/jd_service.py

Processes raw Job Description (JD) text to extract structured information
like role title and required skills needed to drive the interview flow.
"""
import json
from fastapi import HTTPException
from services.openai_client import call_llm
from config import TEMPERATURE_LOW


async def analyze_jd(jd_text: str) -> dict:
    """
    Extracts structured information from a raw Job Description text.
    
    Args:
        jd_text: The raw string content of the job description.
        
    Returns:
        A validated dictionary containing the extracted JD details
        (role, required_skills, preferred_skills, experience_level).
    """

    if not jd_text or len(jd_text.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Job Description content too short or empty."
        )

    prompt = f"""
You are a senior technical recruiter.

Extract structured information from the Job Description below.

Return STRICT JSON only in this exact format:

{{
  "role": "string",
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["skillA", "skillB"],
  "experience_level": "Junior | Mid | Senior | Lead | Not Specified"
}}

Rules:
- required_skills must include ONLY mandatory technical skills.
- preferred_skills must include optional/nice-to-have technical skills.
- Remove duplicates.
- Ignore soft skills unless clearly technical.
- If preferred skills are not mentioned, return empty list.
- Infer experience_level from context if possible.
- Output JSON only. No explanation.

Job Description:
\"\"\"
{jd_text}
\"\"\"
"""

    response = await call_llm(
        prompt=prompt,
        temperature=TEMPERATURE_LOW,
        max_tokens=400
    )

    try:
        structured_data = _safe_json_parse(response)
        _validate_jd_structure(structured_data)
        return structured_data

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"JD parsing failed: {str(e)}"
        )


# -----------------------------------------
# Helpers
# -----------------------------------------

def _safe_json_parse(response: str) -> dict:
    """
    Safely parses JSON strings returned by the LLM by stripping out
    potential markdown wrappers (e.g., ```json ... ```) and leading/trailing whitespace.
    """
    cleaned = (
        response.strip()
        .replace("```json", "")
        .replace("```", "")
        .strip()
    )

    return json.loads(cleaned)


def _validate_jd_structure(data: dict):
    """
    Validates that the extracted JD dictionary contains all the
    mandatory fields and correct data types expected by the system.
    """
    required_keys = {
        "role",
        "required_skills",
        "preferred_skills",
        "experience_level"
    }

    if not all(key in data for key in required_keys):
        raise ValueError("JD structure incomplete.")

    if not isinstance(data["required_skills"], list):
        raise ValueError("required_skills must be a list.")

    if not isinstance(data["preferred_skills"], list):
        raise ValueError("preferred_skills must be a list.")