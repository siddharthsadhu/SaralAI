"""
routers/speech.py — POST /api/speech/transcribe
-------------------------------------------------
Accepts an audio file upload, transcribes it with Sarvam AI Saaras v3,
and returns the text transcript + auto-detected language code.

Sarvam AI migration:
  - Removed `language` Form field — Saaras v3 auto-detects the language
    from speech; the caller no longer needs to specify it.
  - `language_detected` in the response is now a BCP-47 code (e.g. "hi-IN")
    returned directly by Saaras. The frontend should store this and use it
    for the subsequent /api/query call and eventual /api/tts/speak call.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from models.response_models import TranscriptionResponse
from services.stt_service import transcribe_audio

router = APIRouter(prefix="/api/speech", tags=["Speech"])


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    audio: UploadFile = File(..., description="Audio file (WebM, WAV, OGG, MP3)"),
) -> TranscriptionResponse:
    """
    Transcribe an audio file to text using Sarvam AI Saaras v3.

    Language is AUTO-DETECTED — do not pass a language parameter.
    The response includes `language_detected` (BCP-47 code, e.g. "hi-IN")
    which the frontend must store and pass to /api/query as the target language.

    The frontend sends the audio as multipart/form-data because binary files
    cannot be sent as JSON.

    Supported formats: WebM/Opus (from browser MediaRecorder), WAV, MP3
    """
    # Validate file size (max 10MB)
    MAX_SIZE = 10 * 1024 * 1024  # 10MB in bytes
    audio_bytes = await audio.read()

    if len(audio_bytes) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="Audio file too large. Max 10MB.")

    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file received.")

    # Detect audio format from content type (for logging — Saaras handles format internally)
    content_type = audio.content_type or ""
    filename = audio.filename or ""
    if "wav" in content_type or filename.endswith(".wav"):
        encoding = "LINEAR16"
    elif "mp3" in content_type:
        encoding = "MP3"
    elif "ogg" in content_type:
        encoding = "OGG_OPUS"
    else:
        encoding = "WEBM_OPUS"   # Default (what browsers send via MediaRecorder)

    try:
        result = await transcribe_audio(
            audio_bytes=audio_bytes,
            audio_encoding=encoding,   # Passed for logging; Saaras auto-detects format
        )

        if result.get("error") or not result.get("transcript"):
            raise HTTPException(
                status_code=422,
                detail="Could not understand the audio. Please speak clearly and try again."
            )

        return TranscriptionResponse(
            transcript=result["transcript"],
            confidence=result["confidence"],
            language_detected=result["language_detected"],  # BCP-47 e.g. "hi-IN"
        )

    except HTTPException:
        raise   # Re-raise HTTP exceptions as-is
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Speech transcription failed: {str(e)}"
        )
