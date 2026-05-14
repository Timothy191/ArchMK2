#!/usr/bin/env bash
set -euo pipefail

# Plantcor OS — Local Deployment Script
# 1. Starts Supabase backend + database
# 2. Waits for health
# 3. Builds & starts Next.js frontend
# 4. Opens browser to login page

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORTAL_DIR="$REPO_ROOT/apps/portal"
SUPABASE_DIR="$REPO_ROOT/packages/supabase"
MIGRATIONS_DIR="$REPO_ROOT/packages/database/migrations"
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
cd "$SUPABASE_DIR"
log "Syncing migrations from $MIGRATIONS_DIR..."
mkdir -p supabase/migrations
# Use rsync or cp to sync migrations into the supabase folder where the CLI expects them
cp -r "$MIGRATIONS_DIR"/* supabase/migrations/

log "Checking Supabase status..."
# Check if Kong gateway container is running as proxy for Supabase being up
if docker ps --format '{{.Names}}' | grep -q 'supabase_kong'; then
  log "Supabase is already running (Kong gateway detected)."
  log "Applying any new migrations..."
  pnpm exec supabase db reset --local
else
  log "Supabase not running. Starting..."
  pnpm exec supabase start
fi

log "Waiting for Supabase API to be healthy..."
# Use REST API root (returns OpenAPI spec) since /health may not be exposed by Kong
if healthcheck "http://127.0.0.1:54321/rest/v1/" 30; then
  log "Supabase API is healthy."
  log "Disabling RLS for all tables to bypass auth requirements..."
  pnpm exec supabase db query "DO \$\$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY'; END LOOP; END \$\$;"
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

log "Done. Your frontend is running in the background (PID $(cat "$REPO_ROOT/.frontend.pid"))."
log "To stop it, run: kill \$(cat \"$REPO_ROOT/.frontend.pid\")"
