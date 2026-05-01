#!/usr/bin/env bash
# 
# ResidentIQ  Stop Script
# Gracefully stops the frontend dev server + all Docker services
# 

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_PID_FILE="$ROOT_DIR/.frontend.pid"

step() { echo -e "\n${CYAN}${BOLD}▶ $1${RESET}"; }
ok()   { echo -e "${GREEN}✔  $1${RESET}"; }
warn() { echo -e "${YELLOW}⚠  $1${RESET}"; }

echo -e "\n${BOLD}╔══════════════════════════════════════════╗"
echo -e "║   ResidentIQ  Stopping Services         ║"
echo -e "╚══════════════════════════════════════════╝${RESET}"

# 1. Stop frontend dev server
step "Stopping Next.js frontend dev server…"
if [[ -f "$FRONTEND_PID_FILE" ]]; then
  PID=$(cat "$FRONTEND_PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID"
    ok "Frontend stopped (PID $PID)"
  else
    warn "Frontend process $PID was not running"
  fi
  rm -f "$FRONTEND_PID_FILE"
else
  # Try finding it by port in case PID file was lost
  FOUND=$(lsof -ti :3001 2>/dev/null || true)
  if [[ -n "$FOUND" ]]; then
    kill $FOUND 2>/dev/null && ok "Frontend stopped (found on port 3001)" || warn "Could not kill port 3001 process"
  else
    warn "Frontend was not running"
  fi
fi

# 2. Stop Docker services
step "Stopping Docker services…"
cd "$ROOT_DIR"

if docker compose ps --quiet 2>/dev/null | grep -q .; then
  docker compose down
  ok "All Docker services stopped"
else
  warn "No Docker services were running"
fi

# 3. Clean up log file
if [[ -f "$ROOT_DIR/.frontend.log" ]]; then
  rm -f "$ROOT_DIR/.frontend.log"
  ok "Cleaned up frontend log"
fi

echo -e "\n${GREEN}${BOLD}✔  ResidentIQ fully stopped.${RESET}\n"
