"""
AI Interview Room - FastAPI Backend with Socket.IO
"""
import os
import socketio
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List

from app.config import CORS_ORIGINS
from app.routes import auth, questions, answers, report
from app import database as db
from app.email_service import send_interview_invitation_email

# Socket.IO server
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=CORS_ORIGINS,
)

# FastAPI app
app = FastAPI(
    title="AI Interview Room API",
    description="Backend API for Blue Planet Solutions AI Interview Platform",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(os.path.join(UPLOAD_DIR, "resumes"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "photos"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "recordings"), exist_ok=True)

# Serve static uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(questions.router)
app.include_router(answers.router)
app.include_router(report.router)


# ===== INTERVIEW ENDPOINTS =====

@app.get("/api/interviews")
def get_interviews():
    return db.get_all_interviews()




@app.get("/api/interviews/candidate/{candidate_id}")
def get_candidate_interviews(candidate_id: str):
    return db.get_interviews_for_candidate(candidate_id)


class InterviewCreateBody(BaseModel):
    candidate_id: str
    candidate_name: str = ""
    role_title: str = ""
    domain: str = ""
    scheduled_date: str = ""
    scheduled_time: str = ""
    duration_minutes: int = 60
    questions: Optional[List[dict]] = None


@app.post("/api/interviews")
def create_interview(body: InterviewCreateBody):
    iv = db.create_interview(
        candidate_id=body.candidate_id,
        candidate_name=body.candidate_name,
        role_title=body.role_title,
        domain=body.domain,
        scheduled_date=body.scheduled_date,
        scheduled_time=body.scheduled_time,
        duration_minutes=body.duration_minutes,
    )
    # Create questions for this interview
    if body.questions:
        for i, q in enumerate(body.questions):
            db.create_question(
                interview_id=iv["id"],
                category=q.get("category", "General"),
                difficulty=q.get("difficulty", "Medium"),
                text=q["text"],
                order=i,
            )
    return iv


class InterviewCompleteBody(BaseModel):
    duration_seconds: int = 0


@app.post("/api/interviews/{interview_id}/complete")
async def complete_interview(interview_id: str, body: InterviewCompleteBody):
    iv = db.complete_interview(interview_id, body.duration_seconds)
    if not iv:
        return {"error": "Not found"}
    await sio.emit("dashboard_update", {"action": "refresh"})
    return iv



@app.patch("/api/interviews/{interview_id}/status")
async def update_interview_status(interview_id: str, status: str):
    iv = db.update_interview_status(interview_id, status)
    if not iv:
        return {"error": "Not found"}
    await sio.emit("dashboard_update", {"action": "refresh"})
    return iv



@app.patch("/api/interviews/{interview_id}/trigger-ai")
async def trigger_ai_interview(interview_id: str):
    """Admin triggers an AI-conducted interview."""
    conn = db.get_db()
    conn.execute(
        "UPDATE interviews SET is_ai_interview = 1 WHERE id = ?",
        (interview_id,)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM interviews WHERE id = ?", (interview_id,)).fetchone()
    conn.close()
    await sio.emit("dashboard_update", {"action": "refresh"})
    return dict(row) if row else {"error": "Not found"}



@app.patch("/api/interviews/{interview_id}/set-live")
async def set_live_interview(interview_id: str):
    """Admin joins as live interviewer."""
    conn = db.get_db()
    conn.execute(
        "UPDATE interviews SET is_ai_interview = 0 WHERE id = ?",
        (interview_id,)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM interviews WHERE id = ?", (interview_id,)).fetchone()
    conn.close()
    await sio.emit("dashboard_update", {"action": "refresh"})
    return dict(row) if row else {"error": "Not found"}



class AnswerSaveBody(BaseModel):
    question_id: str
    question_text: str = ""
    answer_text: str
    candidate_id: str


@app.post("/api/interviews/{interview_id}/answers")
def save_interview_answer(interview_id: str, body: AnswerSaveBody):
    """Save a single answer during an active interview."""
    from app.services.scoring_engine import score_answer
    # Ensure question exists (create if needed for inline questions)
    q = db.get_question(body.question_id)
    if not q and body.question_text:
        q = db.create_question(
            interview_id=interview_id,
            category="General",
            difficulty="Medium",
            text=body.question_text,
            order=0,
        )
        body.question_id = q["id"]

    score_result = score_answer(body.answer_text, body.question_text or (q["text"] if q else ""))
    answer = db.create_answer(
        question_id=body.question_id if q else "inline",
        interview_id=interview_id,
        candidate_id=body.candidate_id,
        text=body.answer_text,
        score=score_result["score"],
        feedback=score_result["feedback"],
    )
    return answer


# ===== CANDIDATES ENDPOINT =====

@app.get("/api/candidates")
def get_candidates():
    """Return all candidates with their profile data (live data only)."""
    return db.get_all_candidates()


@app.post("/api/users/update_admin")
def update_admin(user_id: str = Form(...), new_name: str = Form(None), 
                 old_password: str = Form(None), new_password: str = Form(None)):
    """Update Admin profile details (Name and/or Password)"""
    result = db.update_admin_credentials(
        user_id=user_id,
        new_name=new_name,
        old_password=old_password,
        new_password=new_password
    )
    if "error" in result:
        return result
    return {"message": "Admin profile updated successfully", "user": result}

# ===== PROFILE ENDPOINTS =====

@app.get("/api/profile/{user_id}")
def get_profile(user_id: str):
    """Get a candidate's profile."""
    profile = db.get_profile(user_id)
    if not profile:
        return {"error": "User not found"}
    return profile


class ProfileUpdateIn(BaseModel):
    full_name: str = ""
    email: str = ""
    mobile: str = ""
    skills: str = ""
    role_applied: str = ""
    location: str = ""
    experience: str = ""
    education: str = ""
    availability: str = ""
    linkedin_url: str = ""
    github_url: str = ""

@app.post("/api/profile/{user_id}")
def update_profile(user_id: str, data: ProfileUpdateIn):
    """Create or update candidate profile."""
    skills_list = [s.strip() for s in data.skills.split(",") if s.strip()] if data.skills else []
    return db.upsert_profile(
        user_id, data.full_name, data.email, data.mobile, skills_list, data.role_applied,
        data.location, data.experience, data.education, data.availability, data.linkedin_url, data.github_url
    )


@app.post("/api/profile/{user_id}/resume")
async def upload_resume(user_id: str, file: UploadFile = File(...)):
    """Upload resume (PDF only)."""
    if not file.filename.lower().endswith(".pdf"):
        return {"error": "Only PDF files are accepted"}
    filename = f"{user_id}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, "resumes", filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    resume_url = f"/uploads/resumes/{filename}"
    db.update_profile_field(user_id, "resume_url", resume_url)
    return {"resume_url": resume_url}


@app.post("/api/profile/{user_id}/photo")
async def upload_photo(user_id: str, file: UploadFile = File(...)):
    """Upload profile picture."""
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "png"
    filename = f"{user_id}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, "photos", filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    photo_url = f"/uploads/photos/{filename}"
    db.update_profile_field(user_id, "profile_picture", photo_url)
    return {"profile_picture": photo_url}


@app.post("/api/interviews/{interview_id}/recording")
async def upload_recording(interview_id: str, file: UploadFile = File(...)):
    """Upload an interview recording (webm)."""
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "webm"
    filename = f"{interview_id}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, "recordings", filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    recording_url = f"/uploads/recordings/{filename}"
    # Update interview record
    conn = db.get_db()
    conn.execute("UPDATE interviews SET recording_url = ? WHERE id = ?", (recording_url, interview_id))
    conn.commit()
    conn.close()
    return {"recording_url": recording_url}


# ===== ROLES ENDPOINTS =====

class RoleIn(BaseModel):
    title: str
    domain: str
    description: str
    work_type: str = ""

class RoleUpdateIn(BaseModel):
    title: Optional[str] = None
    domain: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    work_type: Optional[str] = None

@app.get("/api/roles")
def get_roles(active_only: bool = False):
    return db.get_all_roles(active_only)

@app.get("/api/roles/{role_id}")
def get_role(role_id: str):
    role = db.get_role_by_id(role_id)
    if not role:
        return {"error": "Role not found"}
    return role

@app.post("/api/roles")
def create_role(body: RoleIn):
    return db.create_role(body.title, body.domain, body.description, body.work_type)

@app.put("/api/roles/{role_id}")
def update_role(role_id: str, body: RoleUpdateIn):
    return db.update_role(role_id, body.title, body.domain, body.description, body.is_active, body.work_type)

@app.delete("/api/roles/{role_id}")
def delete_role(role_id: str):
    return db.delete_role(role_id)

# ===== APPLICATIONS ENDPOINTS =====

# Booked slots for schedule modal
@app.get("/api/interviews/booked-slots")
def get_booked_slots(date: str = ""):
    if not date:
        return {"booked_slots": []}
    return {"booked_slots": db.get_booked_slots(date)}

class ApplicationIn(BaseModel):
    candidate_id: str
    role_id: str

class ApplicationUpdateIn(BaseModel):
    status: str
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    interview_type: Optional[str] = None
    topic_name: Optional[str] = None
    role_title: Optional[str] = None
    domain: Optional[str] = None

@app.post("/api/applications")
async def create_application(body: ApplicationIn):
    result = db.create_application(body.candidate_id, body.role_id)
    # Notify all admin users about the new application
    try:
        user = db.get_user_by_id(body.candidate_id)
        role = db.get_role_by_id(body.role_id)
        cand_name = user["name"] if user else "A candidate"
        role_title = role["title"] if role else "a role"
        admin_ids = db.get_admin_user_ids()
        for aid in admin_ids:
            db.create_notification(aid, f"{cand_name} has applied for {role_title}.")
    except Exception:
        pass
    await sio.emit("dashboard_update", {"action": "refresh"})
    return result


@app.get("/api/applications")
def get_all_applications():
    return db.get_all_applications()


@app.get("/api/interviews/{interview_id}")
def get_interview(interview_id: str):
    """Moved here to avoid shadowing /booked-slots or /candidate etc."""
    iv = db.get_interview(interview_id)
    if not iv:
        return {"error": "Not found"}
    return iv


@app.get("/api/applications/candidate/{candidate_id}")
def get_applications_by_candidate(candidate_id: str):
    return db.get_applications_by_candidate(candidate_id)

@app.patch("/api/applications/{app_id}/status")
async def update_application_status(app_id: str, body: ApplicationUpdateIn):
    app_data = db.update_application_status(app_id, body.status)

    # If approved, automatically create an interview for the candidate (only if one doesn't exist)
    if app_data and body.status == 'Approved':
        # Check if interview already exists for this candidate + role
        conn = db.get_db()
        existing = conn.execute(
            "SELECT id FROM interviews WHERE candidate_id = ? AND role_title = ?",
            (app_data["candidate_id"], app_data["role_title"])
        ).fetchone()
        conn.close()

        if not existing:
            # Default questions for a newly spawned interview
            DEFAULT_QUESTIONS = [
                {"category": "Introduction", "text": "Can you tell me a little about yourself and your background?"},
                {"category": "Experience", "text": "Describe a challenging project you've worked on recently."},
                {"category": "Technical", "text": "What are your strongest technical skills?"},
                {"category": "Behavioral", "text": "How do you handle disagreements with team members?"},
                {"category": "Closing", "text": "Why do you want to join our company?"}
            ]

            sched_date = body.scheduled_date or ""
            sched_time = body.scheduled_time or ""
            iv_type = body.interview_type or "AI"
            topic_name = body.topic_name or ""
            is_ai = 1 if iv_type == "AI" else 0
            
            final_role = body.role_title if body.role_title else app_data["role_title"]
            final_domain = body.domain if body.domain else app_data["role_domain"]

            iv = db.create_interview(
                candidate_id=app_data["candidate_id"],
                candidate_name=app_data["candidate_name"],
                role_title=final_role,
                domain=final_domain,
                scheduled_date=sched_date,
                scheduled_time=sched_time,
                duration_minutes=60,
                topic_name=topic_name
            )

            # Set interview_type and is_ai_interview
            conn = db.get_db()
            conn.execute(
                "UPDATE interviews SET interview_type = ?, is_ai_interview = ? WHERE id = ?",
                (iv_type, is_ai, iv["id"])
            )
            conn.commit()
            conn.close()

            for i, q in enumerate(DEFAULT_QUESTIONS):
                db.create_question(
                    interview_id=iv["id"],
                    category=q["category"],
                    difficulty="Medium",
                    text=q["text"],
                    order=i
                )

            # Create notification for the candidate
            if sched_date and sched_time:
                notif_msg = f"Your interview for {final_role} has been scheduled on {sched_date} at {sched_time} ({iv_type} Interview)."
            else:
                notif_msg = f"Your application for {final_role} has been approved! Your interview will be scheduled soon."
            db.create_notification(app_data["candidate_id"], notif_msg)
            # Emit a targeted notification event
            await sio.emit("new_notification", {
                "user_id": app_data["candidate_id"],
                "message": notif_msg
            })

            # Send interview invitation email
            if sched_date and sched_time:
                try:
                    candidate_user = db.get_user_by_id(app_data["candidate_id"])
                    if candidate_user:
                        send_interview_invitation_email(
                            candidate_name=app_data["candidate_name"],
                            candidate_email=candidate_user["email"],
                            role_title=final_role,
                            scheduled_date=sched_date,
                            scheduled_time=sched_time,
                            interview_id=iv["id"],
                        )
                except Exception:
                    pass  # Never block approval flow due to email failure
        else:
            # Update the existing interview with new schedule data
            sched_date = body.scheduled_date if body.scheduled_date is not None else ""
            sched_time = body.scheduled_time if body.scheduled_time is not None else ""
            iv_type = body.interview_type or "AI"
            topic_name = body.topic_name or ""
            is_ai = 1 if iv_type == "AI" else 0
            final_role = body.role_title if body.role_title else app_data["role_title"]
            final_domain = body.domain if body.domain else app_data["role_domain"]

            conn = db.get_db()
            conn.execute(
                """
                UPDATE interviews 
                SET scheduled_date = COALESCE(NULLIF(?, ''), scheduled_date), 
                    scheduled_time = COALESCE(NULLIF(?, ''), scheduled_time), 
                    interview_type = COALESCE(NULLIF(?, ''), interview_type), 
                    is_ai_interview = ?, 
                    topic_name = COALESCE(NULLIF(?, ''), topic_name),
                    role_title = ?,
                    domain = ?,
                    status = 'Scheduled'
                WHERE id = ?
                """,
                (sched_date, sched_time, iv_type, is_ai, topic_name, final_role, final_domain, existing["id"])
            )
            conn.commit()
            conn.close()

            # Create notification for the candidate that their interview was updated/scheduled
            if sched_date and sched_time:
                notif_msg = f"Your interview for {final_role} has been scheduled on {sched_date} at {sched_time} ({iv_type} Interview)."
                db.create_notification(app_data["candidate_id"], notif_msg)
                await sio.emit("new_notification", {
                    "user_id": app_data["candidate_id"],
                    "message": notif_msg
                })

                # Send interview invitation email (re-scheduled)
                try:
                    candidate_user = db.get_user_by_id(app_data["candidate_id"])
                    if candidate_user:
                        send_interview_invitation_email(
                            candidate_name=app_data["candidate_name"],
                            candidate_email=candidate_user["email"],
                            role_title=final_role,
                            scheduled_date=sched_date,
                            scheduled_time=sched_time,
                            interview_id=existing["id"],
                        )
                except Exception:
                    pass  # Never block approval flow due to email failure

    # Notify candidate on rejection
    if app_data and body.status == 'Rejected':
        reject_msg = f"Your application for {app_data['role_title']} has been reviewed. Unfortunately, we will not be proceeding at this time."
        db.create_notification(app_data["candidate_id"], reject_msg)
        await sio.emit("new_notification", {
            "user_id": app_data["candidate_id"],
            "message": reject_msg
        })

    # Notify candidate on selection
    if app_data and body.status == 'Selected':
        select_msg = f"Congratulations! You have been selected for the {app_data['role_title']} position!"
        db.create_notification(app_data["candidate_id"], select_msg)
        await sio.emit("new_notification", {
            "user_id": app_data["candidate_id"],
            "message": select_msg
        })

    # Trigger global dashboard update to sync all admin tabs and candidate views
    await sio.emit("dashboard_update", {"action": "refresh"})
    return app_data


# ===== NOTIFICATIONS ENDPOINTS =====

@app.get("/api/notifications/{user_id}")
def get_user_notifications(user_id: str):
    return db.get_notifications(user_id)


@app.patch("/api/notifications/{notification_id}/read")
def mark_notif_read(notification_id: str):
    db.mark_notification_read(notification_id)
    return {"success": True}


# ===== STATS =====

@app.get("/api/stats")
def get_stats():
    return db.get_stats()


@app.get("/")
def root():
    return {"message": "AI Interview Room API", "status": "running"}


# --- Socket.IO Events ---

# Track active rooms
active_rooms: dict = {}


@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")


@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    for room_id, room in list(active_rooms.items()):
        if sid in room.get("participants", []):
            room["participants"].remove(sid)
            await sio.emit("participant_left", {"sid": sid}, room=room_id)


@sio.event
async def join_interview(sid, data):
    room_id = data.get("interview_id")
    role = data.get("role", "candidate")
    name = data.get("name", "Unknown")

    if room_id not in active_rooms:
        active_rooms[room_id] = {"participants": [], "admin_sids": [], "candidate_sids": []}

    active_rooms[room_id]["participants"].append(sid)

    if role == "admin":
        active_rooms[room_id]["admin_sids"].append(sid)
    else:
        active_rooms[room_id]["candidate_sids"].append(sid)

    await sio.enter_room(sid, room_id)
    await sio.emit("user_joined", {
        "sid": sid,
        "role": role,
        "name": name,
    }, room=room_id)

    # Notify existing participants to trigger WebRTC connection
    await sio.emit("participant_joined", {
        "sid": sid,
        "role": role,
        "name": name,
    }, room=room_id, skip_sid=sid)


@sio.event
async def webrtc_signal(sid, data):
    """Forward WebRTC signaling (offer/answer/ICE) to other participants in the room."""
    room_id = data.get("interview_id")
    signal = data.get("signal")
    if room_id:
        await sio.emit("webrtc_signal", {
            "signal": signal,
            "from": sid,
        }, room=room_id, skip_sid=sid)


@sio.event
async def leave_interview(sid, data):
    room_id = data.get("interview_id")
    if room_id in active_rooms:
        if sid in active_rooms[room_id]["participants"]:
            active_rooms[room_id]["participants"].remove(sid)
        await sio.leave_room(sid, room_id)
        await sio.emit("participant_left", {"sid": sid}, room=room_id)


@sio.event
async def send_question(sid, data):
    room_id = data.get("interview_id")
    question = data.get("question")
    await sio.emit("new_question", {
        "question": question,
        "from": sid,
    }, room=room_id)


@sio.event
async def submit_answer(sid, data):
    room_id = data.get("interview_id")
    answer = data.get("answer")
    question_id = data.get("question_id")
    await sio.emit("answer_submitted", {
        "answer": answer,
        "question_id": question_id,
        "from": sid,
    }, room=room_id)


@sio.event
async def candidate_stream(sid, data):
    """Forward WebRTC signaling data for candidate video stream."""
    room_id = data.get("interview_id")
    signal = data.get("signal")
    if room_id in active_rooms:
        for admin_sid in active_rooms[room_id].get("admin_sids", []):
            await sio.emit("candidate_video_signal", {
                "signal": signal,
                "from": sid,
            }, to=admin_sid)


@sio.event
async def admin_signal(sid, data):
    """Forward WebRTC signaling from admin to candidate."""
    room_id = data.get("interview_id")
    signal = data.get("signal")
    target_sid = data.get("target_sid")
    if target_sid:
        await sio.emit("admin_video_signal", {
            "signal": signal,
            "from": sid,
        }, to=target_sid)


@sio.event
async def interview_progress(sid, data):
    """Broadcast interview progress updates."""
    room_id = data.get("interview_id")
    stage = data.get("stage")
    progress = data.get("progress")
    await sio.emit("progress_update", {
        "stage": stage,
        "progress": progress,
    }, room=room_id)


# Wrap FastAPI with Socket.IO ASGI app
socket_app = socketio.ASGIApp(sio, app)
