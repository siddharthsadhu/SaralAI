"""
models/response_models.py — Pydantic models for outgoing HTTP responses
------------------------------------------------------------------------
All API responses are validated against these models before being sent.
This ensures the frontend always receives a consistent, typed structure.

Sarvam AI migration:
  - gemini_used → ai_used (reflects the new Sarvam AI provider)
  - QueryResponse: added source_type and source_url fields
  - TranscriptionResponse: language_detected now returns BCP-47 (e.g. "hi-IN")
    directly from Saaras v3 — no remapping needed.
"""
from pydantic import BaseModel
from typing import List, Optional, Literal


class DocumentItem(BaseModel):
    """A single required document for a scheme"""
    name: str
    mandatory: bool


class ClarificationOption(BaseModel):
    """A scheme card shown when the query is too vague"""
    scheme_id: str
    scheme_name: str
    category: str
    short_description: str
    emoji: str


class ExplanationContent(BaseModel):
    """The structured scheme explanation returned to the frontend"""
    scheme_name: str
    category: str
    summary: str                    # AI-translated prose (or English fallback)
    key_points: List[str]
    eligibility_points: List[str]
    benefit_points: List[str]
    documents: List[DocumentItem]
    steps: List[str]
    application_mode: str
    official_source: str
    disclaimer: str


class QueryResponse(BaseModel):
    """
    The complete response for POST /api/query.
    `type` tells the frontend what to do:
    - "explanation"   → go to explanation screen
    - "clarification" → go to clarification screen
    - "error"         → show error toast
    """
    type: Literal["explanation", "clarification", "error"]
    intent: Optional[str] = None                    # OVERVIEW / ELIGIBILITY / DOCUMENTS / STEPS
    confidence: float = 0.0
    scheme_id: Optional[str] = None
    content: Optional[ExplanationContent] = None
    clarification_options: List[ClarificationOption] = []
    ai_used: bool = False                           # True = sarvam-m was called
    source_type: Optional[str] = None              # "local_db" | "wikipedia" | "training_knowledge"
    source_url: Optional[str] = None               # Wikipedia URL if applicable
    language_code: Optional[str] = None            # BCP-47 code the response was translated to
    error_message: Optional[str] = None


class TranscriptionResponse(BaseModel):
    """
    Response from POST /api/speech/transcribe.
    language_detected is now a BCP-47 code (e.g. "hi-IN") returned
    directly by Saaras v3 — the frontend should store this and use it
    for subsequent /api/query and /api/tts/speak calls.
    """
    transcript: str
    confidence: float
    language_detected: str          # BCP-47 code e.g. "hi-IN"


class HealthResponse(BaseModel):
    """Response from GET /api/health"""
    status: str
    version: str
    environment: str
