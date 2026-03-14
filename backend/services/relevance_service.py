from services.openai_client import call_llm
from config import TEMPERATURE_LOW
import json


async def calculate_relevance(jd_profile: dict, resume_profile: dict):
    """
    Hybrid AI-based relevance scoring.
    Compares JD and Resume semantically.
    """

    prompt = f"""
You are an expert AI hiring evaluator.

Compare the following Job Description profile and Resume profile.

Evaluate how well the resume aligns with the JD.

Consider:
- Required skills match
- Preferred skills match
- Experience alignment
- Domain alignment
- Project relevance

Return STRICT JSON only in this format:

{{
  "relevance_score": 0-100,
  "match_summary": "",
  "decision": "REJECT" or "PARTIAL" or "PROCEED"
}}

JD Profile:
{jd_profile}

Resume Profile:
{resume_profile}
"""

    response = await call_llm(
        prompt=prompt,
        temperature=TEMPERATURE_LOW,
        max_tokens=300
    )

    try:
        return json.loads(response)
    except json.JSONDecodeError:
        cleaned = response.strip().replace("```json", "").replace("```", "")
        return json.loads(cleaned)