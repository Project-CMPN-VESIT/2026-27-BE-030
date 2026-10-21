# PsychTriage / MindQuest

A mobile-first mental health triage app for Indian youth combining **real-time AI voice counseling**, a **gamified anxiety assessment**, and **cross-session memory** — all backed by a FastAPI + MongoDB backend.

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248)
![Gemini](https://img.shields.io/badge/Gemini-Live%20API-4285F4)

---

## What this project does

PsychTriage gives users a guided, private path to check in on how they are feeling, speak to an empathetic AI counselor, and get actionable support — across multiple sessions with persistent memory.

### Core Features

| Feature | Description |
|---------|-------------|
| 🎙️ **AI Voice Buddy** | Real-time voice conversation powered by **Google Gemini Live API**. The AI remembers your last session. |
| 🧠 **Cross-Session Memory** | After every voice call, the transcript is summarized by Gemini and saved to MongoDB. The next session starts with that context. |
| 🔐 **Google OAuth + Manual Sign-Up** | Users log in with Google One-Tap or a simple name/email form. Session memory is tied to their account. |
| 🎮 **MindQuest Game** | 3-level gamified anxiety assessment (Calm → Challenge → Stress Mode) with XP and rewards. |
| 📋 **Manual Screening** | PHQ-9 + GAD-7 questionnaire flow for traditional assessment. |
| 🚨 **Emergency Mode** | One-tap access to Indian helplines (Tele-MANAS 14416, KIRAN 1800-599-0019). |
| 📊 **Progress Dashboard** | Weekly trends, streaks, XP, and achievement badges. |

---

## Architecture

```
┌──────────────────────────────────┐
│         React Frontend           │
│  (Vite + TypeScript + Tailwind)  │
│                                  │
│  AiBuddyScreen ──────────────────┼──► Gemini Live API (voice stream)
│  LoginScreen   ──────────────────┼──► Google OAuth
│  AuthContext   ──────────────────┼──► localStorage (user profile)
└──────────┬───────────────────────┘
           │ REST API calls
           ▼
┌──────────────────────────────────┐
│       FastAPI Backend            │
│       (Python + Motor)           │
│                                  │
│  POST /api/auth/google           │  Register / update user
│  GET  /api/voice/init/{user_id}  │  Fetch memory for pre-call
│  POST /api/voice/webhook         │  Receive transcript → Gemini summary → MongoDB
│  GET  /api/users                 │  Debug: list all users
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│   MongoDB Atlas (Mindquest DB)   │
│   Collection: users              │
│                                  │
│   user_id, user_name, email      │
│   last_conversation_summary      │
│   last_important_events[]        │
│   session_history[]              │
│   all_important_events[]         │
└──────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- Python 3.10+
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free M0 tier is fine)
- A [Google AI Studio](https://aistudio.google.com) API key with **Gemini Live API** access
- A [Google Cloud Console](https://console.cloud.google.com) OAuth 2.0 Client ID

---

### 1. Frontend Setup

```bash
# Clone the repo
git clone https://github.com/s0ham2909/MindQuest.git
cd MindQuest

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your keys (see Environment Variables below)

# Start dev server
npm run dev
# App runs at http://localhost:5173
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate a Python virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit backend/.env with your MongoDB URI and Gemini API key

# Start the FastAPI server
uvicorn main:app --reload --port 8000
# API runs at http://localhost:8000
# Docs at   http://localhost:8000/docs
```

---

## Environment Variables

### Frontend — `.env` (copy from `.env.example`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_BACKEND_URL` | ✅ | URL of the FastAPI backend (default: `http://localhost:8000`) |
| `VITE_GOOGLE_CLIENT_ID` | ✅ | Google OAuth 2.0 Client ID from [Google Cloud Console](https://console.cloud.google.com) |
| `VITE_GEMINI_LIVE_API_KEY` | ✅ | Gemini API key with Live API access from [AI Studio](https://aistudio.google.com/apikey) |
| `VITE_ELEVENLABS_AGENT_ID` | ⬜ | ElevenLabs Agent ID (for future use — `VoiceTriageCall.tsx` is ready to use it) |

### Backend — `backend/.env` (copy from `backend/.env.example`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `DB_NAME` | ✅ | Database name (default: `Mindquest`) |
| `COLLECTION_USERS` | ✅ | Collection name (default: `users`) |
| `GEMINI_API_KEY` | ✅ | Gemini API key for **post-call transcript summarization** |
| `ELEVENLABS_WEBHOOK_SECRET` | ⬜ | ElevenLabs webhook signature secret (optional) |
| `PORT` | ⬜ | Port for uvicorn (default: `8000`) |

> **Note:** The `VITE_GEMINI_LIVE_API_KEY` (frontend, for real-time voice) and `GEMINI_API_KEY` (backend, for text summarization) can be the same key but are kept separate so you can apply different quotas/rate limits.

---

## App Routes

| Route | Screen | Description |
|-------|--------|-------------|
| `/` | Login | Google OAuth + manual sign-up entry point |
| `/home` | Home | Personalized welcome with user profile and navigation |
| `/ai-buddy` | AI Buddy | Real-time voice conversation with Gemini Live AI |
| `/mindquest` | Game Start | MindQuest gamified assessment entry |
| `/mindquest/breathing` | Pre-Game Breathing | Breathing prep before gameplay |
| `/mindquest/level1` | Calm Mode | Level 1 — low-stress interaction |
| `/mindquest/level2` | Challenge Mode | Level 2 — moderate cognitive load |
| `/mindquest/level3` | Stress Mode | Level 3 — time pressure + distractions |
| `/mindquest/result` | Game Result | XP, anxiety score, and recommendations |
| `/manual-assessment` | PHQ-9 + GAD-7 | Traditional questionnaire screening |
| `/manual-assessment/result` | Screening Result | Scores, severity bands, next steps |
| `/dashboard` | Progress | Weekly trends, streaks, achievements |
| `/emergency` | Emergency | Crisis helplines and immediate support |
| `/breathing` | Breathing Exercise | Standalone guided breathing |
| `/components` | Component Library | Developer UI showcase |
| `/design-system` | Design System | Color, typography, and component tokens |

---

## Cross-Session Memory Flow

```
1. User opens app and starts a voice call
        ↓
2. Frontend: GET /api/voice/init/{user_id}
   → Returns user_name + last_conversation_summary from MongoDB
        ↓
3. Gemini Live session starts with memory injected into system prompt:
   "Last session summary: {last_conversation_summary}"
        ↓
4. User has a real-time voice conversation with the AI Buddy
        ↓
5. On "End Conversation", transcript is collected locally
        ↓
6. Frontend: POST /api/voice/webhook
   → Transcript sent to FastAPI backend
   → Gemini 2.5 Flash generates a 5-6 line mental health summary
   → Summary + key events saved to MongoDB under users collection
        ↓
7. Next session starts from Step 1 with the new summary as context ♻️
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4 |
| Animations | Motion (Framer Motion v12) |
| Routing | React Router v7 |
| UI Primitives | Radix UI, Lucide Icons, shadcn/ui |
| Voice AI | Google Gemini Live API (`gemini-3.1-flash-live-preview`) |
| Summarization | Google Gemini 2.5 Flash (REST API) |
| Auth | Google OAuth (`@react-oauth/google`) + JWT decode |
| Backend | FastAPI, Python 3.10+, Uvicorn |
| Database Driver | Motor (async MongoDB driver) |
| Database | MongoDB Atlas |
| Charts | Recharts |

---

## Project Structure

```
MindQuest/
├── backend/
│   ├── main.py              # FastAPI app: auth, voice init, webhook, summarization
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Backend environment variable template
│   └── .gitignore
│
├── src/
│   ├── app/
│   │   ├── screens/
│   │   │   ├── AiBuddyScreen.tsx         # Gemini Live real-time voice AI
│   │   │   ├── LoginScreen.tsx           # Google OAuth + manual sign-up
│   │   │   ├── OnboardingScreen.tsx      # Personalized home screen
│   │   │   ├── GameStartScreen.tsx       # MindQuest game entry
│   │   │   ├── Level1/2/3*.tsx           # Game levels
│   │   │   ├── MindQuestResultScreen.tsx
│   │   │   ├── ManualAssessmentScreen.tsx
│   │   │   ├── BreathingExerciseScreen.tsx
│   │   │   ├── EmergencyMode.tsx
│   │   │   └── ProgressDashboard.tsx
│   │   ├── components/
│   │   │   ├── VoiceTriageCall.tsx   # ElevenLabs SDK component (kept for future use)
│   │   │   ├── design-system/        # PrimaryButton, MoodButton, RiskCard, etc.
│   │   │   └── ui/                   # Radix-based shadcn components
│   │   ├── context/
│   │   │   └── AuthContext.tsx        # Global auth state
│   │   ├── App.tsx
│   │   └── routes.ts
│   ├── main.tsx              # App entry: GoogleOAuthProvider + AuthProvider
│   └── styles/
│
├── .env.example              # Frontend environment variable template
├── .gitignore
├── package.json
├── vite.config.ts
└── index.html
```

---

## Important Notes

- **Not a medical tool.** This is a prototype and educational demonstration. It is not a substitute for professional mental health care.
- **Crisis support.** If someone is in immediate danger, use emergency services or:
  - **Tele-MANAS**: 14416 (24/7, free, 20+ languages)
  - **KIRAN**: 1800-599-0019 (free rehabilitation support)

---

## License

This project is open source. See [ATTRIBUTIONS.md](./ATTRIBUTIONS.md) for third-party library credits.