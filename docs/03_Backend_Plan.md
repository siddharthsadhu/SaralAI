# SaralAI — FastAPI Backend: Complete Plan
### Chosen Stack: Gemini · Google STT · PostgreSQL · Railway · Anonymous

---

## Part 1 — Technology Choices & Why

### 1.1 FastAPI (Web Framework)

| | FastAPI ✅ | Flask | Django |
|--|--|--|--|
| Speed | Async, very fast | Sync, slower | Slower |
| Auto docs | Swagger UI built-in | Manual | Manual |
| Type safety | Pydantic validation | None | None |
| Learning curve | Medium | Easy | Hard |
| Best for | APIs + ML services | Simple apps | Full web apps |

**Why FastAPI**: Our backend is purely an API (no HTML). FastAPI gives us auto-generated Swagger docs at `/docs`, built-in request validation, and native `async/await` support for calling Gemini/Cloud APIs concurrently — which makes it noticeably faster.

---

### 1.2 Google Gemini API (LLM)

| | Gemini 1.5 Flash ✅ | GPT-4o | Groq (LLaMA 3) |
|--|--|--|--|
| Free tier | 15 req/min, 1M tok/day | $0.005/1K tokens | 30 req/min free |
| Hindi quality | Excellent | Excellent | Good |
| API key | aistudio.google.com | platform.openai.com | console.groq.com |
| Python SDK | `google-generativeai` | `openai` | `groq` |

**Why Gemini**: Free tier is generous enough for development and light production use. Hindi + Indian language support is excellent. Single Google account covers Gemini + STT + TTS (less juggling).

---

### 1.3 Google Cloud Speech-to-Text (STT)

| | Google STT ✅ | OpenAI Whisper API | Azure STT |
|--|--|--|--|
| Indian languages | 18 Indian locales (hi-IN, bn-IN, ta-IN, …) | Language-agnostic | Good |
| Free tier | 60 min/month free | $0.006/min | 5 hours/month |
| Streaming | Yes | No | Yes |

**Why Google STT**: The only service with dedicated `hi-IN`, `bn-IN`, `ta-IN`, `mr-IN`, `gu-IN`, `kn-IN`, `te-IN` models — exactly what SaralAI's users speak. OpenAI Whisper is great at English but less precise for regional Indian accents.

---

### 1.4 PostgreSQL on Railway

| | PostgreSQL + Railway ✅ | SQLite | MongoDB Atlas |
|--|--|--|--|
| Setup | Zero config on Railway | Local file only | Cloud, free tier |
| Production ready | Yes | No (no concurrent writes) | Yes |
| Free tier | $5 credit/month (enough) | Free | 512MB free |
| SQL / NoSQL | SQL — structured, relationships | SQL | NoSQL — flexible |

**Why PostgreSQL**: Our scheme data is highly structured (schemes, eligibility, documents, steps). Relational SQL is the right tool. Railway spins up a PostgreSQL instance in 30 seconds with zero configuration.

---

### 1.5 Railway (Hosting)

| | Railway ✅ | Render | Google Cloud Run |
|--|--|--|--|
| First deploy | Button click | Moderate | Complex |
| PostgreSQL | Built-in | Add-on | Cloud SQL (costly) |
| Free tier | $5 credit/month | 750 hours/month | $300 new credit |
| Auto-deploy | GitHub push | GitHub push | Cloud Build |

---

## Part 2 — Accounts You Need to Create

> Complete these BEFORE writing code. Estimated time: 45 minutes.

### Step A — Google AI Studio (Gemini API Key)
**URL**: https://aistudio.google.com

1. Login with Google account
2. Click **Create API Key** → Select or create a project
3. Copy the key → save as `GEMINI_API_KEY` in your `.env` file
4. **Free limits**: 15 requests/minute, 1 million tokens/day
5. No credit card needed for free tier ✅

---

### Step B — Google Cloud Console (STT + TTS APIs)
**URL**: https://console.cloud.google.com

1. Login → Create a new project called `saralai-backend`
2. Enable APIs (search and enable each):
   - **Cloud Speech-to-Text API**
   - **Cloud Text-to-Speech API**
3. Go to **IAM & Admin → Service Accounts**
4. Create a service account: name `saralai-stt-tts`
5. Grant role: **Editor** (or specific STT/TTS roles)
6. Click on the service account → **Keys → Add Key → JSON**
7. Download the JSON file → save it as `backend/google-credentials.json`
8. **Free tier**: STT = 60 min/month, TTS = 1M characters/month

> ⚠️ Never commit `google-credentials.json` to Git. It's in `.gitignore`.

---

### Step C — Railway Account
**URL**: https://railway.app

