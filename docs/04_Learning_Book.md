# SaralAI — Backend Learning Book
### Line-by-Line Guide to the FastAPI Backend
#### For someone learning Python and backend development alongside building SaralAI

---

## How to Use This Book

Read this file **alongside** the code in `backend/`. Each chapter covers one file completely.

**Structure per chapter:**
1. **What this file does** (30-second summary)
2. **Concepts you need to know first**
3. **Code walkthrough** — every non-obvious line explained
4. **Why this, not that** — alternatives compared
5. **Mini quiz** to verify understanding

---

## Chapter 0 — Python Fundamentals You Need

Before reading any backend code, make sure you're comfortable with:

### F-strings
```python
name = "Siddharth"
print(f"Hello, {name}!")   # → "Hello, Siddharth!"
# f-strings let you put Python expressions inside { }
```

### Type Hints
```python
def greet(name: str) -> str:    # Parameters and return types annotated
    return f"Hello, {name}"

age: int = 25                   # Variable type hint
```
Type hints are **optional at runtime** — Python ignores them. But FastAPI and Pydantic use them for validation and documentation. Think of them as documentation that also enforces rules.

### Async / Await
```python
import asyncio

async def fetch_data():          # async function = can be paused
    await asyncio.sleep(1)       # "wait here without blocking"
    return "done"

# Normal functions block the entire program during I/O
# Async functions pause, letting other work happen during I/O
```
**Why async?** Our backend calls Google APIs (Gemini, STT, TTS) and PostgreSQL. These take 100ms–2 seconds. With regular Python, while one request waits for Gemini, nobody else can be served. With async, thousands of requests can wait concurrently.

### Decorators
```python
@some_decorator
def my_function():
    pass

# Is exactly equivalent to:
my_function = some_decorator(my_function)
```
FastAPI uses decorators heavily: `@app.get("/")`, `@router.post("/query")`, `@lru_cache`.

---

## Chapter 1 — `requirements.txt`

**Purpose**: Lists every Python package needed to run the backend.

```txt
fastapi==0.111.0
uvicorn[standard]==0.30.0
# ...
```

### Why pin exact versions? (`==0.111.0` not `>=0.111.0`)
Production systems must be **reproducible**. If you use `>=0.111`, someone who installs in 6 months might get `0.119` with breaking changes, and the app breaks. Pinning means everyone gets the exact same code.

### `uvicorn[standard]` — what's the `[standard]` part?
Python packages can have optional "extras". `uvicorn[standard]` installs uvicorn plus additional packages: `watchfiles` (for `--reload`), `websockets`, and `httptools` (faster HTTP parser). Without `[standard]`, you get a bare minimum uvicorn.

### `python-multipart`
Required for `File(...)` and `Form(...)` in FastAPI endpoints. File uploads are sent as `multipart/form-data` (not JSON). This library parses that format.

### `asyncpg` vs `psycopg2-binary` — why both?
- `asyncpg`: Fast async PostgreSQL driver (used by SQLAlchemy for live queries)
- `psycopg2-binary`: Sync PostgreSQL driver (used by Alembic for migrations)
Both are needed because Alembic (migration tool) doesn't support async.

---

## Chapter 2 — `config.py` — Settings & Environment Variables

**Purpose**: Load all configuration from environment variables in a type-safe way.

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
```

### Why `pydantic_settings`?
There are 3 ways to read env vars in Python:
```python
# 1. os.environ (basic, not type-safe)
import os
api_key = os.environ.get("GEMINI_API_KEY")  # Always returns a string or None

# 2. python-dotenv (reads .env but still strings)
from dotenv import load_dotenv
load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")

# 3. pydantic-settings (type-safe, validates, raises clear errors) ✅
class Settings(BaseSettings):
    gemini_api_key: str  # If missing → app crashes with a clear error message
```
With option 3, if you forget to set `GEMINI_API_KEY`, the app won't start at all — you get an error immediately rather than a confusing `NoneType has no attribute 'configure'` crash later.

```python
class Settings(BaseSettings):
    gemini_api_key: str              # str = required (no default = must exist)
    debug: bool = True               # bool = required but has a default
    allowed_origins: List[str] = []  # List = comma-separated in .env
