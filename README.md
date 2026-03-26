# AI Interview Room — Blue Planet Solutions

Full-stack AI-powered interview platform with real-time video (WebRTC), automated scoring, and role-based dashboards.

## Tech Stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Frontend | Next.js (Pages Router), React, Socket.IO Client, WebRTC, Axios |
| Backend  | FastAPI, Socket.IO (python-socketio), JWT (python-jose), SQLite, bcrypt |

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # configure SMTP + secrets
uvicorn app.main:socket_app --host 0.0.0.0 --port 8001 --reload
```

API docs → `http://localhost:8001/docs`

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open → `http://localhost:3000`

## Pages

| Route         | Description                              |
|---------------|------------------------------------------|
| `/`           | Landing page                             |
| `/login`      | Login / Signup                           |
| `/dashboard`  | Admin or Candidate dashboard (role-based)|
| `/interview`  | Interview room with WebRTC video         |

## Demo Credentials

- **Admin:** `admin@blueplanet.com` / `admin123`
- **Candidate:** Sign up as a new candidate

## Project Structure

```
Ai_Interview_bps/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI + Socket.IO entry point
│   │   ├── database.py        # SQLite database layer
│   │   ├── config.py          # Environment config
│   │   ├── models.py          # Pydantic models & enums
│   │   ├── email_service.py   # SMTP email service
│   │   ├── routes/            # Auth, Questions, Answers, Reports
│   │   └── services/          # Scoring engine
│   ├── data/                  # SQLite database file
│   ├── uploads/               # Resumes, photos, recordings
│   ├── requirements.txt
│   ├── run.py
│   └── Dockerfile
├── frontend/
│   ├── pages/                 # Next.js pages
│   ├── components/            # React components
│   ├── services/              # API client (Axios)
│   ├── styles/                # CSS modules
│   ├── public/                # Static assets
│   ├── package.json
│   └── Dockerfile
└── README.md
```
