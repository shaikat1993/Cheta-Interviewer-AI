# services/report_service.py

def generate_report(state):
    """
    Converts InterviewState into a structured report suitable for dashboard.
    Aggregates scores, strengths, improvements, and logs.
    """
    detailed_log = getattr(state, "interview_log", [])
    
    # Check if there is a pending question that was asked but not answered
    # due to premature termination of the interview
    if hasattr(state, "previous_question") and state.previous_question:
        pending_question = state.previous_question
        pending_skill = getattr(state, "current_skill", "General")
        
        # Determine if this question is already in the log
        # If the last logged question matches this one, it was answered
        last_logged_q = detailed_log[-1].get("question") if detailed_log else None
        
        if last_logged_q != pending_question:
            # Create a zeroed-out evaluation entry for the unanswered question
            termination_entry = {
                "question_number": len(detailed_log) + 1,
                "skill": pending_skill,
                "question": pending_question,
                "answer": "[Interview terminated by user before answering]",
                "evaluation": {
                    "technical": 0,
                    "depth": 0,
                    "clarity": 0,
                    "confidence": 0,
                    "technical_accuracy": 0,
                    "response_depth": 0,
                    "clarity_structure": 0,
                    "confidence_tone": 0,
                    "overall_rating": 0,
                    "strengths": "",
                    "improvements": "No answer provided. Candidate terminated the interview."
                }
            }
            detailed_log = detailed_log + [termination_entry]

    total_questions = len(detailed_log) if detailed_log else max(state.total_questions, 1)

    # Initialize sums
    total_tech = total_depth = total_clarity = total_confidence = 0
    strengths = []
    improvements = []

    for idx, log in enumerate(detailed_log, 1):
        eval_ = log.get("evaluation", {})
        tech = eval_.get("technical", 0)
        depth = eval_.get("depth", 0)
        clarity = eval_.get("clarity", 0)
        confidence = eval_.get("confidence", 0)

        total_tech += tech
        total_depth += depth
        total_clarity += clarity
        total_confidence += confidence

        # Flatten comma-separated strengths/improvements
        s = eval_.get("strengths", "")
        if s:
            strengths.extend([x.strip() for x in s.split(",") if x.strip()])

        i = eval_.get("improvements", "")
        if i:
            improvements.extend([x.strip() for x in i.split(",") if x.strip()])

        # Ensure question_number & skill exist for frontend
        log.setdefault("question_number", idx)
        log.setdefault("skill", "General")
        log.setdefault("question", "")
        log.setdefault("answer", "")

    # Compute averages
    avg_tech = round(total_tech / total_questions, 2)
    avg_depth = round(total_depth / total_questions, 2)
    avg_clarity = round(total_clarity / total_questions, 2)
    avg_confidence = round(total_confidence / total_questions, 2)
    overall_score = round((avg_tech + avg_depth + avg_clarity + avg_confidence) / 4, 2)

    return {
        "total_questions": total_questions,
        "overall_score": overall_score,
        "technical": avg_tech,
        "depth": avg_depth,
        "clarity": avg_clarity,
        "confidence": avg_confidence,
        "strengths": strengths,
        "improvements": improvements,
        "covered_skills": list(getattr(state, "covered_skills", [])),
        "detailed_log": detailed_log
    }