```

### How does `List[str]` work from an env var?
In `.env`: `ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000`
Pydantic automatically splits by comma → `["http://localhost:5173", "http://localhost:3000"]`

```python
    model_config = SettingsConfigDict(
        env_file=".env",             # "Read from .env file"
        case_sensitive=False,        # GEMINI_API_KEY and gemini_api_key both map to gemini_api_key
    )
```

```python
settings = Settings()  # Create once, import everywhere
```
This is the **Singleton pattern**: one object created at module import time, shared by the entire app. Any file that does `from config import settings` gets the same object.

---

## Chapter 3 — `database.py` — PostgreSQL Connection

**Purpose**: Create the database engine (connection pool) and session factory.

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
```

### What is SQLAlchemy?
SQLAlchemy is an ORM: **Object Relational Mapper**.
- Instead of writing raw SQL: `SELECT * FROM query_logs WHERE scheme_id = 'PM_KISAN'`
- You write Python: `session.query(QueryLog).filter(QueryLog.scheme_id == 'PM_KISAN')`
- SQLAlchemy translates Python to SQL automatically

### Why async SQLAlchemy?
Our app is async (FastAPI is async). If we use sync SQLAlchemy, database queries would block the entire event loop — defeating the purpose of async. `create_async_engine` uses `asyncpg` under the hood for truly non-blocking queries.

```python
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,   # echo=True prints SQL to console — great for learning!
    pool_size=5,           # 5 connections always open and ready
    max_overflow=10,       # Allow 10 more connections if all 5 are busy (total: 15)
)
```

**Why pooling?** Opening a new PostgreSQL connection takes ~50ms. With a connection pool, connections are reused — each request takes an existing connection from the pool, uses it, and returns it. Much faster.

```python
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,  # IMPORTANT for async: keeps objects usable after commit
)
```

`expire_on_commit=False`: By default, SQLAlchemy "expires" (clears) object attributes after a commit, forcing a re-fetch from DB. In async code, this re-fetch could happen at an unexpected time. Setting `False` avoids this problem.

```python
class Base(DeclarativeBase):
    pass
```
This creates the base class for all database table models. Any class that inherits from `Base` (like `QueryLog`) becomes a table definition.

---

## Chapter 4 — `models/request_models.py` — Input Validation

**Purpose**: Define exactly what JSON the frontend must send. FastAPI validates every incoming request against these models.

```python
from pydantic import BaseModel, Field
from enum import Enum
```

### What is Pydantic?
Pydantic validates data using Python type hints. If the data doesn't match, it automatically returns a 422 Unprocessable Entity error with a clear message.

```python
class LanguageCode(str, Enum):
    ENGLISH = "en"
    HINDI = "hi"
    # ...
```
**Why an Enum?** `language: str` would accept `"xyz"` or `"swahili"`. An Enum restricts to exactly the defined values. If `"xyz"` comes in → automatic 422 error: "value is not a valid enum member".

```python
class QueryRequest(BaseModel):
    query: str = Field(
        ...,              # ... means REQUIRED (Pydantic notation, not a typo!)
        min_length=2,     # Rejects empty/very short queries
        max_length=500,   # Prevents abuse (no 50,000-character queries)
        examples=["PM Kisan scheme kya hai"]  # Shows in Swagger UI /docs
    )
    use_ai: bool = Field(default=True)  # Can disable Gemini without code changes
```

The `Field(...)` notation is how you add metadata beyond just the type. `...` in Python means "Ellipsis" and in Pydantic specifically means "required".

---

## Chapter 5 — `services/schemes_service.py` — The Search Engine

**Purpose**: Python version of the frontend's `ai.js` keyword search. Loads Schemes.json and ranks schemes against the user's query.

```python
from functools import lru_cache
```

### `@lru_cache` — The Most Important Optimization Here

```python
@lru_cache(maxsize=1)
def load_schemes() -> list[dict]:
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)
```

`lru_cache` = "Least Recently Used Cache". It stores the return value of the function the first time it's called. Every subsequent call returns the cached result **without running the function again**.