1. Click **Login with GitHub** (no separate account needed)
2. Create a new project → **Add Service → PostgreSQL**
3. Railway auto-generates: `DATABASE_URL` (copy it)
4. Later: add your FastAPI backend as another service in the same project

---

### Step D — GitHub Repository (for auto-deploy)
1. Create a new repo: `SaralAI-backend` (or push to existing SaralAI repo in a `backend/` folder)
2. Connect to Railway: Project → Add Service → GitHub Repo

---

## Part 3 — Complete File Structure

```
SaralAI/
├── src/                          ← existing frontend (Vite)
└── backend/                      ← NEW — FastAPI backend
    │
    ├── main.py                   ← App entry point, CORS, router mounting
    ├── config.py                 ← All environment variables (Pydantic Settings)
    ├── database.py               ← PostgreSQL connection + SQLAlchemy setup
    ├── dependencies.py           ← Shared FastAPI dependencies
    │
    ├── models/
    │   ├── __init__.py
    │   ├── request_models.py     ← Pydantic models for incoming requests
    │   └── response_models.py   ← Pydantic models for outgoing responses
    │
    ├── routers/
    │   ├── __init__.py
    │   ├── query.py              ← POST /api/query (main endpoint)
    │   ├── speech.py             ← POST /api/speech/transcribe
    │   └── tts.py                ← POST /api/tts/speak
    │
    ├── services/
    │   ├── __init__.py
    │   ├── schemes_service.py    ← Load + search Schemes.json
    │   ├── intent_service.py     ← Intent detection (keyword → OVERVIEW/DOCS/etc.)
    │   ├── gemini_service.py     ← Google Gemini API calls
    │   ├── stt_service.py        ← Google Cloud STT
    │   └── tts_service.py        ← Google Cloud TTS
    │
    ├── db/
    │   ├── __init__.py
    │   └── query_log.py          ← SQLAlchemy ORM model for query_logs table
    │
    ├── data/
    │   └── schemes.json          ← Copy of src/Schemes.json
    │
    ├── tests/
    │   ├── __init__.py
    │   ├── test_query.py
    │   └── test_schemes.py
    │
    ├── requirements.txt
    ├── .env.example              ← Template (safe to commit)
    ├── .env                      ← Real secrets (in .gitignore)
    ├── .gitignore
    ├── Dockerfile
    └── railway.toml
```

---

## Part 4 — API Endpoint Design

### `POST /api/query` — Main Endpoint

**Frontend sends** (JSON):
```json
{
  "query": "PM Kisan scheme kya hai",
  "language": "hi",
  "session_id": null
}
```

**Backend pipeline**:
```
1. Validate request (Pydantic)
2. schemes_service.search(query) → ranked schemes + confidence
3. intent_service.detect(query) → intent type
4. If confidence < 0.05 → return clarification options
5. gemini_service.simplify(scheme, intent, language, query) → AI explanation
6. Log query to PostgreSQL
7. Return structured response
```

**Backend returns** (JSON):
```json
{
  "type": "explanation",
  "intent": "OVERVIEW",
  "confidence": 0.82,
  "scheme_id": "PM_KISAN",
  "content": {
    "scheme_name": "Pradhan Mantri Kisan Samman Nidhi",
    "category": "Farmers / Income Support",
    "summary": "₹6000/year income support for landholding farmers",
    "key_points": ["..."],
    "eligibility_points": ["..."],
    "documents": [{"name": "Aadhaar", "mandatory": true}],
    "steps": ["..."],
    "official_source": "https://pmkisan.gov.in",
    "disclaimer": "This information is for guidance only."
  },
  "clarification_options": []
}
```

---

### `POST /api/speech/transcribe` — Voice to Text

**Frontend sends**: `multipart/form-data` with audio file
```
audio: <binary audio data>
language: "hi"
```

**Backend returns**:
```json
{
  "transcript": "PM Kisan scheme kya hai",
  "confidence": 0.94,
  "language_detected": "hi-IN"
}
```

---

### `POST /api/tts/speak` — Text to Voice

**Frontend sends**:
```json
{
  "text": "PM Kisan yojana mein, 6000 rupaye",
  "language": "hi",
  "voice_gender": "FEMALE"
}
```

**Backend returns**: MP3 audio stream (binary)

---

### `GET /api/schemes` — List All Schemes

**Returns**: Array of scheme summaries (name, category, who_for_short)

---

### `GET /api/scheme/{scheme_id}` — Get One Scheme

**Returns**: Full scheme object

---

### `GET /api/health` — Health Check

**Returns**: `{"status": "ok", "version": "1.0.0"}`
Used by Railway to verify the service is alive.

---

## Part 5 — Database Design

### Table: `query_logs`

