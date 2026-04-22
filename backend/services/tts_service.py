"""
services/tts_service.py — Sarvam AI Text-to-Speech (Bulbul v3)
---------------------------------------------------------------
Converts text to natural-sounding Indian-language speech.

Key upgrades over the previous Google Cloud TTS integration:
  - Bulbul v3 is purpose-built for Indian languages — accents, rhythms,
    and pronunciation of words like "Pradhan Mantri" are natural.
  - Language-specific verified speakers (not a generic voice selector).
  - Returns WAV bytes (base64-decoded from JSON response).
  - TTS is ON-DEMAND ONLY — this function is never called automatically.
    It is only invoked when the user explicitly clicks the Listen button.

API Details:
  Endpoint:  POST https://api.sarvam.ai/text-to-speech
  Auth:      api-subscription-key: {SARVAM_API_KEY}  (NOT Bearer)
  Max chars: 2500 per request (text is truncated if longer)
  Output:    base64-encoded WAV in response["audios"][0]

IMPORTANT: Always call clean_text_for_tts() BEFORE passing text to this
           function. Bulbul reads markdown symbols literally.
"""
import base64
import requests
from config import settings
from services.text_utils import clean_text_for_tts


# ── API Configuration ─────────────────────────────────────────────────────────
_TTS_URL       = "https://api.sarvam.ai/text-to-speech"
_TTS_MAX_CHARS = 2500   # Bulbul v3 hard limit per request

# ── Verified Speaker Map — Bulbul v3 ─────────────────────────────────────────
# Each language has one confirmed working speaker.
# Only speakers listed here are known to work reliably with Bulbul v3.
_SPEAKER_MAP: dict[str, str] = {
    "hi-IN": "priya",    # Hindi    — Female
    "ta-IN": "kavitha",  # Tamil    — Female
    "te-IN": "vijay",    # Telugu   — Male
    "bn-IN": "anand",    # Bengali  — Male
    "ml-IN": "mani",     # Malayalam — Male
    "kn-IN": "gokul",    # Kannada  — Male
    "mr-IN": "ishita",   # Marathi  — Female
    "gu-IN": "manan",    # Gujarati — Male
    "pa-IN": "simran",   # Punjabi  — Female
    "or-IN": "roopa",    # Odia     — Female
    "en-IN": "shubh",    # English  — Male
}

# Fallback for unknown language codes
_DEFAULT_SPEAKER       = "shubh"
_DEFAULT_LANGUAGE_CODE = "en-IN"

# Short code → BCP-47 mapping (for backward compat with old callers)
_SHORT_TO_BCP47: dict[str, str] = {
    "hi": "hi-IN",
    "en": "en-IN",
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


async def text_to_speech(
    text: str,
    language: str = "hi-IN",
    voice_gender: str = "FEMALE",  # Kept for API compat — Bulbul uses speaker name, not gender
) -> bytes:
    """
    Convert text to WAV audio bytes using Sarvam AI Bulbul v3.

    This function should ONLY be called when the user explicitly requests
    audio playback. Never call it automatically — it consumes API credits.

    Args:
        text:         Text to speak. Will be cleaned and truncated automatically.
        language:     BCP-47 code ("hi-IN") or short code ("hi") — both accepted.
        voice_gender: Ignored (kept for backward compatibility with old callers).
                      Speaker is determined by language, not gender.

    Returns:
        Raw WAV bytes ready to stream. Frontend plays with <audio> element.

    Raises:
        Exception if the API call fails (caller should handle gracefully).
    """
    if not text or not text.strip():
        raise ValueError("TTS: text cannot be empty")

    # Normalize language code (accept both "hi" and "hi-IN")
    if "-" not in language:
        language = _SHORT_TO_BCP47.get(language, _DEFAULT_LANGUAGE_CODE)

    # Clean text before sending (strips markdown, converts ₹ → "rupees", etc.)
    clean_text = clean_text_for_tts(text)

    # Truncate to Bulbul's 2500-char limit
    if len(clean_text) > _TTS_MAX_CHARS:
        clean_text = clean_text[:_TTS_MAX_CHARS - 3] + "..."

    # Select verified speaker for this language
    speaker = _SPEAKER_MAP.get(language, _DEFAULT_SPEAKER)

    headers = {
        "api-subscription-key": settings.sarvam_api_key,
        "Content-Type":         "application/json",
    }

    payload = {
        "target_language_code": language,
        "text":                 clean_text,
        "model":                "bulbul:v3",
        "speaker":              speaker,
    }

    print(f"[Bulbul] TTS request: language={language}, speaker={speaker}, chars={len(clean_text)}")

    response = requests.post(
        _TTS_URL,
        json=payload,
        headers=headers,
        timeout=60,
    )

    if response.status_code == 403:
        raise ValueError("Sarvam API key invalid. Check SARVAM_API_KEY in .env")
    if response.status_code == 429:
        raise ValueError("Sarvam TTS quota exceeded. Check your dashboard.")

    response.raise_for_status()

    # Response contains base64-encoded WAV audio
    audios = response.json().get("audios", [])
    if not audios:
        raise ValueError("Bulbul v3 returned empty audios list")

    wav_bytes = base64.b64decode(audios[0])
    print(f"[Bulbul] TTS success: {len(wav_bytes)} bytes of WAV audio")
    return wav_bytes
