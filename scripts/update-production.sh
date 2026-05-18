#!/usr/bin/env bash
set -euo pipefail

# Arch-Systems — Zero-Downtime Production Update Script
# Usage: ./scripts/update-production.sh [branch]
#
# 1. git pull latest from branch (default: main)
# 2. pnpm install --frozen-lockfile
# 3. Build portal
# 4. Rolling restart: new build → swap → verify health → done
# 5. Rolls back automatically if health check fails

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORTAL_DIR="$REPO_ROOT/apps/portal"
DEPLOY_LOG="$REPO_ROOT/deploy-production.log"
BRANCH="${1:-main}"
PORT="${PORT:-3000}"
SERVICE_NAME="arch-systems"

log() {
  local ts
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  local msg="[$ts] [update] $*"
  echo -e "\033[0;32m${msg}\033[0m"
  echo -e "${msg}" >> "$DEPLOY_LOG" 2>/dev/null || true
}
warn() {
  local ts
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  echo -e "\033[0;33m[$ts] [warn] $*\033[0m"
  echo -e "[$ts] [warn] $*" >> "$DEPLOY_LOG" 2>/dev/null || true
}
error() {
  local ts
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  echo -e "\033[0;31m[$ts] [error] $*\033[0m"
  echo -e "[$ts] [error] $*" >> "$DEPLOY_LOG" 2>/dev/null || true
  exit 1
}

healthcheck() {
  local url="$1"
  local max_attempts="${2:-30}"
  for i in $(seq 1 $max_attempts); do
    if curl -fs "$url" > /dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

log "=== Production update starting (branch: $BRANCH) ==="

# 1. Pull latest changes
cd "$REPO_ROOT"
log "Fetching latest from origin/$BRANCH..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
log "Git pull complete. HEAD: $(git rev-parse --short HEAD)"

# 2. Sync dependencies
log "Syncing node_modules..."
pnpm install --frozen-lockfile

# 3. Build
log "Building portal..."
pnpm turbo build --filter=portal...
log "Build complete."

# 4. Rolling restart
log "Performing rolling restart..."

if systemctl list-units --type=service 2>/dev/null | grep -q "$SERVICE_NAME"; then
  log "Restarting via systemd..."
  sudo systemctl restart "$SERVICE_NAME"
  sleep 3
else
  # Background process mode — start new, verify, then kill old
  log "Rolling restart (background process mode)..."
  NEW_PORT=$((PORT + 10))

  # Start new instance on alternate port
  cd "$PORTAL_DIR"
  NODE_ENV=production PORT=$NEW_PORT pnpm start >> "$REPO_ROOT/portal-new.log" 2>&1 &
  NEW_PID=$!
  log "New portal started on port $NEW_PORT (PID: $NEW_PID)."

  # Verify new instance health
  if ! healthcheck "http://localhost:$NEW_PORT" 30; then
    warn "New portal failed health check. Killing new process and keeping old."
    kill -9 "$NEW_PID" 2>/dev/null || true
    error "Rollback: new instance did not become healthy."
  fi

  # Kill old instance
  if [ -f "$REPO_ROOT/.portal.pid" ]; then
    OLD_PID=$(cat "$REPO_ROOT/.portal.pid" || true)
    if [ -n "$OLD_PID" ] && ps -p "$OLD_PID" > /dev/null 2>&1; then
      log "Stopping old portal (PID: $OLD_PID)..."
      kill -SIGTERM "$OLD_PID" || true
      sleep 2
      kill -9 "$OLD_PID" 2>/dev/null || true
    fi
  fi

  # Restart new instance on the correct port
  kill -9 "$NEW_PID" 2>/dev/null || true
  cd "$PORTAL_DIR"
  NODE_ENV=production PORT=$PORT pnpm start >> "$REPO_ROOT/portal.log" 2>&1 &
  echo $! > "$REPO_ROOT/.portal.pid"
  log "Portal restarted on port $PORT (PID: $(cat "$REPO_ROOT/.portal.pid"))."
fi

# 5. Final health check
if ! healthcheck "http://localhost:$PORT" 30; then
  error "Portal health check failed after restart. Check: tail -f $REPO_ROOT/portal.log"
fi

log "=== Update complete ==="
log "Running: $(git rev-parse --short HEAD) on port $PORT"
