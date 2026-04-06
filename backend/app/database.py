"""
SQLite-backed persistent database for the AI Interview Room application.
All data persists across server restarts.
"""
import os
import uuid
import sqlite3
import json
import bcrypt
from datetime import datetime

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "interview_app.db")


def get_db():
    """Get a database connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))


def init_db():
    """Create tables if they don't exist."""
    conn = get_db()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'candidate',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS profiles (
            user_id TEXT PRIMARY KEY,
            full_name TEXT DEFAULT '',
            email TEXT DEFAULT '',
            mobile TEXT DEFAULT '',
            skills TEXT DEFAULT '[]',
            resume_url TEXT DEFAULT '',
            profile_picture TEXT DEFAULT '',
            role_applied TEXT DEFAULT '',
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS interviews (
            id TEXT PRIMARY KEY,
            candidate_id TEXT NOT NULL,
            candidate_name TEXT DEFAULT '',
            role_title TEXT DEFAULT '',
            domain TEXT DEFAULT '',
            scheduled_date TEXT DEFAULT '',
            scheduled_time TEXT DEFAULT '',
            duration_minutes INTEGER DEFAULT 0,
            actual_duration_seconds INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Scheduled',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            completed_at TEXT,
            FOREIGN KEY (candidate_id) REFERENCES users(id)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            interview_id TEXT NOT NULL,
            category TEXT DEFAULT '',
            difficulty TEXT DEFAULT 'Medium',
            text TEXT NOT NULL,
            asked_at TEXT,
            question_order INTEGER DEFAULT 0,
            FOREIGN KEY (interview_id) REFERENCES interviews(id)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS answers (
            id TEXT PRIMARY KEY,
            question_id TEXT NOT NULL,
            interview_id TEXT NOT NULL,
            candidate_id TEXT NOT NULL,
            text TEXT NOT NULL,
            score REAL DEFAULT 0,
            feedback TEXT DEFAULT '',
            submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (question_id) REFERENCES questions(id),
            FOREIGN KEY (interview_id) REFERENCES interviews(id),
            FOREIGN KEY (candidate_id) REFERENCES users(id)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS job_roles (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            domain TEXT DEFAULT '',
            description TEXT DEFAULT '',
            is_active INTEGER DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS applications (
            id TEXT PRIMARY KEY,
            candidate_id TEXT NOT NULL,
            role_id TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            applied_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (candidate_id) REFERENCES users(id),
            FOREIGN KEY (role_id) REFERENCES job_roles(id)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS proctoring_violations (
            id TEXT PRIMARY KEY,
            interview_id TEXT NOT NULL,
            type TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (interview_id) REFERENCES interviews(id)
        )
    """)

    new_profile_cols = [
        ("location", "TEXT DEFAULT ''"),
        ("experience", "TEXT DEFAULT ''"),
        ("education", "TEXT DEFAULT ''"),
        ("availability", "TEXT DEFAULT ''"),
        ("linkedin_url", "TEXT DEFAULT ''"),
        ("github_url", "TEXT DEFAULT ''"),
    ]
    for col_name, col_type in new_profile_cols:
        try:
            c.execute(f"ALTER TABLE profiles ADD COLUMN {col_name} {col_type}")
        except sqlite3.OperationalError:
            pass # Column already exists

    # Migration: add recording and AI interview columns to interviews table
    interview_new_cols = [
        ("recording_url", "TEXT DEFAULT ''"),
        ("is_ai_interview", "INTEGER DEFAULT 1"),
        ("interview_type", "TEXT DEFAULT 'AI'"),
        ("topic_name", "TEXT DEFAULT ''"),
    ]
    for col_name, col_type in interview_new_cols:
        try:
            c.execute(f"ALTER TABLE interviews ADD COLUMN {col_name} {col_type}")
        except sqlite3.OperationalError:
            pass

    # Migration: add work_type column to job_roles table
    try:
        c.execute("ALTER TABLE job_roles ADD COLUMN work_type TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass

    conn.commit()

    # Seed admin account if not exists
    admin = c.execute("SELECT id FROM users WHERE email = ?", ("admin@blueplanet.com",)).fetchone()
    if not admin:
        admin_id = str(uuid.uuid4())
        c.execute(
            "INSERT INTO users (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)",
            (admin_id, "admin@blueplanet.com", "Admin User", hash_password("admin123"), "admin")
        )
        conn.commit()

    conn.close()


# ===== USER HELPERS =====

def get_user_by_email(email: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_admin_user_ids():
    conn = get_db()
    rows = conn.execute("SELECT id FROM users WHERE role = 'admin'").fetchall()
    conn.close()
    return [row["id"] for row in rows]


def create_user(email: str, name: str, password: str, role: str = "candidate"):
    conn = get_db()
    user_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO users (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)",
        (user_id, email, name, hash_password(password), role)
    )
    conn.commit()
    user = dict(conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone())
    conn.close()
    return user


def update_admin_credentials(user_id: str, old_password: str = None, new_password: str = None, new_name: str = None):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        return {"error": "User not found"}
    
    # Update Name
    if new_name and new_name != user["name"]:
        conn.execute("UPDATE users SET name = ? WHERE id = ?", (new_name, user_id))
    
    # Update Password if provided
    if old_password and new_password:
        if not verify_password(old_password, user["password"]):
            conn.close()
            return {"error": "Incorrect old password."}
        conn.execute("UPDATE users SET password = ? WHERE id = ?", (hash_password(new_password), user_id))
    elif new_password and not old_password:
        conn.close()
        return {"error": "Old password is required to set a new password."}

    conn.commit()
    updated_user = conn.execute("SELECT id, name, email, role FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(updated_user)


def get_all_candidates():
    conn = get_db()
    rows = conn.execute("""
        SELECT u.id, u.name, u.email,
               COALESCE(p.full_name, u.name) as display_name,
               COALESCE(p.email, u.email) as display_email,
               COALESCE(p.mobile, '') as mobile,
               COALESCE(p.skills, '[]') as skills,
               COALESCE(p.resume_url, '') as resume_url,
               COALESCE(p.profile_picture, '') as profile_picture,
               COALESCE(p.role_applied, '') as role_applied,
               COALESCE(p.location, '') as location,
               COALESCE(p.experience, '') as experience,
               COALESCE(p.education, '') as education,
               COALESCE(p.availability, '') as availability,
               COALESCE(p.linkedin_url, '') as linkedin_url,
               COALESCE(p.github_url, '') as github_url
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.role = 'candidate'
    """).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d['skills'] = json.loads(d['skills']) if d['skills'] else []
        d['name'] = d.pop('display_name')
        d['email'] = d.pop('display_email')
        result.append(d)
    return result


# ===== PROFILE HELPERS =====

def get_profile(user_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,)).fetchone()
    if row:
        d = dict(row)
        d['skills'] = json.loads(d['skills']) if d['skills'] else []
        conn.close()
        return d
    # Return base data from user
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if user:
        return {
            "user_id": user_id,
            "full_name": user["name"],
            "email": user["email"],
            "mobile": "", "skills": [], "resume_url": "", "profile_picture": "", "role_applied": ""
        }
    return None


def upsert_profile(user_id: str, full_name="", email="", mobile="", skills_list=None, role_applied="",
                   location="", experience="", education="", availability="", linkedin_url="", github_url=""):
    conn = get_db()
    existing = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,)).fetchone()
    skills_json = json.dumps(skills_list) if skills_list else (existing["skills"] if existing else "[]")

    if existing:
        conn.execute("""
            UPDATE profiles SET
                full_name = CASE WHEN ? != '' THEN ? ELSE full_name END,
                email = CASE WHEN ? != '' THEN ? ELSE email END,
                mobile = CASE WHEN ? != '' THEN ? ELSE mobile END,
                skills = ?,
                role_applied = CASE WHEN ? != '' THEN ? ELSE role_applied END,
                location = CASE WHEN ? != '' THEN ? ELSE location END,
                experience = CASE WHEN ? != '' THEN ? ELSE experience END,
                education = CASE WHEN ? != '' THEN ? ELSE education END,
                availability = CASE WHEN ? != '' THEN ? ELSE availability END,
                linkedin_url = CASE WHEN ? != '' THEN ? ELSE linkedin_url END,
                github_url = CASE WHEN ? != '' THEN ? ELSE github_url END
            WHERE user_id = ?
        """, (full_name, full_name, email, email, mobile, mobile, skills_json, role_applied, role_applied, 
              location, location, experience, experience, education, education, availability, availability, 
              linkedin_url, linkedin_url, github_url, github_url, user_id))
    else:
        conn.execute(
            "INSERT INTO profiles (user_id, full_name, email, mobile, skills, role_applied, location, experience, education, availability, linkedin_url, github_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (user_id, full_name, email, mobile, skills_json, role_applied, location, experience, education, availability, linkedin_url, github_url)
        )
    conn.commit()

    # Also update user record
    if full_name:
        conn.execute("UPDATE users SET name = ? WHERE id = ?", (full_name, user_id))
    if email:
        conn.execute("UPDATE users SET email = ? WHERE id = ?", (email, user_id))
    conn.commit()

    row = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    d = dict(row)
    d['skills'] = json.loads(d['skills']) if d['skills'] else []
    return d


def update_profile_field(user_id: str, field: str, value: str):
    conn = get_db()
    existing = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,)).fetchone()
    if not existing:
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if user:
            conn.execute(
                "INSERT INTO profiles (user_id, full_name, email) VALUES (?, ?, ?)",
                (user_id, user["name"], user["email"])
            )
            conn.commit()
    conn.execute(f"UPDATE profiles SET {field} = ? WHERE user_id = ?", (value, user_id))
    conn.commit()
    conn.close()


# ===== INTERVIEW HELPERS =====

def get_all_interviews():
    conn = get_db()
    rows = conn.execute("""
        SELECT i.*, COALESCE(p.profile_picture, '') as profile_picture
        FROM interviews i
        LEFT JOIN profiles p ON i.candidate_id = p.user_id
        ORDER BY i.created_at DESC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_interview(interview_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM interviews WHERE id = ?", (interview_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_interviews_for_candidate(candidate_id: str):
    conn = get_db()
    rows = conn.execute("""
        SELECT i.*, COALESCE(p.profile_picture, '') as profile_picture
        FROM interviews i
        LEFT JOIN profiles p ON i.candidate_id = p.user_id
        WHERE i.candidate_id = ?
        ORDER BY i.created_at DESC
    """, (candidate_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_interview(candidate_id: str, candidate_name: str, role_title: str, domain: str,
                     scheduled_date: str = "", scheduled_time: str = "", duration_minutes: int = 60,
                     topic_name: str = ""):
    conn = get_db()
    iid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn.execute("""
        INSERT INTO interviews (id, candidate_id, candidate_name, role_title, domain,
                                scheduled_date, scheduled_time, duration_minutes, topic_name, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?)
    """, (iid, candidate_id, candidate_name, role_title, domain, scheduled_date, scheduled_time, duration_minutes, topic_name, now))
    conn.commit()
    row = conn.execute("SELECT * FROM interviews WHERE id = ?", (iid,)).fetchone()
    conn.close()
    return dict(row)


def update_interview_status(interview_id: str, status: str):
    conn = get_db()
    if status == "Completed":
        conn.execute(
            "UPDATE interviews SET status = ?, completed_at = datetime('now') WHERE id = ?",
            (status, interview_id)
        )
    else:
        conn.execute("UPDATE interviews SET status = ? WHERE id = ?", (status, interview_id))
    conn.commit()
    row = conn.execute("SELECT * FROM interviews WHERE id = ?", (interview_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def complete_interview(interview_id: str, duration_seconds: int):
    conn = get_db()
    conn.execute("""
        UPDATE interviews SET status = 'Completed', actual_duration_seconds = ?, completed_at = datetime('now')
        WHERE id = ?
    """, (duration_seconds, interview_id))
    conn.commit()
    row = conn.execute("SELECT * FROM interviews WHERE id = ?", (interview_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


# ===== QUESTION HELPERS =====

def get_questions_for_interview(interview_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM questions WHERE interview_id = ? ORDER BY question_order",
        (interview_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_question(interview_id: str, category: str, difficulty: str, text: str, order: int = 0):
    conn = get_db()
    qid = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO questions (id, interview_id, category, difficulty, text, question_order) VALUES (?, ?, ?, ?, ?, ?)",
        (qid, interview_id, category, difficulty, text, order)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM questions WHERE id = ?", (qid,)).fetchone()
    conn.close()
    return dict(row)


def get_question(question_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM questions WHERE id = ?", (question_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


# ===== ANSWER HELPERS =====

def get_answers_for_interview(interview_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM answers WHERE interview_id = ? ORDER BY submitted_at",
        (interview_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_answer(question_id: str, interview_id: str, candidate_id: str, text: str, score: float = 0, feedback: str = ""):
    conn = get_db()
    aid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn.execute(
        "INSERT INTO answers (id, question_id, interview_id, candidate_id, text, score, feedback, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (aid, question_id, interview_id, candidate_id, text, score, feedback, now)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM answers WHERE id = ?", (aid,)).fetchone()
    conn.close()
    return dict(row)


# ===== STATS HELPERS =====

def get_stats():
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) as c FROM interviews").fetchone()["c"]
    candidates = conn.execute("SELECT COUNT(*) as c FROM users WHERE role = 'candidate'").fetchone()["c"]
    completed = conn.execute("SELECT COUNT(*) as c FROM interviews WHERE status = 'Completed'").fetchone()["c"]

    avg_row = conn.execute(
        "SELECT AVG(actual_duration_seconds) as avg_dur FROM interviews WHERE status = 'Completed' AND actual_duration_seconds > 0"
    ).fetchone()
    avg_seconds = avg_row["avg_dur"] if avg_row["avg_dur"] else 0
    avg_minutes = round(avg_seconds / 60) if avg_seconds else 0

    active = conn.execute("SELECT COUNT(*) as c FROM interviews WHERE status = 'In Progress'").fetchone()["c"]
    conn.close()

    return {
        "total_interviews": total,
        "active_candidates": candidates,
        "completed_this_month": completed,
        "avg_interview_time": avg_minutes,
        "active_interviews": active,
    }


# ===== ROLES HELPERS =====

def create_role(title: str, domain: str, description: str, work_type: str = ""):
    conn = get_db()
    role_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO job_roles (id, title, domain, description, is_active, work_type) VALUES (?, ?, ?, ?, ?, ?)",
        (role_id, title, domain, description, 1, work_type)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM job_roles WHERE id = ?", (role_id,)).fetchone()
    conn.close()
    return dict(row)

def get_all_roles(active_only: bool = False):
    conn = get_db()
    if active_only:
        rows = conn.execute("SELECT * FROM job_roles WHERE is_active = 1 ORDER BY created_at DESC").fetchall()
    else:
        rows = conn.execute("SELECT * FROM job_roles ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_role_by_id(role_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM job_roles WHERE id = ?", (role_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def update_role(role_id: str, title: str = None, domain: str = None, description: str = None, is_active: bool = None, work_type: str = None):
    conn = get_db()
    updates = []
    params = []
    if title is not None:
        updates.append("title = ?")
        params.append(title)
    if domain is not None:
        updates.append("domain = ?")
        params.append(domain)
    if description is not None:
        updates.append("description = ?")
        params.append(description)
    if is_active is not None:
        updates.append("is_active = ?")
        params.append(1 if is_active else 0)
    if work_type is not None:
        updates.append("work_type = ?")
        params.append(work_type)
        
    if updates:
        query = f"UPDATE job_roles SET {', '.join(updates)} WHERE id = ?"
        params.append(role_id)
        conn.execute(query, tuple(params))
        conn.commit()
        
    row = conn.execute("SELECT * FROM job_roles WHERE id = ?", (role_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def delete_role(role_id: str):
    conn = get_db()
    # Delete dependent applications first to avoid SQLite ForeignKey constraint failures
    conn.execute("DELETE FROM applications WHERE role_id = ?", (role_id,))
    
    # Optional: If you wanted to delete interviews linked to this role, you'd do it here. 
    # But interviews rely on candidate_id primarily. We keep interviews as historical records.
    
    conn.execute("DELETE FROM job_roles WHERE id = ?", (role_id,))
    conn.commit()
    conn.close()
    return {"deleted": role_id}


# ===== APPLICATIONS HELPERS =====

def create_application(candidate_id: str, role_id: str):
    conn = get_db()
    
    # Check if already applied
    existing = conn.execute("SELECT * FROM applications WHERE candidate_id = ? AND role_id = ?", (candidate_id, role_id)).fetchone()
    if existing:
        conn.close()
        return dict(existing)
        
    app_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO applications (id, candidate_id, role_id, status) VALUES (?, ?, ?, ?)",
        (app_id, candidate_id, role_id, 'Pending')
    )
    conn.commit()
    row = conn.execute("SELECT * FROM applications WHERE id = ?", (app_id,)).fetchone()
    conn.close()
    return dict(row)

def get_all_applications():
    conn = get_db()
    # Join with users, roles, and profiles for convenient displaying
    query = """
        SELECT a.*, u.name as candidate_name, u.email as candidate_email,
               r.title as role_title, r.domain as role_domain,
               COALESCE(p.profile_picture, '') as profile_picture
        FROM applications a
        JOIN users u ON a.candidate_id = u.id
        JOIN job_roles r ON a.role_id = r.id
        LEFT JOIN profiles p ON a.candidate_id = p.user_id
        ORDER BY a.applied_at DESC
    """
    rows = conn.execute(query).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_applications_by_candidate(candidate_id: str):
    conn = get_db()
    query = """
        SELECT a.*, r.title as role_title, r.domain as role_domain, r.description as role_description
        FROM applications a
        JOIN job_roles r ON a.role_id = r.id
        WHERE a.candidate_id = ?
        ORDER BY a.applied_at DESC
    """
    rows = conn.execute(query, (candidate_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_application_status(app_id: str, status: str):
    conn = get_db()
    conn.execute("UPDATE applications SET status = ? WHERE id = ?", (status, app_id))
    conn.commit()
    
    # Return the full details need for spawning an interview
    query = """
        SELECT a.*, u.name as candidate_name, r.title as role_title, r.domain as role_domain
        FROM applications a
        JOIN users u ON a.candidate_id = u.id
        JOIN job_roles r ON a.role_id = r.id
        WHERE a.id = ?
    """
    row = conn.execute(query, (app_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


# ===== BOOKED SLOTS HELPERS =====

def get_booked_slots(date: str):
    """Return list of time slots already booked for a given date."""
    conn = get_db()
    rows = conn.execute(
        "SELECT scheduled_time FROM interviews WHERE scheduled_date = ? AND scheduled_time != ''",
        (date,)
    ).fetchall()
    conn.close()
    return [row["scheduled_time"] for row in rows]


# ===== NOTIFICATION HELPERS =====

def create_notification(user_id: str, message: str):
    conn = get_db()
    nid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn.execute(
        "INSERT INTO notifications (id, user_id, message, is_read, created_at) VALUES (?, ?, ?, 0, ?)",
        (nid, user_id, message, now)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM notifications WHERE id = ?", (nid,)).fetchone()
    conn.close()
    return dict(row)


def get_notifications(user_id: str):
    conn = get_db()
    # Auto-delete notifications older than 5 days
    conn.execute(
        "DELETE FROM notifications WHERE created_at < datetime('now', '-5 days')"
    )
    conn.commit()
    rows = conn.execute(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def mark_notification_read(notification_id: str):
    conn = get_db()
    conn.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notification_id,))
    conn.commit()
    conn.close()


def log_proctoring_violation(interview_id: str, v_type: str, message: str):
    conn = get_db()
    vid = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO proctoring_violations (id, interview_id, type, message) VALUES (?, ?, ?, ?)",
        (vid, interview_id, v_type, message)
    )
    conn.commit()
    conn.close()
    return vid


def get_proctoring_logs(interview_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM proctoring_violations WHERE interview_id = ? ORDER BY created_at ASC",
        (interview_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# Initialize database on import
init_db()