- **Without cache**: Every API request reads `schemes.json` from disk (slow I/O)
- **With cache**: Disk read happens once at startup. All subsequent calls → instant memory lookup

`maxsize=1` = keep only 1 cached result (we only call this with no arguments, so 1 is enough).

```python
def normalize(text: str) -> str:
    text = text.lower()                       # "PM Kisan" → "pm kisan"
    text = re.sub(r"[^\w\s]", " ", text)     # Remove punctuation
    text = re.sub(r"\s+", " ", text).strip() # Collapse multiple spaces
    return text
```

**Why normalize?** "PM-KISAN", "pm kisan", "PM Kisan" all become "pm kisan". This makes keyword matching case-insensitive and punctuation-insensitive.

```python
def score_scheme(query_normalized: str, scheme_id: str, scheme: dict) -> float:
    keywords = SCHEME_KEYWORDS.get(scheme_id, [])  # Get keywords for this scheme
    score = 0.0
    total_weight = 0.0

    for kw in keywords:
        total_weight += 1.0
        if normalize(kw) in query_normalized:  # Keyword found in query?
            score += 1.0

    return score / total_weight if total_weight > 0 else 0.0
```

This produces a number between 0.0 and 1.0. If "kisan" is in the keywords and also in the query → score goes up. The final score is the fraction of keywords that matched.

**Why divide by `total_weight`?** Without division, a scheme with 20 keywords would always score higher than one with 5 keywords, even if only 1 keyword matched. Dividing normalizes the score.

---

## Chapter 6 — `services/gemini_service.py` — AI Integration

**Purpose**: Call Google Gemini to generate simplified, human-readable explanations.

```python
import google.generativeai as genai

genai.configure(api_key=settings.gemini_api_key)  # Set API key once
_model = genai.GenerativeModel(
    model_name=settings.gemini_model,
    generation_config=genai.types.GenerationConfig(
        max_output_tokens=512,   # Max length of response
        temperature=0.3,         # 0.0 = deterministic, 1.0 = creative
    ),
)
```

### `temperature` explained:
- `0.0`: Always picks the highest probability next token. Very consistent, but repetitive.
- `0.5`: Mix of consistency and creativity.
- `1.0`: Very creative, often unpredictable or "hallucinated".
- **Our choice: 0.3** — We want factual, consistent answers. Low temperature = reliable.

### `max_output_tokens=512`:
- 1 token ≈ 0.75 words in English, ~0.5 words in Hindi
- 512 tokens ≈ 250–350 words — enough for a clear explanation
- **Why limit?** Gemini charges by tokens. Limiting prevents accidentally generating 10,000-word responses.

```python
def _build_system_prompt(language: str) -> str:
    return f"""You are a helpful, patient government scheme explainer...
RULES:
1. Use ONLY the facts from the scheme data provided. Never add outside information.
2. Respond in {lang_name}.
3. Format your response as EXACTLY this JSON: ...
4. Never say "you are eligible" — use "people who qualify"
```

### Why such strict rules in the system prompt?
LLMs can "hallucinate" — invent facts that sound plausible but are wrong. For a government service app used by vulnerable citizens, wrong information is dangerous. Our rules:
1. `Use ONLY the facts provided` → prevents adding invented benefits
2. `Never guarantee eligibility` → legal protection, Gemini doesn't know the user's actual income/eligibility
3. `Return EXACTLY this JSON` → makes parsing reliable

```python
response = await _model.generate_content_async(
    contents=[user_prompt],
    system_instruction=system_prompt,
)
```

`generate_content_async` = async version (non-blocking). This is why we use `await`.

```python
raw_text = response.text.strip()
# Clean up if model accidentally wrapped in ```json ... ```
if raw_text.startswith("```"):
    raw_text = raw_text.split("```")[1]
    if raw_text.startswith("json"):
        raw_text = raw_text[4:]

