"""
Answer routes - Submit and retrieve candidate answers.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List

from app.models import AnswerCreate, AnswerOut
from app.database import get_answers_for_interview, get_interview, get_question, create_answer as db_create_answer
from app.routes.auth import get_current_user
from app.services.scoring_engine import score_answer

router = APIRouter(prefix="/api/answers", tags=["answers"])


@router.post("/", response_model=AnswerOut)
def submit_answer(answer: AnswerCreate, current_user: dict = Depends(get_current_user)):
    iv = get_interview(answer.interview_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")

    q = get_question(answer.question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    # Score the answer
    score_result = score_answer(answer.text, q["text"])

    a = db_create_answer(
        question_id=answer.question_id,
        interview_id=answer.interview_id,
        candidate_id=current_user["id"],
        text=answer.text,
        score=score_result["score"],
        feedback=score_result["feedback"],
    )
    return AnswerOut(**a)


@router.get("/{interview_id}", response_model=List[AnswerOut])
def get_answers(interview_id: str):
    iv = get_interview(interview_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")

    answers = get_answers_for_interview(interview_id)
    return [AnswerOut(**a) for a in answers]
