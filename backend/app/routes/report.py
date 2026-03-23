"""
Report routes - Generate interview reports.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List

from app.models import ReportOut
from app.database import get_all_interviews, get_interview, get_questions_for_interview, get_answers_for_interview
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/", response_model=List[ReportOut])
def get_all_reports(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view all reports")

    reports = []
    for iv in get_all_interviews():
        report = _build_report(iv)
        reports.append(report)
    return reports


@router.get("/{interview_id}", response_model=ReportOut)
def get_report(interview_id: str, current_user: dict = Depends(get_current_user)):
    iv = get_interview(interview_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Candidates can only see their own reports
    if current_user["role"] == "candidate" and iv["candidate_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return _build_report(iv)


def _build_report(iv: dict) -> ReportOut:
    iv_questions = get_questions_for_interview(iv["id"])
    iv_answers = get_answers_for_interview(iv["id"])

    questions_detail = []
    for q in iv_questions:
        answer = next((a for a in iv_answers if a["question_id"] == q["id"]), None)
        questions_detail.append({
            "question_id": q["id"],
            "category": q["category"],
            "difficulty": q["difficulty"],
            "text": q["text"],
            "answer": answer["text"] if answer else None,
            "score": answer["score"] if answer else None,
            "feedback": answer["feedback"] if answer else None,
        })

    scores = [q["score"] for q in questions_detail if q["score"] is not None]
    avg_score = sum(scores) / len(scores) if scores else None

    return ReportOut(
        interview_id=iv["id"],
        candidate_name=iv["candidate_name"],
        role_title=iv["role_title"],
        domain=iv["domain"],
        status=iv["status"],
        total_questions=len(iv_questions),
        answered_questions=len(iv_answers),
        average_score=avg_score,
        questions=questions_detail,
    )
