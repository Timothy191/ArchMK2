#!/usr/bin/env bash
set -euo pipefail

# Arch-Systems — Production Server Deployment Script
# Usage: ./scripts/deploy-production.sh [--skip-build] [--clean]
#
# Designed for on-premises Linux server (Ubuntu 22.04+ / RHEL 9).
# Differences from deploy-local.sh:
#   - No browser auto-open
#   - No Volta auto-install (assumes pre-provisioned server)
#   - Uses systemd to manage portal process lifecycle
#   - Skips Supabase local stack (assumes external/self-hosted Supabase)
#   - Validates production .env exists before proceeding
#   - Sends deployment notification to n8n webhook (if configured)

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORTAL_DIR="$REPO_ROOT/apps/portal"
PORT="${PORT:-3000}"
DEPLOY_LOG="$REPO_ROOT/deploy-production.log"
ENV_FILE="$PORTAL_DIR/.env"
SERVICE_NAME="arch-systems"
SKIP_BUILD="${SKIP_BUILD:-false}"
CLEAN_ONLY=false

# Determine Docker Compose command
if docker compose version > /dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  COMPOSE_CMD="docker compose"
fi

# ── Argument parsing ──────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --skip-build) SKIP_BUILD=true ;;
    --clean)      CLEAN_ONLY=true ;;
  esac
done

# ── Helpers ───────────────────────────────────────────────
log() {
  local ts
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  local msg="[$ts] [deploy-prod] $*"
  echo -e "\033[0;32m${msg}\033[0m"
  echo -e "${msg}" >> "$DEPLOY_LOG" 2>/dev/null || true
}
warn() {
  local ts
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  local msg="[$ts] [warn] $*"
  echo -e "\033[0;33m${msg}\033[0m"
  echo -e "${msg}" >> "$DEPLOY_LOG" 2>/dev/null || true
}
error() {
  local ts
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  local msg="[$ts] [error] $*"
  echo -e "\033[0;31m${msg}\033[0m"
  echo -e "${msg}" >> "$DEPLOY_LOG" 2>/dev/null || true
  exit 1
}

# ── Error trap ────────────────────────────────────────────
error_trap() {
  local exit_code="$?"
  local line_number="$1"
  local last_command="$2"
  echo -e "\033[0;31m[FATAL] Deployment failed at line $line_number — $last_command (exit $exit_code)\033[0m"
  echo -e "[FATAL] Deployment failed at line $line_number — $last_command (exit $exit_code)" >> "$DEPLOY_LOG"
}
trap 'error_trap ${LINENO} "$BASH_COMMAND"' ERR

# ── Pre-flight checks ─────────────────────────────────────
preflight() {
  log "Running pre-flight checks..."

  # Require production .env
  if [ ! -f "$ENV_FILE" ]; then
    error "Production .env not found at $ENV_FILE. Copy .env.production.example and fill in values."
  fi

  # Require NEXT_PUBLIC_SUPABASE_URL to be a non-localhost URL
  local SUPA_URL
  SUPA_URL=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' || true)
  if [[ -z "$SUPA_URL" ]]; then
    error "NEXT_PUBLIC_SUPABASE_URL is not set in $ENV_FILE."
  fi

  # Docker running?
  if ! docker info > /dev/null 2>&1; then
    error "Docker daemon is not running. Start it with: sudo systemctl start docker"
  fi

  # Node.js version
  local CURRENT_NODE
  CURRENT_NODE=$(node -v 2>/dev/null | sed 's/v//' || echo "0.0.0")
  local REQ_NODE="20.17.0"
  if [ "$(printf '%s\n' "$REQ_NODE" "$CURRENT_NODE" | sort -V | head -n1)" != "$REQ_NODE" ]; then
    error "Node.js >= $REQ_NODE required. Current: $CURRENT_NODE"
  fi

  # pnpm available?
  if ! command -v pnpm > /dev/null 2>&1; then
    error "pnpm not found. Install: npm install -g pnpm@9.12.0"
  fi

  log "Pre-flight checks passed."
}

# ── Health check ──────────────────────────────────────────
healthcheck() {
  local url="$1"
  local max_attempts="${2:-60}"
  log "Waiting for $url..."
  for i in $(seq 1 $max_attempts); do
    if curl -fs "$url" > /dev/null 2>&1; then
      log "$url is healthy."
      return 0
    fi
    sleep 2
  done
  return 1
}

