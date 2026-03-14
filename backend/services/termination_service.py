# services/termination_service.py

MAX_QUESTIONS = 12  # Max questions for mock interview
MIN_QUESTIONS_BEFORE_DECISION = 4
WEAK_THRESHOLD = 3

def should_terminate_interview(state, mock_mode=True):
    """
    Determines whether the interview should end.
    
    In mock mode:
        - Never terminate early for weak answers
        - Only terminate when all skills are covered or max questions reached
    """
    required_skills = set(state.jd_profile.get("required_skills", []))
    covered_skills = set(state.covered_skills)

    # Safety cap: max questions
    if state.total_questions >= MAX_QUESTIONS:
        return True, "Maximum question limit reached."

    # In real mode: terminate if performance is weak
    if not mock_mode:
        if (
            state.total_questions >= MIN_QUESTIONS_BEFORE_DECISION
            and state.average_score() <= WEAK_THRESHOLD
        ):
            return True, "Candidate performance consistently weak."

    # Terminate if all skills are covered
    if required_skills and required_skills.issubset(covered_skills):
        return True, "All required skills evaluated."

    # Otherwise continue
    return False, "Continue interview."