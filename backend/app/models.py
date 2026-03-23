from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    candidate = "candidate"


class InterviewStatus(str, Enum):
    scheduled = "Scheduled"
    in_progress = "In Progress"
    completed = "Completed"
    pending_review = "Pending Review"


class QuestionCategory(str, Enum):
    technical = "Technical"
    leadership = "Leadership"
    soft_skills = "Soft Skills"
    system_design = "System Design"
    best_practices = "Best Practices"
    problem_solving = "Problem Solving"
    introduction = "Introduction"
    experience = "Experience"
    behavioral = "Behavioral"
    closing = "Closing"
    general = "General"


class QuestionDifficulty(str, Enum):
    easy = "Easy"
    medium = "Medium"
    hard = "Hard"


# Auth models
class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: UserRole = UserRole.candidate


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    user_id: str = ""


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole


# Interview models
class InterviewCreate(BaseModel):
    candidate_id: str
    role_title: str
    domain: str
    scheduled_date: str
    scheduled_time: str
    duration_minutes: int = 60


class InterviewOut(BaseModel):
    id: str
    candidate_id: str
    candidate_name: str
    role_title: str
    domain: str
    scheduled_date: str
    scheduled_time: str
    duration_minutes: int
    status: InterviewStatus


# Question models
class QuestionCreate(BaseModel):
    interview_id: str
    category: QuestionCategory
    difficulty: QuestionDifficulty
    text: str


class QuestionOut(BaseModel):
    id: str
    interview_id: str
    category: QuestionCategory
    difficulty: QuestionDifficulty
    text: str
    asked_at: Optional[str] = None


# Answer models
class AnswerCreate(BaseModel):
    question_id: str
    interview_id: str
    text: str


class AnswerOut(BaseModel):
    id: str
    question_id: str
    interview_id: str
    candidate_id: str
    text: str
    score: Optional[float] = None
    feedback: Optional[str] = None


# Report model
class ReportOut(BaseModel):
    interview_id: str
    candidate_name: str
    role_title: str
    domain: str
    status: InterviewStatus
    total_questions: int
    answered_questions: int
    average_score: Optional[float] = None
    questions: List[dict] = []