```sql
CREATE TABLE query_logs (
  id              SERIAL PRIMARY KEY,
  session_id      VARCHAR(36),         -- anonymous UUID
  query_text      TEXT NOT NULL,
  language        VARCHAR(10),
  intent          VARCHAR(20),
  scheme_id       VARCHAR(20),
  confidence      FLOAT,
  gemini_used     BOOLEAN DEFAULT FALSE,
  response_time_ms INTEGER,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

**What this gives us**: We can see which schemes are most asked about, which queries fail (low confidence), average response times. All anonymous — no personal data.

---

## Part 6 — Build Phases (Day-by-Day)

### Phase 1 — Setup (Day 1)
- [ ] Create `backend/` folder structure
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Install core deps: `fastapi uvicorn python-dotenv pydantic-settings`
- [ ] Write `main.py` skeleton + CORS
- [ ] Write `config.py` with env var loading
- [ ] Test: `uvicorn main:app --reload` → `/api/health` returns 200

### Phase 2 — Schemes Engine (Day 2)
- [ ] Copy `Schemes.json` to `backend/data/`
- [ ] Write `schemes_service.py` — Python port of `ai.js` logic
- [ ] Write `intent_service.py` — keyword-based intent detection
- [ ] Test: `pytest tests/test_schemes.py`

### Phase 3 — Gemini Integration (Day 3)
- [ ] Get Gemini API key from aistudio.google.com
- [ ] Install: `pip install google-generativeai`
- [ ] Write `gemini_service.py` with system prompt template
- [ ] Write `/api/query` router
- [ ] Test: POST `/api/query` with `{"query": "PM Kisan kya hai", "language": "en"}`

### Phase 4 — Database (Day 4)
- [ ] Set up Railway PostgreSQL
- [ ] Install: `pip install sqlalchemy asyncpg psycopg2-binary alembic`
- [ ] Write `database.py` + `db/query_log.py`
- [ ] Run migrations: `alembic upgrade head`
- [ ] Test: verify query is logged after each API call

### Phase 5 — Voice STT (Day 5)
- [ ] Create Google Cloud project + enable Speech API
- [ ] Install: `pip install google-cloud-speech`
- [ ] Write `stt_service.py`
- [ ] Write `/api/speech/transcribe` router
- [ ] Test: upload a WAV file → get transcript

### Phase 6 — TTS (Day 6)
- [ ] Enable Cloud TTS API in Google Cloud Console
- [ ] Install: `pip install google-cloud-texttospeech`
- [ ] Write `tts_service.py`
- [ ] Write `/api/tts/speak` router
- [ ] Test: POST text → receive MP3 audio

### Phase 7 — Frontend Wiring (Day 7)
- [ ] Update `ProcessingScreen.js`: call `/api/query` instead of `processQuery()` from ai.js
- [ ] Update `ListeningScreen.js`: call `/api/speech/transcribe` instead of Web Speech API
- [ ] Update `ExplanationScreen.js`: wire AudioPlayer to call `/api/tts/speak`
- [ ] Add VITE_API_URL env var to Vite config

### Phase 8 — Deployment (Day 8)
- [ ] Write `Dockerfile`
- [ ] Write `railway.toml`
- [ ] Push to GitHub
- [ ] Connect Railway to GitHub repo
- [ ] Add all env vars to Railway dashboard
- [ ] Test production URL end-to-end

---

## Part 7 — Environment Variables

### `.env.example` (safe to commit — no real values)
```env
# Google Gemini
GEMINI_API_KEY=your-key-here

# Google Cloud (for STT + TTS)
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# PostgreSQL (Railway auto-provides this)
DATABASE_URL=postgresql://user:password@host:port/dbname

# App Settings
APP_ENV=development
DEBUG=true
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
MAX_REQUESTS_PER_MINUTE=60
```

---

## Part 8 — Security & Production Checklist

| Item | How |
|------|-----|
| API secrets | Env vars only, never hardcoded |
| Google credentials | Out of Git via `.gitignore` |
| CORS | Only allow your frontend domain |
| Rate limiting | `slowapi` middleware (60 req/min/IP) |
| Input validation | Pydantic models on every endpoint |
| Error responses | Never expose stack traces in production |
| Health check | `/api/health` for Railway monitoring |
| SQL injection | SQLAlchemy ORM (parameterized queries) |

---

## Part 9 — Python Dependencies

```txt
# requirements.txt
fastapi==0.111.0
uvicorn[standard]==0.30.0
pydantic-settings==2.3.0
python-dotenv==1.0.1
google-generativeai==0.7.0
google-cloud-speech==2.27.0
google-cloud-texttospeech==2.17.0
sqlalchemy==2.0.32
asyncpg==0.29.0
psycopg2-binary==2.9.9
alembic==1.13.2
python-multipart==0.0.9
slowapi==0.1.9
pytest==8.3.1
httpx==0.27.0
```
