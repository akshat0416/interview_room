"""
Question routes - CRUD for interview questions.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List

from app.models import QuestionCreate, QuestionOut
from app.database import get_questions_for_interview, get_interview, create_question as db_create_question
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/questions", tags=["questions"])


@router.get("/{interview_id}", response_model=List[QuestionOut])
def get_questions(interview_id: str):
    iv = get_interview(interview_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")

    questions = get_questions_for_interview(interview_id)
    return [QuestionOut(**q) for q in questions]


@router.post("/", response_model=QuestionOut)
def create_question(question: QuestionCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create questions")

    iv = get_interview(question.interview_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")

    q = db_create_question(
        interview_id=question.interview_id,
        category=question.category.value,
        difficulty=question.difficulty.value,
        text=question.text,
    )
    return QuestionOut(**q)