parsed = json.loads(raw_text)
```

**Why the cleanup?** Despite instructions to return raw JSON, LLMs sometimes wrap it in markdown code fences: ` ```json {...} ``` `. We strip those before parsing.

```python
    except Exception as e:
        print(f"Gemini error (falling back to keyword results): {e}")
        return _fallback_explanation(scheme, intent)
```

**Graceful degradation**: If Gemini is down, rate-limited, or returns invalid JSON, we fall back to the keyword-based explanation (same as the frontend ai.js does). The app keeps working — just without AI.

---

## Chapter 7 — `routers/query.py` — The Main Endpoint

**Purpose**: The `/api/query` endpoint. Orchestrates the entire pipeline.

```python
router = APIRouter(prefix="/api", tags=["Query"])
```

`APIRouter` is a "mini FastAPI app" for grouping endpoints. `prefix="/api"` means all routes in this router start with `/api`. `tags=["Query"]` groups them in Swagger UI.

```python
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

**Dependency Injection pattern**: `get_db` is a "dependency" — a function FastAPI calls before your endpoint and injects the result. `yield` makes it a generator: code before `yield` runs before the endpoint, code after `yield` runs after.

```python
@router.post("/query", response_model=QueryResponse)
async def handle_query(
    request: QueryRequest,           # FastAPI validates request body
    db: AsyncSession = Depends(get_db)  # FastAPI injects DB session
) -> QueryResponse:
```

`response_model=QueryResponse`: FastAPI validates the return value against this model too, and uses it for Swagger documentation.

`Depends(get_db)`: FastAPI calls `get_db()`, gets the session, passes it as `db`. After the function returns, `get_db`'s cleanup code runs (closes the session).

```python
    ranked = search_schemes(request.query)
    top_match = ranked[0]
    confidence = top_match["confidence"]
```

We always get ranked results, even if confidence is 0 — because we need the top 4 for clarification cards.

```python
    if confidence < CONFIDENCE_THRESHOLD:  # 0.05
        options = [ClarificationOption(...) for match in ranked[:4]]
        # Don't call Gemini — just return the clarification cards
        return QueryResponse(type="clarification", ...)
```

**Why 0.05 threshold?** Below 5% confidence means the query matched almost nothing in our keyword lists. Better to ask the user than guess wrong.

```python
    await _log_query(...)   # Fire and forget (sort of)
```

**Why log even on clarification?** Analytics! Seeing which queries fail (low confidence) helps us improve the keyword lists.

```python
async def _log_query(...):
    try:
        log = QueryLog(...)
        db.add(log)
        await db.commit()
    except Exception as e:
        print(f"DB logging error (non-fatal): {e}")
        await db.rollback()   # Undo any partial write
```

Logging is **non-fatal**: if it fails (DB unreachable), we log to console and continue. The main response already went out. We `await db.rollback()` to clean up any partial transaction.

---

## Chapter 8 — `routers/speech.py` — Audio Upload

**Purpose**: Receive an audio file, transcribe it.

```python
async def transcribe(
    audio: UploadFile = File(...),     # Binary file upload
    language: str = Form(default="hi") # Text field alongside the file
):
```

**Why `Form` instead of JSON for language?**
When you upload a file, browsers use `multipart/form-data` format — a mix of binary and text. JSON can't contain binary data. So text fields alongside files must be `Form` fields too.

```python
audio_bytes = await audio.read()     # Read the entire file into memory
if len(audio_bytes) > MAX_SIZE:      # 10MB limit
    raise HTTPException(status_code=413, ...)
```

`await audio.read()`: File uploads are async streams. We `await` reading the full bytes into memory before passing to Google STT.

```python
content_type = audio.content_type or ""
encoding = "WEBM_OPUS"   # Default — what browsers send from MediaRecorder API
if "wav" in content_type:
    encoding = "LINEAR16"
```

Browsers record audio as `WebM/Opus` by default (the `MediaRecorder` API). But uploaded files (from tests or other clients) might be WAV or MP3. We detect the format from the MIME type.

---

## Chapter 9 — `main.py` — The App Entry Point

**Purpose**: Create and configure the FastAPI application.

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 SaralAI Backend starting...")
    await create_tables()       # Create DB tables on first startup
    yield                       # App runs here
    print("👋 SaralAI Backend shutting down...")
