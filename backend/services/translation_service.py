"""
services/translation_service.py — Mayura v1 Translation (Sarvam AI)
---------------------------------------------------------------------
Translates English text into any of the 11 supported Indian languages
using Sarvam AI's Mayura v1 Neural Machine Translation model.

Key implementation details:
  - Auth header:  api-subscription-key (NOT Bearer — different from LLM!)
  - Endpoint:     POST https://api.sarvam.ai/translate
  - Char limit:   Max 1000 chars per API call → text is chunked at word
                  boundaries and each chunk is translated separately.
  - Short-circuit: If target language is "en-IN", return as-is (no API call).
  - Mode:         "classic-colloquial" — natural, conversational translation
                  (not formal/legal style).
"""
import requests
from config import settings


# ── API Configuration ─────────────────────────────────────────────────────────
_TRANSLATE_URL = "https://api.sarvam.ai/translate"
_MAX_CHUNK_SIZE = 1000   # Mayura v1 per-request character limit


def _chunk_text(text: str, max_length: int = _MAX_CHUNK_SIZE) -> list[str]:
    """
    Split text into chunks of at most max_length characters, splitting
    only at word boundaries (spaces) to avoid breaking words mid-way.

    Args:
        text:       Text to chunk
        max_length: Maximum characters per chunk

    Returns:
        List of text chunks, each ≤ max_length characters.
    """
    chunks = []
    remaining = text

    while len(remaining) > max_length:
        # Find the last space within the limit
        split_at = remaining.rfind(" ", 0, max_length)
        if split_at == -1:
            # No space found — force split at limit (shouldn't happen for normal text)
            split_at = max_length
        chunks.append(remaining[:split_at].strip())
        remaining = remaining[split_at:].strip()

    if remaining:
        chunks.append(remaining)

    return chunks


async def translate_text(
    text: str,
    target_language_code: str,
    source_language_code: str = "en-IN",
) -> str:
    """
    Translate text from source language to target language using Mayura v1.

    Args:
        text:                 English text to translate (output from sarvam-m)
        target_language_code: BCP-47 target language code (e.g. "hi-IN", "ta-IN")
        source_language_code: BCP-47 source language code (default: "en-IN")

    Returns:
        Translated text string.
        Returns original text if:
          - target language is already English ("en-IN")
          - text is empty
          - API call fails (graceful fallback)
    """
    # Guard: empty text
    if not text or not text.strip():
        return text

    # Short-circuit: if source and target are the same, or if we requested translation to English BUT the source is already English
    if source_language_code == target_language_code:
        return text
    if (target_language_code == "en-IN" or target_language_code == "en") and (source_language_code == "en-IN" or source_language_code == "en"):
        return text

    # Auth header for Sarvam Translate (api-subscription-key, NOT Bearer)
    headers = {
        "api-subscription-key": settings.sarvam_api_key,
        "Content-Type": "application/json",
    }

    # Chunk the text to respect Mayura's 1000-char limit
    chunks = _chunk_text(text)
    translated_chunks = []

    for chunk in chunks:
        payload = {
            "input":                chunk,
            "source_language_code": source_language_code,
            "target_language_code": target_language_code,
            "speaker_gender":       "Female",
            "mode":                 "classic-colloquial",
            "model":                "mayura:v1",
            "enable_preprocessing": False,
        }

        try:
            response = requests.post(
                _TRANSLATE_URL,
                json=payload,
                headers=headers,
                timeout=30,
            )

            if response.status_code == 429:
                print("[Mayura] Quota exceeded — returning original text for this chunk")
                translated_chunks.append(chunk)  # Fallback: keep original
                continue

            if response.status_code == 403:
                print("[Mayura] Invalid API key — check SARVAM_API_KEY in .env")
                translated_chunks.append(chunk)
                continue

            response.raise_for_status()
            translated = response.json().get("translated_text", chunk)
            translated_chunks.append(translated)

        except requests.exceptions.Timeout:
            print(f"[Mayura] Timeout translating chunk — using original")
            translated_chunks.append(chunk)
        except Exception as e:
            print(f"[Mayura] Translation error: {e} — using original chunk")
            translated_chunks.append(chunk)

    return "\n".join(translated_chunks)
