"""
services/stt_service.py — Sarvam AI Speech-to-Text (Saaras v3)
---------------------------------------------------------------
Converts audio to text AND auto-detects the speaker's language.

Key upgrade over the previous Google Cloud STT integration:
  - Language is AUTO-DETECTED from speech — the caller does NOT need to
    specify which language the user is speaking.
  - Returns BCP-47 language codes (e.g. "hi-IN") directly — no remapping.
  - Single API key for all Sarvam services (set in config.py).

API Details:
  Endpoint:  POST https://api.sarvam.ai/speech-to-text
  Auth:      api-subscription-key: {SARVAM_API_KEY}  (NOT Bearer)
  Format:    multipart/form-data
  Model:     saaras:v3
  Mode:      transcribe

Supported audio formats: WAV (preferred), WebM, OGG, MP3
"""
import io
import requests
from config import settings


# ── API Configuration ─────────────────────────────────────────────────────────
_STT_URL = "https://api.sarvam.ai/speech-to-text"

# BCP-47 language codes supported by Saaras v3 (for reference / validation)
SUPPORTED_LANGUAGE_CODES = {
    "hi-IN", "en-IN", "bn-IN", "te-IN", "mr-IN",
    "ta-IN", "gu-IN", "kn-IN", "ml-IN", "pa-IN", "or-IN",
}


async def transcribe_audio(
    audio_bytes: bytes,
    audio_encoding: str = "WEBM_OPUS",   # Kept for API compatibility — not sent to Saaras
    sample_rate: int = 48000,            # Kept for API compatibility — not sent to Saaras
    language: str = "auto",             # Kept for API compatibility — Saaras auto-detects
) -> dict:
    """
    Transcribe audio using Sarvam AI Saaras v3.

    Saaras v3 automatically detects the speaker's language — no need to
    pass the language in. The detected language code is returned in the
    response and is used downstream to drive translation and TTS.

    Args:
        audio_bytes:    Raw audio file bytes
        audio_encoding: Ignored (kept for API compat with caller)
        sample_rate:    Ignored (kept for API compat with caller)
        language:       Ignored (kept for API compat with caller)

    Returns:
        {
            "transcript":       str,    # Transcribed text
            "confidence":       float,  # Always 1.0 (Saaras doesn't return confidence)
            "language_detected": str,   # BCP-47 code e.g. "hi-IN"
        }
    """
    if not audio_bytes:
        return {
            "transcript":        "",
            "confidence":        0.0,
            "language_detected": "hi-IN",
            "error":             "Empty audio received",
        }

    headers = {
        "api-subscription-key": settings.sarvam_api_key,
    }

    filename = "audio.webm"
    mime_type = "audio/webm"
    if audio_encoding == "LINEAR16":
        filename = "audio.wav"
        mime_type = "audio/wav"
    elif audio_encoding == "MP3":
        filename = "audio.mp3"
        mime_type = "audio/mp3"
    elif audio_encoding == "OGG_OPUS":
        filename = "audio.ogg"
        mime_type = "audio/ogg"

    # Saaras v3 requires multipart/form-data
    files = {
        "file": (filename, io.BytesIO(audio_bytes), mime_type),
    }
    data = {
        "model": "saaras:v3",
        "mode":  "transcribe",
    }

    try:
        response = requests.post(
            _STT_URL,
            headers=headers,
            files=files,
            data=data,
            timeout=30,
        )

        if response.status_code == 403:
            print("[Saaras] Invalid API key — check SARVAM_API_KEY in .env")
            return {
                "transcript":        "",
                "confidence":        0.0,
                "language_detected": "hi-IN",
                "error":             "Invalid API key",
            }

        if response.status_code == 429:
            print("[Saaras] Quota exceeded")
            return {
                "transcript":        "",
                "confidence":        0.0,
                "language_detected": "hi-IN",
                "error":             "Quota exceeded",
            }

        response.raise_for_status()
        result = response.json()

        transcript = result.get("transcript", "").strip()
        # Saaras returns BCP-47 codes like "hi-IN"; default to "hi-IN" if missing
        language_code = result.get("language_code", "hi-IN")

        if not transcript:
            return {
                "transcript":        "",
                "confidence":        0.0,
                "language_detected": language_code,
                "error":             "No speech detected",
            }

        print(f"[Saaras] Transcribed ({language_code}): {transcript[:60]}...")

        return {
            "transcript":        transcript,
            "confidence":        1.0,   # Saaras v3 doesn't return per-word confidence
            "language_detected": language_code,
        }

    except requests.exceptions.Timeout:
        print("[Saaras] Request timed out (30s)")
        return {
            "transcript":        "",
            "confidence":        0.0,
            "language_detected": "hi-IN",
            "error":             "STT request timed out",
        }
    except Exception as e:
        print(f"[Saaras] Unexpected error: {e}")
        return {
            "transcript":        "",
            "confidence":        0.0,
            "language_detected": "hi-IN",
            "error":             str(e),
        }
