"""
routers/tts.py — POST /api/tts/speak
--------------------------------------
Converts text to WAV speech using Sarvam AI Bulbul v3.
Returns the WAV audio as a binary stream.

⚠️  ON-DEMAND ONLY — This endpoint is NEVER called automatically.
    It is only invoked when the user explicitly taps the "🔊 Listen" button.
    This conserves Bulbul v3 API credits — users who only need to read
    the text answer don't consume TTS quota.

Sarvam AI migration:
  - Google Cloud TTS (MP3 Wavenet) → Sarvam Bulbul v3 (WAV)
  - voice_gender removed — Bulbul uses a per-language speaker name
  - audio/mpeg → audio/wav (WAV is what Bulbul returns natively)
  - language now accepts BCP-47 codes (hi-IN, ta-IN, etc.) — the same
    codes returned by Saaras v3 in /api/speech/transcribe
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import io

from models.request_models import TTSRequest
from services.tts_service import text_to_speech

router = APIRouter(prefix="/api/tts", tags=["TTS"])


@router.post("/speak")
async def speak(request: TTSRequest):
    """
    Convert text to speech using Sarvam AI Bulbul v3.

    ⚠️  Call this endpoint ONLY when the user taps Listen.
        Never call it automatically on page load or query completion.

    Returns a WAV audio stream. The frontend plays this with an <audio> element
    or the Web Audio API. Format changed from MP3 (Google) to WAV (Bulbul v3).

    Request body:
        text:     The translated text to speak (from /api/query response)
        language: BCP-47 code matching what Saaras returned (e.g. "hi-IN")
                  The service will automatically select the right Bulbul speaker.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    try:
        # text_to_speech() internally calls clean_text_for_tts() and handles truncation
        audio_bytes = await text_to_speech(
            text=request.text,
            language=request.language,   # BCP-47 code (or short code — both accepted)
        )

        # Stream WAV bytes back to frontend
        # WAV is Bulbul v3's native format (no re-encoding needed)
        return StreamingResponse(
            content=io.BytesIO(audio_bytes),
            media_type="audio/wav",
            headers={
                "Content-Disposition": "inline; filename=explanation.wav",
                "Cache-Control":       "no-cache",
            }
        )

    except ValueError as e:
        # API key issues, quota errors — user-facing message
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Text-to-speech failed: {str(e)}"
        )
