"""
main.py — FastAPI Application Entry Point
-------------------------------------------
This is the FIRST FILE FastAPI reads when it starts.
It:
  1. Creates the FastAPI app with metadata
  2. Configures CORS (which frontends can call this API)
  3. Adds rate limiting middleware
  4. Mounts all routers (query, speech, tts)
  5. Defines startup/shutdown lifecycle events
  6. Exposes health check and scheme listing endpoints
"""
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import settings
from database import create_tables
import models.db_models  # MUST import to register Base.metadata
from routers import query as query_router
from routers import speech as speech_router
from routers import tts as tts_router
from routers import auth as auth_router
from routers import feedback as feedback_router
from services.schemes_service import get_all_schemes_summary, get_scheme_by_id
from models.response_models import HealthResponse


# ── Rate Limiter ──────────────────────────────────────────────────────────────
# Uses client IP address as the key
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])


# ── Lifespan: runs code on startup / shutdown ─────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Code before `yield` runs at startup.
    Code after `yield` runs at shutdown.
    This is the modern FastAPI way to do startup/cleanup logic.
    """
    print("SaralAI Backend starting...")
    await create_tables()           # Create DB tables if they don't exist
    print("Database tables ready")
    print(f"Running in {settings.app_env} mode")
    yield                           # App runs here
    print("SaralAI Backend shutting down...")


# ── Create the FastAPI app ─────────────────────────────────────────────────────
app = FastAPI(
    title="SaralAI — Government Services API",
    description="Voice-first AI assistant for Indian government scheme guidance",
    version=settings.app_version,
    docs_url="/docs",          # Swagger UI at /docs
    redoc_url="/redoc",        # ReDoc at /redoc
    lifespan=lifespan,
)

# Attach rate limiter to the app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ── CORS Configuration ────────────────────────────────────────────────────────
# CORS = Cross-Origin Resource Sharing
# Browsers block requests from different domains by default.
# This tells the browser: "It's OK for these origins to call our API."
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,    # Our Vite frontend URL
    allow_credentials=False,                   # No cookies needed
    allow_methods=["GET", "POST"],             # Only allow GET and POST
    allow_headers=["Content-Type", "Accept"],  # Standard headers only
)


# ── Mount Routers ─────────────────────────────────────────────────────────────
# Each router handles a group of endpoints
app.include_router(query_router.router)    # /api/query
app.include_router(speech_router.router)  # /api/speech/transcribe
app.include_router(tts_router.router)     # /api/tts/speak
app.include_router(auth_router.router)    # /api/auth
app.include_router(feedback_router.router) # /api/feedback


# ── Utility Endpoints ─────────────────────────────────────────────────────────

@app.get("/api/health", tags=["Utility"])
async def health_check():
    """
    Health check endpoint. Railway uses this to know the service is alive.
    Returns 200 OK when everything is running.
    """
    return {
        "status":"ok",
        "version":settings.app_version,
        "environment":settings.app_env,
        "google_client": settings.google_client_id
    }


@app.get("/api/schemes", tags=["Schemes"])
async def list_schemes():
    """List all 10 MVP schemes (brief summary only)."""
    return get_all_schemes_summary()


@app.get("/api/scheme/{scheme_id}", tags=["Schemes"])
async def get_scheme(scheme_id: str):
    """Get the full data for a specific scheme by ID (e.g., 'PM_KISAN')."""
    scheme = get_scheme_by_id(scheme_id.upper())
    if not scheme:
        return JSONResponse(
            status_code=404,
            content={"detail": f"Scheme '{scheme_id}' not found."}
        )
    return scheme


# ── Global Error Handler ──────────────────────────────────────────────────────
@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    """
    Catch-all for unexpected errors.
    In production: never expose the real error message to the client.
    """
    print(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong. Please try again."}
    )
