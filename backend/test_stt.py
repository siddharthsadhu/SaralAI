import asyncio
import io
import requests
import wave
import struct
import math
from config import settings

async def main():
    sample_rate = 16000
    duration = 1.0
    freq = 440.0
    num_samples = int(duration * sample_rate)
    
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        
        for i in range(num_samples):
            value = int(32767.0 * math.sin(2.0 * math.pi * freq * i / sample_rate))
            wav_file.writeframes(struct.pack('<h', value))
            
    audio_bytes = buf.getvalue()

    headers = {
        "api-subscription-key": settings.sarvam_api_key,
    }
    files = {
        "file": ("audio.wav", io.BytesIO(audio_bytes), "audio/wav"),
    }
    data = {
        "model": "saaras:v3",
        "mode": "transcribe"
    }
    print("Calling Saaras v3 with mode: transcribe...")
    response = requests.post(
        "https://api.sarvam.ai/speech-to-text",
        headers=headers,
        files=files,
        data=data
    )
    print("Status:", response.status_code)
    print("Response text:", response.text)

if __name__ == "__main__":
    asyncio.run(main())
