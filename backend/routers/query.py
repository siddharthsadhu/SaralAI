"""
routers/query.py — POST /api/query (Main Endpoint)
----------------------------------------------------
This is the heart of the backend. Receives a user's text question,
runs it through the scheme search + Sarvam AI pipeline, and returns
a structured explanation (or clarification options).

Sarvam AI pipeline (4 stages):
  1. schemes_service  → find scheme in local JSON (keyword search)
  2. gemini_service   → sarvam-m LLM generates English explanation
     (grounding: local DB first → Wikipedia fallback → training knowledge)
  3. translation_service → Mayura v1 translates English → target language
     (skipped entirely if target language is English)
  4. /api/tts/speak   → Bulbul v3 TTS (ON DEMAND ONLY — NOT called here)

Note on TTS: TTS is NEVER called in this endpoint. The translated text is
returned to the frontend, and TTS is only triggered if the user taps Listen.
This saves Bulbul v3 API credits for users who only need to read the answer.
"""
import time
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from models.request_models import QueryRequest, SHORT_TO_BCP47
from models.response_models import (
    QueryResponse, ExplanationContent, ClarificationOption, DocumentItem
)
from services.schemes_service import search_schemes, get_emoji
from services.intent_service import detect_intent
from services.gemini_service import simplify_scheme
from services.translation_service import translate_text
from database import AsyncSessionLocal
from db.query_log import QueryLog

# CLARIFICATION THRESHOLD — below 0.05 confidence = too vague, ask user
CONFIDENCE_THRESHOLD = 0.05

# APIRouter: a mini-app that groups related endpoints
# main.py will mount this at prefix "/api"
router = APIRouter(prefix="/api", tags=["Query"])


async def get_db():
    """
    Dependency: provides a database session for each request.
    Yields the session (so FastAPI can close it after the response).
    """
    async with AsyncSessionLocal() as session:
        yield session


_DELIM = "|||"   # Delimiter to batch multiple strings in a single Mayura call


async def _translate_all_arrays(data: list[str], target_lang: str) -> list[str]:
    """
    Batch-translate a list of English strings into target_lang using one Mayura call.
    Joins all items with _DELIM, translates, then splits back.
    Falls back to the original English list on any error or split count mismatch.
    """
    if not data or target_lang in ("en-IN", "en"):
        return data
    # Filter out empty strings to avoid wasting API chars, remember their positions
    indexed = [(i, s) for i, s in enumerate(data) if s.strip()]
    if not indexed:
        return data
    indices, strings = zip(*indexed)
    joined = _DELIM.join(strings)
    try:
        translated_joined = await translate_text(
            text=joined,
            target_language_code=target_lang,
        )
        parts = translated_joined.split(_DELIM)
        if len(parts) != len(strings):
            print(f"[BatchTranslate] Split mismatch ({len(parts)} vs {len(strings)}) — using English fallback")
            return data
        # Re-insert translated strings at correct positions
        result = list(data)
        for pos, (original_idx, _) in enumerate(indexed):
            result[original_idx] = parts[pos].strip()
        return result
    except Exception as e:
        print(f"[BatchTranslate] Error: {e} — using English fallback")
        return data


