# SaralAI Context & Handoff Document

This document provides a comprehensive overview of the current state of **SaralAI**, outlining the architecture, tech stack, directory structure, recent updates, and remaining goals. You can directly feed this to an AI coding assistant (like Cursor) to get it fully caught up on where we left off.

## 🎯 Project Overview
**SaralAI** is a voice-first, fully localized AI assistant designed to help citizens understand and apply for Indian Government Schemes. The platform explicitly targets users who prefer speaking and interacting in native Indian languages over traditional text-heavy web navigation. 

It supports 11 Indian languages and provides simplified, accurate, and conversational guidance utilizing authenticated government data sources, backed entirely by the **Sarvam AI** stack specifically tailored for Indian linguistic nuances.

## 🛠️ Technology Stack
### Frontend
- **Framework:** Vanilla JavaScript (ES Modules) with Vite
- **Styling:** Custom Vanilla CSS (`index.css`) with premium design aesthetics, modern variables, and custom animations. (No Tailwind).
- **Architecture:** 
  - Custom Hash-based Routing (`router.js`)
  - Lightweight State Management (`state.js`)
  - Custom Component/Screen architecture built purely with JS DOM manipulation (`screens/`, `components/`)
- **Key Features:** Animated UI, Markdown parsing for responses, Audio Waveform integration, comprehensive i18n label translations without external libraries.

### Backend
- **Framework:** FastAPI (Python 3.12+)
- **Database:** SQLite (local dev via `aiosqlite`) / PostgreSQL (production) with SQLAlchemy 2.0 ORM.
- **AI Infrastructure (Migrated completely to Sarvam AI):**
  - **LLM:** `sarvam-m` mapped via `https://api.sarvam.ai/v1/chat/completions` (Handles Markdown-based simplified reasoning and conversation generation).
  - **STT (Speech-to-Text):** `Saaras v3`
  - **TTS (Text-to-Speech):** `Bulbul v3`
  - **Translation:** `Mayura v1`
- **Other Tools:** `slowapi` for Rate Limiting, standard `requests` / `httpx` for API calls, CORS configured for the Vite frontend.

---

## 📁 Project Directory Structure
```text
SaralAI/
├── .env.local              # Frontend specific envs
├── PROJECT_STATUS.md       # Full documentation of the UI/UX Flow & 11 Screens
├── package.json            # Vite dependencies
├── index.html              # Frontend entry point
├── src/                    # Frontend UI Source
│   ├── main.js             # Initialization & Core Logic
│   ├── router.js           # Client-side hash routing
│   ├── state.js            # Central State Store
│   ├── icons.js            # SVG icons
│   ├── components/         # Reusable HTML/JS pieces (Buttons, AudioPlayer, etc.)
│   ├── screens/            # Specific views (Landing, Speak, Explanation, etc.)
│   └── styles/
│       └── index.css       # Core CSS design system
└── backend/                # Python FastAPI Backend
    ├── main.py             # Entry point / setup
    ├── requirements.txt    # Python deps
    ├── config.py           # Environment models via pydantic-settings
    ├── database.py         # SQLAlchemy & Alembic setup
    ├── routers/            # HTTP Route handlers (query, speech, tts)
    ├── services/           # Business logic (LLM abstraction, TTs/STT services)
    ├── models/             # Pydantic schemas and DB logic
    └── tests/              # Pytest integrations
```

---

## ✅ Recently Completed Milestones (What We Just Did)
1. **Full Sarvam AI Integration**: Stripped out Google Cloud / Gemini AI dependencies and completely hooked the backend up to Sarvam models (`saaras v3`, `sarvam-m`, `mayura v1`, `bulbul v3`) for specialized translation, reasoning, and voice generation in BCP-47 supported Indian languages. 
2. **Localization & Polish**:
   - Replaced static English JSON scheme injection with dynamic, localized LLM query generation.
   - Built a custom translation pipeline ensuring that all generated content on the backend (like "What's Next", "Documents Needed", "Step-by-step Guides") matches the user's chosen UI language.
   - Polished the front end by removing redundant "user profile" bloat, fixing navigation edge cases, and cleaning up the header UI.
3. **Frontend Production Fixes**:
   - Integrated markdown parsing into the `ExplanationScreen` for beautifully formatted AI outputs.
   - Updated all "Wait/Loading/Listening" components to gracefully handle backend asynchronous timeouts and display localized labels.

## 🚀 How to Start
**Frontend:**
```bash
npm install
npm run dev
# Running on http://localhost:5174/ (or similar)
```

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Make sure `.env` variables for Sarvam AI are set.

## 📌 Next Steps & Potential Tasks for Cursor
The application is essentially production-ready locally. Handing this off, your immediate next steps would likely be:
1. **Production Deployment:** Preparing and packaging the frontend for Vercel/Netlify, while deploying the FastAPI backend to Railway or Render.
2. **End-to-End Voice Integration Polish:** Doing specific testing via the browser with Web Speech API bridging seamlessly to the Sarvam API payload formats.
3. **Database Population:** Pushing more comprehensive 'Scheme' chunks into the production database logic.
