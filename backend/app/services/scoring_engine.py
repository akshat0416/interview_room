"""
Scoring engine - Placeholder scoring logic for candidate answers.
"""
import random


def score_answer(answer_text: str, question_text: str) -> dict:
    """
    Placeholder scoring logic.
    In production, this would use NLP models to evaluate answers.
    Returns a score (0-10) and feedback text.
    """
    if not answer_text or len(answer_text.strip()) < 10:
        return {
            "score": round(random.uniform(1.0, 3.0), 1),
            "feedback": "Answer is too brief. Please provide more detail.",
        }

    word_count = len(answer_text.split())

    if word_count > 50:
        score = round(random.uniform(7.0, 9.5), 1)
        feedback = "Comprehensive answer with good depth of knowledge."
    elif word_count > 20:
        score = round(random.uniform(5.0, 7.5), 1)
        feedback = "Adequate answer. Consider providing more specific examples."
    else:
        score = round(random.uniform(3.0, 5.5), 1)
        feedback = "Answer could be more detailed. Try to include concrete examples."

    return {"score": score, "feedback": feedback}
