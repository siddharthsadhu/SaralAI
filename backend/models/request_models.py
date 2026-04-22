"""
models/request_models.py — Pydantic models for incoming HTTP requests
-----------------------------------------------------------------------
Every API endpoint validates the request body against these models.
If the request doesn't match, FastAPI automatically returns a 422 error.

Sarvam AI migration:
  - Added SarvamLanguageCode enum with full BCP-47 codes (hi-IN, en-IN, etc.)
    used by the STT and TTS endpoints.
  - TTSRequest: removed voice_gender (Bulbul v3 uses speaker name from language),
    updated language to use BCP-47 codes.
  - QueryRequest: kept LanguageCode for backward compat with frontend.
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class LanguageCode(str, Enum):
    """
    Short language codes used by QueryRequest.
    These match what the frontend sends and are used to select
    the Mayura v1 target language for translation.
    """
    ENGLISH   = "en"
    HINDI     = "hi"
    BENGALI   = "bn"
    TELUGU    = "te"
    MARATHI   = "mr"
    TAMIL     = "ta"
    GUJARATI  = "gu"
    KANNADA   = "kn"
    MALAYALAM = "ml"
    PUNJABI   = "pa"
    ODIA      = "or"


class SarvamLanguageCode(str, Enum):
    """
    Full BCP-47 language codes used by Sarvam AI APIs (STT, Translation, TTS).
    Saaras v3 auto-detects and returns these; Mayura and Bulbul accept these.
    """
    HINDI     = "hi-IN"
    ENGLISH   = "en-IN"
    BENGALI   = "bn-IN"
    TELUGU    = "te-IN"
    MARATHI   = "mr-IN"
    TAMIL     = "ta-IN"
    GUJARATI  = "gu-IN"
    KANNADA   = "kn-IN"
    MALAYALAM = "ml-IN"
    PUNJABI   = "pa-IN"
    ODIA      = "or-IN"


# Map short codes → BCP-47 (used in query.py to convert language before translation)
SHORT_TO_BCP47: dict[str, str] = {
    "en": "en-IN",
    "hi": "hi-IN",
    "bn": "bn-IN",
    "te": "te-IN",
    "mr": "mr-IN",
    "ta": "ta-IN",
    "gu": "gu-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "pa": "pa-IN",
    "or": "or-IN",
}


class QueryRequest(BaseModel):
    """Request body for POST /api/query"""
    query: str = Field(
        ...,                            # ... means required (no default)
        min_length=2,
        max_length=500,
        description="The user's question in any Indian language or English",
        examples=["PM Kisan scheme kya hai", "Ayushman Bharat documents needed"]
    )
    language: LanguageCode = Field(
        default=LanguageCode.HINDI,
        description="Language the response should be translated to"
    )
    session_id: Optional[str] = Field(
        default=None,
        max_length=36,
        description="Anonymous session ID for query history (optional)"
    )
    use_ai: bool = Field(
        default=True,
        description="If False, use keyword search only (faster, no Sarvam LLM cost)"
    )


class SpeechRequest(BaseModel):
    """
    Note: For file uploads we use Form data, not JSON.
    This model is for metadata alongside the audio file.
    Language is NOT included — Saaras v3 auto-detects it from speech.
    """
    session_id: Optional[str] = None


class TTSRequest(BaseModel):
    """
    Request body for POST /api/tts/speak.
    Language uses BCP-47 codes matching what Saaras returns (hi-IN, ta-IN, etc.)
    voice_gender removed — Bulbul v3 uses a per-language speaker name, not gender.
    """
    text: str = Field(
        ...,
        min_length=1,
        max_length=3000,   # Slightly above Bulbul's 2500 limit — service handles truncation
        description="Text to convert to speech"
    )
    language: str = Field(
        default="hi-IN",
        description="BCP-47 language code (e.g. hi-IN, ta-IN, en-IN)"
    )