```

**`asynccontextmanager`**: Converts a generator function into a context manager. Code before `yield` = startup. Code after `yield` = shutdown. This replaces the older `@app.on_event("startup")` pattern (which is deprecated in FastAPI 0.111+).

```python
app = FastAPI(
    title="SaralAI — Government Services API",
    docs_url="/docs",      # Swagger UI: open http://localhost:8000/docs
    redoc_url="/redoc",    # ReDoc UI (cleaner, read-only)
)
```

**Swagger UI at `/docs`**: When you visit `http://localhost:8000/docs`, FastAPI automatically generates a full interactive API documentation page. You can test every endpoint from the browser without Postman.

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

**Rate limiting**: Without this, a bad actor could make 10,000 Gemini API calls per minute on your key. `60/minute` per IP address is enough for legitimate users and stops abuse.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Accept"],
)
```

**CORS (Cross-Origin Resource Sharing)**: Browsers block requests from `http://localhost:5173` (Vite) to `http://localhost:8000` (our API) by default — they're different origins (different ports). The browser sends a "preflight" OPTIONS request asking the API "can I call you?". Our CORS middleware says "yes, if you're from these allowed origins".

We restrict `allow_methods` to `["GET", "POST"]` — our API doesn't need PUT, DELETE, PATCH. Less surface area = more secure.

```python
app.include_router(query_router.router)
app.include_router(speech_router.router)
app.include_router(tts_router.router)
```

`include_router` mounts all the routes from a router file into the main app. This is how you organize a large FastAPI app — split routes into multiple files, then assemble in main.py.

---

## Chapter 10 — `Dockerfile` — Containerization

**Purpose**: Package the app and all its dependencies into a self-contained image.

```dockerfile
FROM python:3.12-slim
```

**Why `3.12-slim`?** Two options:
- `python:3.12`: Full Debian, ~1GB image. Includes compilers, build tools, debugging utils.
- `python:3.12-slim`: Minimal Debian, ~50MB. Only what Python needs.
Our app doesn't need compilers at runtime → slim is fine and deploys faster.

```dockerfile
WORKDIR /app
```
Sets `/app` as the working directory inside the container. All subsequent `COPY` and `RUN` commands execute relative to `/app`.

```dockerfile
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
```

**Why `COPY requirements.txt` BEFORE `COPY . .`?**
Docker builds in layers. Each instruction creates a cached layer. If you change `main.py` (but not `requirements.txt`), Docker skips the `pip install` layer — it's already cached. This makes rebuilds ~10x faster.

If you did `COPY . .` first, every code change would bust the cache and re-run `pip install` (takes 30–60 seconds each time).

```dockerfile
HEALTHCHECK --interval=30s CMD curl -f http://localhost:8000/api/health || exit 1
```

Railway checks this URL every 30 seconds. If it returns a non-200 response or times out 3 times in a row → Railway marks the container as unhealthy and restarts it.

---

## Chapter 11 — How It All Fits Together

### Request lifecycle for `POST /api/query`:

```
Browser (TypeScreen.js)
│
│ fetch("http://localhost:8000/api/query", {
│   method: "POST",
│   body: JSON.stringify({ query: "PM Kisan kya hai", language: "hi" })
│ })
│
▼
FastAPI (uvicorn receives HTTP request)
│
├── CORS middleware checks: "Is this origin allowed?" → Yes ✅
├── Rate limiter checks: "Is this IP under 60/min?" → Yes ✅
│
▼
main.py routes to routers/query.py → handle_query()
│
├── FastAPI validates request body against QueryRequest Pydantic model ✅
├── FastAPI calls get_db() → opens DB session, passes as `db`
│
▼
handle_query() executes:
│
├── schemes_service.search_schemes("PM Kisan kya hai")
│     → PM_KISAN scores 0.82 (highest)
│
├── intent_service.detect_intent("PM Kisan kya hai")
│     → "OVERVIEW" (matched "kya hai", "scheme")
│
├── confidence = 0.82 ≥ 0.05 → proceed to explanation
│
├── gemini_service.simplify_scheme(PM_KISAN_data, "OVERVIEW", "hi", query)
│     → Gemini API called with system prompt + scheme facts
│     → Returns: { summary: "...", key_points: [...], simple_steps: [...] }
│
├── Builds ExplanationContent from scheme data + Gemini output
│
├── _log_query() → saves to PostgreSQL query_logs table
│
▼
Returns QueryResponse JSON to frontend

Browser receives response:
└── ProcessingScreen.js stores in state → navigate('explanation')
└── ExplanationScreen.js renders the scheme name, summary, points
```

