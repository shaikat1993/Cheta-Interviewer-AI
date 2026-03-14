#!/bin/bash
# Cheta Interviewer AI — starts backend and frontend together

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

# Colours
GREEN='\033[0;32m'
TEAL='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

cleanup() {
  echo -e "\n${RED}Shutting down...${NC}"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── Backend ──────────────────────────────────────────────
echo -e "${TEAL}[backend]${NC} Starting FastAPI..."

if [ ! -d "$BACKEND/venv" ]; then
  echo -e "${TEAL}[backend]${NC} Creating virtual environment..."
  python3 -m venv "$BACKEND/venv"
fi

source "$BACKEND/venv/bin/activate"
pip install -r "$BACKEND/requirements.txt" -q

cd "$BACKEND"
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
echo -e "${GREEN}[backend]${NC} Running on http://127.0.0.1:8000 (PID $BACKEND_PID)"

# ── Frontend ─────────────────────────────────────────────
echo -e "${TEAL}[frontend]${NC} Starting Vite..."

cd "$FRONTEND"
if [ ! -d "node_modules" ]; then
  echo -e "${TEAL}[frontend]${NC} Installing npm packages..."
  npm install -q
fi

npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}[frontend]${NC} Running on http://localhost:5173 (PID $FRONTEND_PID)"

echo ""
echo -e "${GREEN}✓ Cheta Interviewer AI is running${NC}"
echo -e "  Frontend → http://localhost:5173"
echo -e "  Backend  → http://127.0.0.1:8000"
echo -e "  Press Ctrl+C to stop both servers"
echo ""

wait