@router.post("/query", response_model=QueryResponse)
async def handle_query(
    request: QueryRequest,
    db: AsyncSession = Depends(get_db)
) -> QueryResponse:
    """
    Main query endpoint. Steps:
    1. Search schemes by keyword matching (local JSON)
    2. Detect intent (OVERVIEW/ELIGIBILITY/DOCUMENTS/STEPS)
    3. If confidence is too low → return clarification options
    4. If confidence is OK → call sarvam-m for AI explanation (English)
    5. Translate English explanation to user's language via Mayura v1
    6. Log the query to database
    7. Return structured response (NO TTS — that's on-demand via /api/tts/speak)
    """
    start_time = time.time()

    # ── Step 0: Pre-translate query to English for Keyword Matcher ─────────
    target_lang_bcp47 = SHORT_TO_BCP47.get(request.language.value, "en-IN")
    search_query = request.query
    
    if request.language.value != "en" and request.use_ai:
        try:
            english_query = await translate_text(
                text=request.query,
                target_language_code="en-IN",
                source_language_code=target_lang_bcp47,
            )
            if english_query:
                search_query = english_query
                print(f"[Query] Translated to English for search: '{search_query}'")
        except Exception as e:
            print(f"[Query] Warning: Failed to pre-translate query: {e}")

    # ── Step 1: Search all schemes ─────────────────────────────────────────
    ranked = search_schemes(search_query)   # Returns [{scheme, confidence}, ...]
    top_match = ranked[0]
    confidence = top_match["confidence"]
    top_scheme = top_match["scheme"]

    # ── Step 2: Detect intent ──────────────────────────────────────────────
    intent = detect_intent(request.query)

    # ── Step 3: Low confidence → clarification ─────────────────────────────
    if confidence < CONFIDENCE_THRESHOLD:
        options = [
            ClarificationOption(
                scheme_id=match["scheme"].get("scheme_id", ""),
                scheme_name=match["scheme"].get("scheme_name", ""),
                category=match["scheme"].get("category", ""),
                short_description=match["scheme"].get("who_is_it_for", {}).get("short", ""),
                emoji=get_emoji(match["scheme"].get("category", "")),
            )
            for match in ranked[:4]
        ]
        await _log_query(db, request, intent, None, confidence, False, time.time() - start_time)
        return QueryResponse(
            type="clarification",
            confidence=confidence,
            clarification_options=options,
        )

    # ── Step 4: Build English explanation using sarvam-m (or fallback) ────
    sarvam_result = await simplify_scheme(
        scheme=top_scheme,
        intent=intent,
        language=request.language.value,    # Passed through for compat, not used by LLM
        user_query=search_query,            # Pass the English translation to keep LLM strictly in English
    ) if request.use_ai else {
        "summary": "", "key_points": [], "simple_steps": [],
        "ai_used": False, "source_type": "local_db", "source_url": None
    }

    english_summary = sarvam_result.get("summary", "")

    # ── Step 5: Translate English → user's language via Mayura v1 ─────────
    translated_summary = english_summary  # Default: use English as-is
    eligibility_points = [c.get("condition", "") for c in top_scheme.get("eligibility_criteria", [])]
    benefit_points = top_scheme.get("benefits", {}).get("details", [])
    steps = sarvam_result.get("simple_steps") or top_scheme.get("application_process", {}).get("steps", [])
    doc_names = [doc.get("document_name", "") for doc in top_scheme.get("required_documents", [])]

    # Scheme metadata that also needs translation
    translated_scheme_name = scheme_name = top_scheme.get("scheme_name", "")
    translated_category = top_scheme.get("category", "")
    translated_app_mode = top_scheme.get("application_process", {}).get("mode", "")

    if request.use_ai and request.language.value != "en":
        translated_summary = await translate_text(english_summary, target_lang_bcp47)
        eligibility_points = await _translate_all_arrays(eligibility_points, target_lang_bcp47)
        benefit_points = await _translate_all_arrays(benefit_points, target_lang_bcp47)
        steps = await _translate_all_arrays(steps, target_lang_bcp47)
        doc_names = await _translate_all_arrays(doc_names, target_lang_bcp47)
        # Also translate scheme metadata fields so the UI shows zero English
        meta_fields = await _translate_all_arrays(
            [scheme_name, translated_category, translated_app_mode],
            target_lang_bcp47,
        )
        translated_scheme_name = meta_fields[0]
        translated_category = meta_fields[1]
        translated_app_mode = meta_fields[2]

    # ── Step 6: Assemble response from scheme data + AI output ────────────
    scheme = top_scheme
    documents = [
        DocumentItem(name=name, mandatory=doc.get("mandatory", True))
        for name, doc in zip(doc_names, scheme.get("required_documents", []))
    ]

    content = ExplanationContent(
        scheme_name=translated_scheme_name,
        category=translated_category,
        # Use AI-translated summary if available; fallback to scheme short description
        summary=translated_summary or scheme.get("who_is_it_for", {}).get("short", ""),
        key_points=benefit_points,   # Use the already-translated benefit_points for key_points too
        eligibility_points=eligibility_points,
        benefit_points=benefit_points,
        documents=documents,
        steps=steps,
        application_mode=translated_app_mode,
        official_source=scheme.get("source_information", {}).get("official_website", ""),
        disclaimer="",
    )

    # ── Step 7: Log to database ────────────────────────────────────────────
    await _log_query(
        db, request, intent,
        scheme.get("scheme_id"),
        confidence,
        sarvam_result.get("ai_used", False),
        time.time() - start_time
    )

    return QueryResponse(
        type="explanation",
        intent=intent,
        confidence=confidence,
        scheme_id=scheme.get("scheme_id"),
        content=content,
        ai_used=sarvam_result.get("ai_used", False),
        source_type=sarvam_result.get("source_type"),
        source_url=sarvam_result.get("source_url"),
        language_code=target_lang_bcp47,
    )


async def _log_query(
    db: AsyncSession,
    request: QueryRequest,
    intent: str,
    scheme_id: str | None,
    confidence: float,
    ai_used: bool,
    elapsed: float,
):
    """Save a query record to PostgreSQL for analytics."""
    try:
        log = QueryLog(
            session_id=request.session_id,
            query_text=request.query,
            language=request.language.value,
            intent=intent,
            scheme_id=scheme_id,
            confidence=confidence,
            gemini_used=ai_used,        # DB column name kept as-is to avoid migration
            response_time_ms=int(elapsed * 1000),
        )
        db.add(log)
        await db.commit()
    except Exception as e:
        # Logging failure should never break the main response
        print(f"DB logging error (non-fatal): {e}")
        await db.rollback()