---

## Chapter 12 — Running the Backend (Step by Step)

### Local Development

```bash
# 1. Navigate to backend folder
cd c:\Users\siddh\Desktop\SaralAI\backend

# 2. Create virtual environment (isolated Python environment)
python -m venv venv

# 3. Activate it (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# 4. Install dependencies
pip install -r requirements.txt

# 5. Copy .env.example to .env and fill in your keys
copy .env.example .env
# (Edit .env with your GEMINI_API_KEY and other values)

# 6. Start the server with auto-reload
uvicorn main:app --reload --port 8000

# 7. Test it!
# Open: http://localhost:8000/docs → Interactive Swagger UI
# Or:   curl http://localhost:8000/api/health
```

### Test the Query Endpoint (Without Frontend)
Open `http://localhost:8000/docs` → find `POST /api/query` → click "Try it out" → enter:
```json
{
  "query": "PM Kisan scheme kya hai",
  "language": "hi"
}
```
Click "Execute" → should return scheme explanation with `confidence > 0.5`.

---

## Chapter 13 — Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ValidationError: gemini_api_key is required` | `.env` missing or `GEMINI_API_KEY` not set | Add to `.env` file |
| `google.auth.exceptions.DefaultCredentialsError` | `GOOGLE_APPLICATION_CREDENTIALS` path wrong | Check JSON file path in `.env` |
| `ModuleNotFoundError: No module named 'fastapi'` | venv not activated | Run `.\venv\Scripts\Activate.ps1` |
| `ConnectionRefusedError: PostgreSQL` | DB not running | Use SQLite default, or start PostgreSQL |
| `JSONDecodeError` from Gemini | Gemini returned markdown not JSON | Already handled in code — check `fallback_explanation` is called |
| `429 Too Many Requests` | Rate limit hit | Wait 60 seconds, or increase `MAX_REQUESTS_PER_MINUTE` |

---

## Chapter 14 — Database Migration (Alembic)

Alembic tracks database schema changes like Git tracks code changes.

```bash
# Initialize Alembic (one time)
alembic init alembic

# Create a migration (after changing db/query_log.py)
alembic revision --autogenerate -m "create query_logs table"

# Apply migrations to database
alembic upgrade head

# Downgrade if something went wrong
alembic downgrade -1
```

For our project, since we call `create_tables()` in `main.py` lifespan, Alembic isn't strictly needed for the initial table. But it becomes essential when you later add columns (like adding `feedback_rating` to `query_logs`).

---

## Appendix — Key Python Concepts Used

### `Optional[str]` vs `str | None`
Both mean the same thing (the value can be a string or None):
```python
from typing import Optional
x: Optional[str] = None   # Python 3.9 and older style
x: str | None = None      # Python 3.10+ style (we use this)
```

### `dict[str, list[str]]` type hint
```python
SCHEME_KEYWORDS: dict[str, list[str]] = {
    "PM_KISAN": ["kisan", "farmer"],
    "PM_JAY": ["ayushman", "health"],
}
# A dict where keys are strings and values are lists of strings
```

### `yield` in FastAPI dependencies
```python
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session      # Pause here, give session to the endpoint
        # After endpoint returns: cleanup happens here automatically
```
The `async with` ensures the session is properly closed even if the endpoint raises an exception.

### Exception hierarchy
```python
raise HTTPException(status_code=404, detail="Not found")
```
`HTTPException` is a FastAPI-specific exception that gets automatically converted to the correct HTTP response. Regular Python exceptions become 500 Internal Server Errors.
