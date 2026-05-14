#!/usr/bin/env bash
set -eo pipefail

# Plantcor OS — Fresh Start / Cleanup Script
# This script stops all containers, kills frontend processes, and clears common ports.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SUPABASE_DIR="$REPO_ROOT/packages/supabase"
TOOLS_COMPOSE="$REPO_ROOT/docker-compose.tools.yml"

log() { echo "[cleanup] $*"; }

# 1. Stop Next.js Frontend(s)
log "Stopping Next.js applications..."
if [ -f "$REPO_ROOT/.frontend.pid" ]; then
    PID=$(cat "$REPO_ROOT/.frontend.pid")
    if ps -p "$PID" > /dev/null; then
        log "Killing process $PID (.frontend.pid)"
        kill "$PID" || true
    fi
    rm -f "$REPO_ROOT/.frontend.pid"
fi

# Kill anything listening on core ports just in case
PORTS=(3000 3001 3002)
for PORT in "${PORTS[@]}"; do
    PID=$(lsof -t -i:"$PORT" || true)
    if [ -n "$PID" ]; then
        log "Clearing port $PORT (PID: $PID)"
        kill -9 "$PID" || true
    fi
done

# 2. Stop Supabase
log "Stopping Supabase containers..."
cd "$SUPABASE_DIR"
if command -v pnpm > /dev/null 2>&1; then
    pnpm exec supabase stop || log "Supabase already stopped or CLI not found."
else
    npx supabase stop || log "Supabase already stopped."
fi

# 3. Stop Docker Tools (n8n, flowise)
if [ -f "$TOOLS_COMPOSE" ]; then
    log "Stopping Docker tools (n8n, flowise)..."
    if docker compose version > /dev/null 2>&1; then
        docker compose -f "$TOOLS_COMPOSE" down || true
    elif command -v docker-compose > /dev/null 2>&1; then
        docker-compose -f "$TOOLS_COMPOSE" down || true
    else
        log "Compose not found, attempting to stop containers by name..."
        docker stop plantcor-n8n plantcor-flowise || true
        docker rm plantcor-n8n plantcor-flowise || true
    fi
fi

# 4. Final Port Sweep
log "Final check for stale processes..."
STALE_PORTS=(54321 5678 8083) # Supabase API, n8n, Edge Runtime
for PORT in "${STALE_PORTS[@]}"; do
    PID=$(lsof -t -i:"$PORT" || true)
    if [ -n "$PID" ]; then
        log "Clearing stale port $PORT (PID: $PID)"
        kill -9 "$PID" || true
    fi
done

log "Cleanup complete. You have a fresh start."
log "To restart everything, run: ./scripts/deploy-local.sh"
