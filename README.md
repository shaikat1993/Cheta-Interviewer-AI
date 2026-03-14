# Cheta Interviewer AI

> An AI-powered mock interview platform that reads your resume, understands the job you're applying for, asks you real interview questions out loud, listens to your answers, and gives you a detailed performance report — all powered by Google Gemini.

---

## Architecture

![Architecture](architecture.svg)

---

## Features

- **JD-Driven Questions** — Paste any job description and the system extracts required skills to build a targeted question set
- **Resume Parsing** — Upload PDF or DOCX; the AI cross-references your experience with the JD to tailor difficulty
- **Voice Answers** — Speak your answers; Gemini transcribes audio to text automatically
- **AI Evaluation** — Each answer is scored across four rubrics: Technical Accuracy, Depth, Clarity, and Confidence
- **Text-to-Speech Questions** — Questions are read aloud via gTTS for a realistic interview feel
- **Performance Report** — Radar and bar charts, per-skill breakdowns, strengths, improvements, and PDF export

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI (async) |
| LLM | Google Gemini (`gemini-3.1-flash-lite-preview`) |
| Speech-to-Text | Gemini audio understanding |
| Text-to-Speech | gTTS |
| Charts | Recharts |
| PDF Export | jsPDF |

---

## Project Structure

```
Cheta-Interviewer-AI/
├── backend/
│   ├── app.py                   # FastAPI entry point & all endpoints
│   ├── config.py                # Environment config & model settings
│   ├── models/
│   │   └── interview_state.py   # Session state class
│   ├── services/
│   │   ├── gemini_client.py     # Gemini LLM, STT, TTS wrappers
│   │   ├── jd_service.py        # Job description analysis
│   │   ├── resume_service.py    # Resume parsing
│   │   ├── interview_service.py # Question generation
│   │   ├── evaluation_service.py# Answer scoring
│   │   └── report_service.py    # Final report compilation
│   └── utils/
│       └── document_parser.py   # PDF/DOCX text extraction
├── frontend/
│   └── src/
│       ├── pages/               # Landing, JD, Upload, Interview, Report
│       ├── components/          # QuestionCard, AudioRecorder, ScorePanel
│       └── services/api.ts      # Typed API client
└── start.sh                     # One-command launcher for both servers
```

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+
- A **personal** Google account (Workspace/company accounts have Gemini API quota blocked)

---

## Step 1 — Get Your Free Gemini API Key

The entire AI backbone of this project runs on Google Gemini, and the API is **completely free** to get started.

```
1. Go to → https://aistudio.google.com/app/apikey
2. Sign in with your personal Gmail account
3. Click "Create API key"
4. Copy the key — it looks like: AIzaSy...
```

> **Important:** Use a personal Gmail, not a Google Workspace (company/school) account.
> Workspace accounts have Gemini API quota restricted to zero on the free tier.

Once you have the key, create the environment file:

```bash
# Inside the backend/ folder
touch backend/.env
```

Open `backend/.env` and add:

```
GEMINI_API_KEY=your_api_key_here
```

---

## Step 2 — Set Up the Python Virtual Environment

A virtual environment keeps the project's dependencies isolated from your system Python. **Always do this before running the backend.**

```bash
# Navigate into the backend folder
cd backend

# Create the virtual environment (only needed once)
python3 -m venv venv
```

You'll see a new `venv/` folder appear. Now activate it:

```bash
# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

Your terminal prompt will change to show `(venv)` — that means it's active.

```bash
# Install all backend dependencies
pip install -r requirements.txt
```

This installs FastAPI, Uvicorn, Google Gemini SDK, gTTS, and everything else the backend needs.

> To deactivate the venv later, just run: `deactivate`

---

## Step 3 — Run the Project

Go back to the project root and use the one-command launcher:

```bash
cd ..   # back to project root (where start.sh lives)
bash start.sh
```

That's it. The script will:

```
[backend]  Activate venv → install deps → start FastAPI on http://127.0.0.1:8000
[frontend] Install npm packages (if needed) → start Vite on http://localhost:5173
```

Open your browser and go to:

```
http://localhost:5173
```

Press `Ctrl+C` in the terminal to stop both servers.

---

## Troubleshooting

**Port already in use?**
```bash
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```
Then run `bash start.sh` again.

**Broken venv (old path errors)?**
```bash
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**`ImportError: cannot import name 'genai' from 'google'`?**
Your venv is not activated or `google-genai` wasn't installed. Run:
```bash
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

---

## How It Works

```
You                    Cheta AI
 │                         │
 ├─ Paste Job Description ─► Extracts role + required skills
 │                         │
 ├─ Upload Resume (PDF/DOCX)► Builds your candidate profile
 │                         │
 ├─ Hear question (TTS) ◄──┤ Generates first tailored question
 │                         │
 ├─ Record your answer ────► Gemini transcribes audio → text
 │                         │
 │                    ◄────┤ Scores: Accuracy / Depth / Clarity / Confidence
 │                         │
 ├─ Repeat up to 12 rounds ┤
 │                         │
 └─ View full report ◄─────┤ Radar chart + bar chart + PDF export
```

---

## Use Cases

- **Job Seekers** — Practice role-specific interviews before the real thing
- **Career Coaches** — Use as an assessment tool to track candidate progress
- **Students** — Prepare for technical interviews with realistic AI-generated questions

---

## License

This project is licensed under the [MIT License](LICENSE) — free to use, modify, and distribute.

---

## Author

**Shaikat** — AI Engineer & Enthusiast
