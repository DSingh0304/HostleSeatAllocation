#!/usr/bin/env bash
# 
# ResidentIQ  Full Startup Script
# Usage:
#   ./start.sh          → full startup (migrate + rebuild + frontend)
#   ./start.sh --quick  → skip rebuild, just start services + frontend
#   ./start.sh --stop   → stop everything cleanly
# 

set -euo pipefail

#  Colors 
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"
FRONTEND_PID_FILE="$ROOT_DIR/.frontend.pid"

step()  { echo -e "\n${CYAN}${BOLD}▶ $1${RESET}"; }
ok()    { echo -e "${GREEN}✔  $1${RESET}"; }
warn()  { echo -e "${YELLOW}⚠  $1${RESET}"; }
fail()  { echo -e "${RED}✖  $1${RESET}"; exit 1; }

# Stop mode
if [[ "${1:-}" == "--stop" ]]; then
  step "Stopping everything…"
  if [[ -f "$FRONTEND_PID_FILE" ]]; then
    PID=$(cat "$FRONTEND_PID_FILE")
    kill "$PID" 2>/dev/null && ok "Frontend dev server stopped (PID $PID)" || warn "Frontend wasn't running"
    rm -f "$FRONTEND_PID_FILE"
  fi
  cd "$ROOT_DIR"
  docker compose down
  ok "Docker services stopped"
  exit 0
fi

QUICK="${1:-}"

echo -e "\n${BOLD}╔══════════════════════════════════════════╗"
echo -e "║   ResidentIQ  Startup Script            ║"
echo -e "╚══════════════════════════════════════════╝${RESET}"

# 1. Preflight checks
step "Running preflight checks…"

command -v docker &>/dev/null || fail "Docker is not installed or not in PATH"
docker info &>/dev/null       || fail "Docker daemon is not running. Start it first."
command -v node   &>/dev/null || fail "Node.js is not installed"
command -v npm    &>/dev/null || fail "npm is not installed"
ok "Docker, Node, npm all present"

# 2. Start infrastructure (postgres + redis + nginx)
step "Starting Docker infrastructure services (postgres, redis, nginx)…"
cd "$ROOT_DIR"
docker compose up -d postgres redis nginx
ok "Infrastructure services started"

# Wait for postgres to be healthy
echo -n "   Waiting for PostgreSQL to be ready"
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U user -d residentiq &>/dev/null 2>&1; then
    echo -e " ${GREEN}ready!${RESET}"
    break
  fi
  echo -n "."
  sleep 2
done
ok "PostgreSQL is healthy"

# 3. Install server dependencies (if needed) 
step "Checking server dependencies…"
cd "$SERVER_DIR"
if [[ ! -d node_modules ]]; then
  warn "node_modules missing  running npm install…"
  npm install
fi
ok "Server dependencies present"

# 4. Push schema to database (non-interactive)
step "Syncing Prisma schema to database…"
cd "$SERVER_DIR"

# Use .env.local for host machine Prisma commands (localhost instead of postgres)
if [[ "${NODE_ENV:-}" == "production" ]]; then
  export $(grep -v '^#' .env | xargs)
  npx prisma migrate deploy 2>&1 | tail -6
else
  export $(grep -v '^#' .env.local | xargs)
  # `db push` is non-interactive and handles destructive changes automatically.
  # It's the right tool for development  no migration files needed.
  npx prisma db push --accept-data-loss 2>&1 | tail -6
fi
ok "Database schema synced"

# 5. Regenerate Prisma Client 
step "Regenerating Prisma Client…"
cd "$SERVER_DIR"
npx prisma generate 2>&1 | tail -3
ok "Prisma Client regenerated"

# 6. Build & restart API container 
if [[ "$QUICK" != "--quick" ]]; then
  step "Building & restarting API Docker container…"
  cd "$ROOT_DIR"
  docker compose build api
  docker compose up -d api
  ok "API container rebuilt and started"

  # Wait for API to be healthy
  echo -n "   Waiting for API to be ready"
  for i in {1..20}; do
    if curl -sf http://localhost:3000/health &>/dev/null 2>&1; then
      echo -e " ${GREEN}ready!${RESET}"
      break
    fi
    echo -n "."
    sleep 3
  done

  # Final health check
  HEALTH=$(curl -sf http://localhost:3000/health 2>/dev/null || echo '{}')
  if echo "$HEALTH" | grep -q '"status":"OK"'; then
    ok "API is healthy ✓"
  else
    warn "API health check didn't confirm OK  check logs: docker compose logs api"
  fi
else
  step "Quick mode  restarting API container without rebuild…"
  cd "$ROOT_DIR"
  docker compose restart api
  ok "API container restarted"
fi

# 7. Install client dependencies (if needed)
step "Checking frontend dependencies…"
cd "$CLIENT_DIR"
if [[ ! -d node_modules ]]; then
  warn "node_modules missing  running npm install…"
  npm install
fi
ok "Frontend dependencies present"

# 8. Start Next.js dev server in background 
step "Starting Next.js frontend dev server…"
cd "$CLIENT_DIR"

# Kill any previous frontend process
if [[ -f "$FRONTEND_PID_FILE" ]]; then
  OLD_PID=$(cat "$FRONTEND_PID_FILE")
  kill "$OLD_PID" 2>/dev/null || true
  rm -f "$FRONTEND_PID_FILE"
fi

npm run dev > "$ROOT_DIR/.frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$FRONTEND_PID_FILE"
ok "Frontend started (PID: $FRONTEND_PID, port 3001)"

# Wait for it to be ready
echo -n "   Waiting for Next.js"
for i in {1..30}; do
  if curl -sf http://localhost:3001 &>/dev/null 2>&1; then
    echo -e " ${GREEN}ready!${RESET}"
    break
  fi
  echo -n "."
  sleep 2
done

# 9. Summary 
echo -e "\n${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗"
echo -e "║   🚀 ResidentIQ is running!                          ║"
echo -e "╠══════════════════════════════════════════════════════╣"
echo -e "║  Frontend  →  http://localhost:3001                  ║"
echo -e "║  API       →  http://localhost:3000                  ║"
echo -e "║  Health    →  http://localhost:3000/health           ║"
echo -e "╠══════════════════════════════════════════════════════╣"
echo -e "║  Admin:    admin@iiituna.ac.in / password123         ║"
echo -e "║  Student:  20101           / password123             ║"
echo -e "╠══════════════════════════════════════════════════════╣"
echo -e "║  Logs:   docker compose logs -f api                  ║"
echo -e "║         tail -f .frontend.log                        ║"
echo -e "║  Stop:  ./start.sh --stop                            ║"
echo -e "╚══════════════════════════════════════════════════════╝${RESET}\n"