# ── Stop portal (systemd or PID) ──────────────────────────
stop_portal() {
  if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    log "Stopping $SERVICE_NAME systemd service..."
    sudo systemctl stop "$SERVICE_NAME" || true
  elif [ -f "$REPO_ROOT/.portal.pid" ]; then
    local PID
    PID=$(cat "$REPO_ROOT/.portal.pid" || true)
    if [ -n "$PID" ] && ps -p "$PID" > /dev/null 2>&1; then
      log "Stopping portal (PID: $PID)..."
      kill -SIGTERM "$PID" || true
      sleep 3
      kill -9 "$PID" 2>/dev/null || true
    fi
    rm -f "$REPO_ROOT/.portal.pid"
  fi
}

# ── Clean mode ────────────────────────────────────────────
if [ "$CLEAN_ONLY" = true ]; then
  log "Clean-only mode: stopping all services..."
  stop_portal
  TOOLS_COMPOSE="$REPO_ROOT/docker-compose.tools.yml"
  MONITOR_COMPOSE="$REPO_ROOT/docker-compose.monitoring.yml"
  PROD_COMPOSE="$REPO_ROOT/docker-compose.production.yml"
  [ -f "$TOOLS_COMPOSE" ]   && $COMPOSE_CMD -f "$TOOLS_COMPOSE" down || true
  [ -f "$MONITOR_COMPOSE" ] && $COMPOSE_CMD -f "$MONITOR_COMPOSE" down || true
  [ -f "$PROD_COMPOSE" ]    && $COMPOSE_CMD -f "$PROD_COMPOSE" down || true
  log "All services stopped."
  exit 0
fi

# ── Main deployment ───────────────────────────────────────
log "=== Arch-Systems Production Deployment Starting ==="

preflight

# Stop existing portal before build
stop_portal

# Install / sync dependencies
log "Syncing node_modules..."
cd "$REPO_ROOT"
pnpm install --frozen-lockfile

# Start Docker tools (Redis, n8n, Flowise)
TOOLS_COMPOSE="$REPO_ROOT/docker-compose.tools.yml"
if [ -f "$TOOLS_COMPOSE" ]; then
  log "Starting Docker tools (Redis, n8n, Flowise)..."
  $COMPOSE_CMD -f "$TOOLS_COMPOSE" up -d
fi

# Start monitoring stack (Prometheus, Grafana, cAdvisor)
MONITOR_COMPOSE="$REPO_ROOT/docker-compose.monitoring.yml"
if [ -f "$MONITOR_COMPOSE" ]; then
  log "Starting observability stack..."
  $COMPOSE_CMD -f "$MONITOR_COMPOSE" up -d
fi

# Start production overrides (resource limits, healthchecks)
PROD_COMPOSE="$REPO_ROOT/docker-compose.production.yml"
if [ -f "$PROD_COMPOSE" ]; then
  log "Applying production Docker Compose overrides..."
  $COMPOSE_CMD -f "$TOOLS_COMPOSE" -f "$PROD_COMPOSE" up -d
fi

# Build
if [ "$SKIP_BUILD" = false ]; then
  log "Building portal (Next.js production build)..."
  pnpm turbo build --filter=portal...
  log "Build complete."
fi

# Start portal via systemd (preferred) or background process
if systemctl list-units --type=service 2>/dev/null | grep -q "$SERVICE_NAME"; then
  log "Starting portal via systemd ($SERVICE_NAME.service)..."
  sudo systemctl start "$SERVICE_NAME"
  sudo systemctl enable "$SERVICE_NAME"
else
  log "systemd service not found — starting portal as background process..."
  cd "$PORTAL_DIR"
  NODE_ENV=production PORT=$PORT pnpm start >> "$REPO_ROOT/portal.log" 2>&1 &
  echo $! > "$REPO_ROOT/.portal.pid"
  log "Portal started (PID: $(cat "$REPO_ROOT/.portal.pid"))."
fi

# Health check portal
if ! healthcheck "http://localhost:$PORT" 60; then
  error "Portal did not become healthy. Check: tail -f $REPO_ROOT/portal.log"
fi

# Notify n8n (optional — set DEPLOY_WEBHOOK_URL in .env)
WEBHOOK_URL=$(grep -E '^DEPLOY_WEBHOOK_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' || true)
if [ -n "$WEBHOOK_URL" ]; then
  log "Sending deployment notification to n8n..."
  curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"event\":\"deploy\",\"status\":\"success\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"port\":$PORT}" \
    > /dev/null 2>&1 || warn "Webhook notification failed (non-fatal)."
fi

log "=== Production deployment complete ==="
log "Portal: http://localhost:$PORT"
log "Grafana: http://localhost:9091"
log "n8n: http://localhost:5678"
log "Logs: tail -f $REPO_ROOT/portal.log"
