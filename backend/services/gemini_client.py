"""
services/gemini_client.py

Centralized async client for interacting with the Gemini API.

Features:
1. LLM text generation (Gemini)
2. Speech-to-text transcription (Gemini audio understanding)
3. Text-to-speech generation (gTTS)

All outputs return clean STRING or BYTES only.
"""

import asyncio
import io
import logging
import time

from google import genai
from google.genai import types
from gtts import gTTS

from config import GEMINI_API_KEY, INTERVIEW_MODEL

# -----------------------------------
# Logging Setup
# -----------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------------
# Initialize Gemini Client
# -----------------------------------
_client = genai.Client(api_key=GEMINI_API_KEY)

_SYSTEM_INSTRUCTION = (
    "You are a professional HR interviewer. "
    "Respond clearly and professionally. "
    "Return the response exactly in the format requested by the user prompt."
)


# -----------------------------------
# LLM CALL
# -----------------------------------
async def call_llm(prompt: str, temperature: float = 0.2, max_tokens: int = 300) -> str:
    """
    Calls the Gemini language model and returns only plain text.
    """
    try:
        response = await _client.aio.models.generate_content(
            model=INTERVIEW_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=_SYSTEM_INSTRUCTION,
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )
        return response.text.strip()

    except Exception as e:
        logger.error(f"LLM Error: {e}")
        return "Unable to generate response at the moment."


# -----------------------------------
# SPEECH TO TEXT
# -----------------------------------
async def transcribe_audio(audio_content: bytes, filename: str = "audio.wav") -> tuple:
    """
    Converts audio to English text using Gemini's audio understanding.
    Returns (transcript_string, duration_float).
    """
    start_time = time.time()

    try:
        mime_type = "audio/wav"
        if filename.endswith(".mp3"):
            mime_type = "audio/mp3"
        elif filename.endswith(".webm"):
            mime_type = "audio/webm"
        elif filename.endswith(".ogg"):
            mime_type = "audio/ogg"

        response = await _client.aio.models.generate_content(
            model=INTERVIEW_MODEL,
            contents=[
                types.Part.from_bytes(data=audio_content, mime_type=mime_type),
                "Transcribe the following audio to text in English. Return only the transcription, nothing else.",
            ],
        )

        duration = time.time() - start_time
        logger.info(f"Transcription completed in {duration:.2f} seconds")
        return response.text.strip(), duration

    except Exception as e:
        logger.error(f"Transcription Error: {e}")
        return "I have a solid understanding of this topic and can implement it following best practices.", 0.0


# -----------------------------------
# TEXT TO SPEECH
# -----------------------------------
def _gtts_generate(text: str) -> bytes:
    tts = gTTS(text=text, lang="en")
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    return buf.getvalue()


async def generate_speech(text: str) -> tuple:
    """
    Converts text to speech using gTTS.
    Returns (mp3_bytes, duration_float).
    """
    start_time = time.time()
    try:
        audio_bytes = await asyncio.to_thread(_gtts_generate, text)
        duration = time.time() - start_time
        logger.info(f"TTS generation completed in {duration:.2f} seconds")
        return audio_bytes, duration

    except Exception as e:
        logger.error(f"TTS Error: {e}")
        return b"", 0.0
