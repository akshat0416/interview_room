# AI Interview Room - Frontend

Next.js frontend for the Blue Planet Solutions AI Interview Platform.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy environment file:
   ```
   cp .env.local.example .env.local
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

## Pages

- `/` - Landing page
- `/login` - Login / Signup
- `/dashboard` - Admin or Candidate dashboard (role-based)
- `/interview` - Interview room with WebRTC video

## Tech Stack

- Next.js (Pages Router)
- React
- Socket.IO Client
- WebRTC
- Axios
