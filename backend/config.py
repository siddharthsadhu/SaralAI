"""
config.py — Application Settings
---------------------------------
Uses Pydantic BaseSettings to load environment variables from .env file.
Type-safe: if SARVAM_API_KEY is missing, the app won't even start.

Sarvam AI migration: Replaced all Google AI keys with a single SARVAM_API_KEY.
One key covers all 4 Sarvam services: STT (Saaras), LLM (sarvam-m),
Translation (Mayura), and TTS (Bulbul).
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """
    All configuration values are loaded from environment variables.
    Pydantic automatically reads from .env file (see model_config).
    """
    # ── App Info ──────────────────────────────────────────────────
    app_env: str = "development"
    debug: bool = True
    app_version: str = "1.0.0"

    # ── Sarvam AI (Single key for all 4 services) ─────────────────
    # STT:         Saaras v3   → api-subscription-key header
    # LLM:         sarvam-m    → Authorization: Bearer header
    # Translation: Mayura v1   → api-subscription-key header
    # TTS:         Bulbul v3   → api-subscription-key header
    sarvam_api_key: str         # Required — no default, app won't start without it

    # ── Auth Properties ───────────────────────────────────────────
    google_client_id: str = ""
    jwt_secret: str = "saralai-secret-key-for-dev-change-it"

    # ── Database ──────────────────────────────────────────────────
    database_url: str = "sqlite+aiosqlite:///./saralai_dev.db"  # SQLite for dev

    # ── CORS ──────────────────────────────────────────────────────
    # Will be parsed as a list (comma-separated in .env)
    allowed_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # ── Rate Limiting ─────────────────────────────────────────────
    max_requests_per_minute: int = 60

    # Pydantic config: tell it to read from .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,  # SARVAM_API_KEY and sarvam_api_key both work
    )


# Create a single instance that the whole app imports
# This is the Singleton pattern — one Settings object, shared everywhere
settings = Settings()
