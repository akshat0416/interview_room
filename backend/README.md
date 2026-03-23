# AI Interview Room - Backend

FastAPI backend for the Blue Planet Solutions AI Interview Platform.

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Copy environment file:
   ```
   cp .env.example .env
   ```

3. Run the server:
   ```
   uvicorn app.main:socket_app --host 0.0.0.0 --port 8000 --reload
   ```

## API Documentation

Visit `http://localhost:8000/docs` for the interactive Swagger UI.

## Demo Credentials

- Admin: `admin@blueplanet.com` / `admin123`
- Candidate: `sarah@example.com` / `test123`

## Tech Stack

- FastAPI
- Socket.IO (python-socketio)
- JWT Authentication (python-jose)
- In-memory database
