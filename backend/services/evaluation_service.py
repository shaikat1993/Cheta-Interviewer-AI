"""
services/evaluation_service.py

Evaluates a candidate's answer against the asked question using the LLM.
Each answer is scored across multiple rubrics independently.

Rubrics:
- Technical Accuracy
- Response Depth
- Clarity & Structure
- Confidence & Tone

Scores are 0–10 for each rubric and converted to an overall rating out of 100.
"""

import json
from services.openai_client import call_llm


async def evaluate_answer(state):
    """
    Evaluate the candidate's last answer.

    Args:
        state: InterviewState object containing previous question and answer.

    Returns:
        dict containing rubric scores and feedback.
    """

    question = state.previous_question or ""
    answer = state.previous_answer or ""

    prompt = f"""
You are a professional technical interviewer evaluating a candidate answer.

Evaluate the answer across multiple rubrics independently.

Each rubric must be scored from 0 to 10.

Evaluation Rubrics:

1. Technical Accuracy
- Are the technical concepts correct?

2. Response Depth
- How deeply the candidate explains the topic
- Whether important aspects are covered

3. Clarity & Structure
- Is the answer organized logically?
- Is it easy to understand?

4. Confidence & Tone
- Does the candidate sound confident and professional?

Scoring Guide:

0-2   Completely incorrect
3-4   Weak understanding
5-6   Basic but acceptable
7-8   Good answer
9     Excellent answer
10    Expert level

IMPORTANT:
Each rubric must be evaluated independently.
Do NOT give identical scores unless performance truly matches.

Return STRICT JSON ONLY in the following format:

{{
"technical_accuracy": number,
"response_depth": number,
"clarity_structure": number,
"confidence_tone": number,
"strengths": "text",
"improvements": "text"
}}

Question:
{question}

Candidate Answer:
{answer}
"""

    import time
    start_time = time.time()
    
    raw_eval = await call_llm(
        prompt=prompt,
        max_tokens=300,
        temperature=0.2
    )
    
    evaluation_duration = time.time() - start_time

    try:
        print("RAW LLM EVALUATION:", raw_eval)
        evaluation = json.loads(raw_eval)

        # Extract rubric scores
        tech = evaluation.get("technical_accuracy", 0)
        depth = evaluation.get("response_depth", 0)
        clarity = evaluation.get("clarity_structure", 0)
        confidence = evaluation.get("confidence_tone", 0)

        # Calculate overall rating (0–100)
        avg_score = (tech + depth + clarity + confidence) / 4
        overall_rating = round(avg_score * 10)

        evaluation["overall_rating"] = overall_rating

        # Store evaluation history if state supports it
        if hasattr(state, "evaluations"):
            state.evaluations.append({
                "question": question,
                "answer": answer,
                "evaluation": evaluation
            })

        return {
    "technical": tech * 10,
    "depth": depth * 10,
    "clarity": clarity * 10,
    "confidence": confidence * 10,
    "technical_accuracy": tech,
    "response_depth": depth,
    "clarity_structure": clarity,
    "confidence_tone": confidence,
    "overall_rating": overall_rating,
    "strengths": evaluation.get("strengths", ""),
    "improvements": evaluation.get("improvements", ""),
    "evaluation_duration": evaluation_duration
}

    except json.JSONDecodeError:

        # Fallback if LLM output is not valid JSON
        fallback = {
            "technical_accuracy": 0,
            "response_depth": 0,
            "clarity_structure": 0,
            "confidence_tone": 0,
            "overall_rating": 0,
            "strengths": "",
            "improvements": "Evaluation failed due to JSON parsing error.",
            "evaluation_duration": evaluation_duration
        }

        if hasattr(state, "evaluations"):
            state.evaluations.append({
                "question": question,
                "answer": answer,
                "evaluation": fallback
            })

        return fallback


def calculate_interview_summary(state):
    """
    Calculates the final interview metrics from all evaluations.

    Returns:
        dict containing averaged metrics and final score.
    """

    if not hasattr(state, "evaluations") or len(state.evaluations) == 0:
        return {
            "technical_accuracy": 0,
            "response_depth": 0,
            "clarity_structure": 0,
            "confidence_tone": 0,
            "overall_rating": 0
        }

    total_tech = 0
    total_depth = 0
    total_clarity = 0
    total_confidence = 0
    count = len(state.evaluations)

    for e in state.evaluations:
        ev = e["evaluation"]
        total_tech += ev.get("technical_accuracy", 0)
        total_depth += ev.get("response_depth", 0)
        total_clarity += ev.get("clarity_structure", 0)
        total_confidence += ev.get("confidence_tone", 0)

    avg_tech = round((total_tech / count) * 10)
    avg_depth = round((total_depth / count) * 10)
    avg_clarity = round((total_clarity / count) * 10)
    avg_confidence = round((total_confidence / count) * 10)

    overall = round((avg_tech + avg_depth + avg_clarity + avg_confidence) / 4)

    return {
        "technical_accuracy": avg_tech,
        "response_depth": avg_depth,
        "clarity_structure": avg_clarity,
        "confidence_tone": avg_confidence,
        "overall_rating": overall
    }