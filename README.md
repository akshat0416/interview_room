# AI Interview Room — Blue Planet Solutions

Full-stack AI-powered interview platform with real-time video (WebRTC), automated scoring, role-based dashboards, and **AI-powered object detection** via a modular model-serving architecture.

---

## Architecture

```
Ai_Interview_bps_copy/
├── ai-models/                     ← NEW: AI modules
│   ├── object-detection/          ← Reusable detection module
│   │   ├── detector.py            ← ObjectDetector class (pluggable)
│   │   ├── requirements.txt
│   │   └── __init__.py
│   └── model-serving/             ← FastAPI microservice (port 8002)
│       ├── app.py                 ← POST /detect, GET /health
│       ├── requirements.txt
│       └── __init__.py
├── backend/                       ← Interview API (port 8001)
│   ├── app/
│   │   ├── main.py                ← FastAPI + Socket.IO + /api/detect proxy
│   │   ├── database.py            ← SQLite database layer
│   │   ├── config.py              ← Environment config
│   │   ├── models.py              ← Pydantic models & enums
│   │   ├── email_service.py       ← SMTP email service
│   │   ├── routes/                ← Auth, Questions, Answers, Reports
│   │   └── services/              ← Scoring engine
│   ├── data/                      ← SQLite database file
│   ├── uploads/                   ← Resumes, photos, recordings
│   ├── requirements.txt
│   ├── run.py
│   └── Dockerfile
├── frontend/                      ← Next.js UI (port 3000)
│   ├── pages/                     ← Next.js pages
│   ├── components/                ← React components
│   ├── services/                  ← API client (Axios + Socket.IO)
│   ├── styles/                    ← CSS modules
│   ├── public/                    ← Static assets
│   ├── package.json
│   └── Dockerfile
├── .gitignore
└── README.md
```

## Tech Stack

| Layer          | Technology                                                                 |
|----------------|---------------------------------------------------------------------------|
| Frontend       | Next.js (Pages Router), React, Socket.IO Client, WebRTC, Axios           |
| Backend        | FastAPI, Socket.IO (python-socketio), JWT (python-jose), SQLite, bcrypt   |
| AI Models      | Python, NumPy, Pillow (placeholder); swap in YOLOv8/TensorFlow for prod  |
| Model Serving  | FastAPI microservice, uvicorn                                             |

## Data Flow

```
Frontend (Next.js :3000)
    │
    ▼
Backend API (FastAPI :8001)
    │
    ├── /api/interviews, /api/auth, ...   ← Interview logic
    │
    └── /api/detect (proxy)  ────────────►  Model Serving (FastAPI :8002)
                                                │
                                                └── Object Detection Module
```

---

## Setup & Run

### 1. Model Serving (AI)

```bash
cd ai-models/model-serving
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8002 --reload
```

- API docs → `http://localhost:8002/docs`
- Health check → `GET http://localhost:8002/health`
- Detection → `POST http://localhost:8002/detect` (multipart image upload)

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # configure SMTP + secrets
python run.py
```

- API docs → `http://localhost:8001/docs`
- Object detection via backend → `POST http://localhost:8001/api/detect`

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

- Open → `http://localhost:3000`

---

## Pages

| Route         | Description                               |
|---------------|-------------------------------------------|
| `/`           | Landing page                              |
| `/login`      | Login / Signup                            |
| `/dashboard`  | Admin or Candidate dashboard (role-based) |
| `/interview`  | Interview room with WebRTC video          |

## Demo Credentials

- **Admin:** `admin@blueplanet.com` / `admin123`
- **Candidate:** Sign up as a new candidate

---

## AI Contribution

### Object Detection Module (`ai-models/object-detection/`)

- Pluggable `ObjectDetector` class with a clean `detect(image_bytes) → list[dict]` interface
- Ships with realistic placeholder detections (bounding boxes, labels, confidence scores)
- Ready for production model swap — commented examples for YOLOv8 integration

### Model Serving API (`ai-models/model-serving/`)

- Standalone FastAPI microservice on port 8002
- `POST /detect` — accepts image, returns JSON detections with inference timing
- `GET /health` — service health with model status
- CORS-enabled, production-ready error handling

### Backend Integration

- `POST /api/detect` proxy in the main backend forwards to model-serving via `httpx`
- Fully decoupled — no AI model code inside the backend
- Configurable via `MODEL_SERVING_URL` environment variable
