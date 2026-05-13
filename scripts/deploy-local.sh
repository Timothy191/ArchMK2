#!/usr/bin/env bash
set -euo pipefail

# Plantcor OS — Local Deployment Script
# 1. Starts Supabase backend + database
# 2. Waits for health
# 3. Builds & starts Next.js frontend
# 4. Opens browser to login page

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORTAL_DIR="$REPO_ROOT/apps/portal"
DB_DIR="$REPO_ROOT/packages/database"
PORT="${PORT:-3000}"
LOGIN_URL="http://localhost:$PORT/login"

# ── Helpers ───────────────────────────────────────────────
log() { echo "[deploy] $*"; }
healthcheck() {
  local url="$1"
  local max_attempts="${2:-30}"
  for i in $(seq 1 $max_attempts); do
    if curl -fs "$url" > /dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

# ── Docker ──────────────────────────────────────────────────
if ! docker info > /dev/null 2>&1; then
  log "ERROR: Docker daemon is not running. Start Docker first."
  exit 1
fi

# ── Supabase ──────────────────────────────────────────────
cd "$DB_DIR"

log "Checking Supabase status..."
if ! pnpm exec supabase status > /dev/null 2>&1; then
  log "Supabase not running. Starting..."
  pnpm exec supabase start
else
  log "Supabase is already running."
fi

log "Waiting for Supabase API to be healthy..."
if healthcheck "http://127.0.0.1:54321/health" 30; then
  log "Supabase API is healthy."
else
  log "ERROR: Supabase API did not become healthy in time."
  exit 1
fi

# ── Frontend Build ─────────────────────────────────────────
cd "$PORTAL_DIR"
log "Building Next.js frontend..."
pnpm build

# ── Frontend Start ─────────────────────────────────────────
log "Starting Next.js frontend on port $PORT..."
pnpm start &
echo $! > "$REPO_ROOT/.frontend.pid"

log "Waiting for frontend to be ready..."
if healthcheck "http://localhost:$PORT" 30; then
  log "Frontend is up."
else
  log "ERROR: Frontend did not start in time."
  kill "$(cat "$REPO_ROOT/.frontend.pid")" 2>/dev/null || true
  exit 1
fi

# ── Open Browser ───────────────────────────────────────────
log "Opening browser → $LOGIN_URL"
if command -v xdg-open > /dev/null 2>&1; then
  xdg-open "$LOGIN_URL"
elif command -v open > /dev/null 2>&1; then
  open "$LOGIN_URL"
else
  log "No automatic browser opener found. Please open $LOGIN_URL manually."
fi

log "Done. Press Ctrl+C to stop the frontend server."
wait "$(cat "$REPO_ROOT/.frontend.pid")"
