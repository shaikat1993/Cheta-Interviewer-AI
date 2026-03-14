import os
from dotenv import load_dotenv

load_dotenv()

# ==============================
# Gemini Credentials
# ==============================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# ==============================
# Interview LLM Model
# ==============================
INTERVIEW_MODEL = "gemini-3.1-flash-lite-preview"

# ==============================
# Temperature Settings
# ==============================
TEMPERATURE_LOW = 0.2
TEMPERATURE_MEDIUM = 0.3

# ==============================
# Safety Checks
# ==============================
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set in the .env file")
