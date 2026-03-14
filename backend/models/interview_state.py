"""
models/interview_state.py

Defines the `InterviewState` class, which serves as the central memory object
for tracking a single candidate's session, including their JD, resume profile,
score history, and a detailed log of questions asked.
"""

class InterviewState:
    """
    Central memory object controlling the interview session.
    Tracks progress, scores, and detailed logs.
    """

    def __init__(self):
        # JD + Resume
        self.jd_profile = {}
        self.resume_profile = {}
        self.relevance_score = 0.0

        # Flow Control
        self.total_questions = 0
        self.is_active = True
        self.previous_question = None
        self.previous_answer = None
        self.followup_depth = 0
        self.covered_skills = set()
        self.asked_questions = []

        # Performance
        self.scores = []
        self.evaluations = []
        # Full detailed log
        self.interview_log = []

    # --- Scores ---
    def add_score(self, score: float):
        """Appends a new score from the latest answer evaluation."""
        self.scores.append(score)

    def average_score(self):
        """Calculates the current average score."""
        return round(sum(self.scores)/len(self.scores), 2) if self.scores else 0.0

    # --- Question Tracking ---
    def increment_question_count(self):
        """Increments the total number of questions asked during this session."""
        self.total_questions += 1

    def end_interview(self):
        """Marks the interview session as complete/inactive."""
        self.is_active = False

    # --- Logging ---
    def log_interaction(self, question_number, skill, question, answer, evaluation):
        """Records a single Q&A interaction and its evaluation into the master log."""
        log_entry = {
            "question_number": question_number,
            "skill": skill,
            "question": question,
            "answer": answer,
            "evaluation": evaluation
        }
        self.interview_log.append(log_entry)