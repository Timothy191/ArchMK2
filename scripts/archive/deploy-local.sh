#!/usr/bin/env bash
set -euo pipefail

# Arch-Systems — Unified Full-Stack Local Deployment Script
# Features:
# 1. Comprehensive port & process cleanup (Supabase, Next.js, Docker compose tools)
# 2. Complete Supabase stop/restart to prevent Kong API gateway "IP Drift" routing errors
# 3. Retry-resilient automatic signup for default admin credentials: admin@plantcor.os / Yugioh@123#
# 4. Next.js portal production compilation and background server startup
# 5. Native browser opening to auto-login dashboard URL

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORTAL_DIR="$REPO_ROOT/apps/portal"
SUPABASE_DIR="$REPO_ROOT/packages/supabase"
DATABASE_DIR="$REPO_ROOT/packages/database"
PORT="${PORT:-3000}"
LOGIN_URL="http://localhost:$PORT/login"
DEFAULT_EMAIL="admin@plantcor.os"
DEFAULT_PASS="Yugioh@123#"
TOOLS_COMPOSE="$REPO_ROOT/docker-compose.tools.yml"
DEPLOY_LOG="$REPO_ROOT/deploy.log"

# Determine the available Docker Compose command (resilient to docker-compose vs docker compose)
if docker compose version > /dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  COMPOSE_CMD="docker compose" # Fallback guess
fi

# ── Helpers ───────────────────────────────────────────────
log() {
  local msg="\033[0;32m[deploy]\033[0m $*"
  echo -e "$msg"
  echo -e "$msg" >> "$DEPLOY_LOG" 2>/dev/null || true
}
warn() {
  local msg="\033[0;33m[warn]\033[0m $*"
  echo -e "$msg"
  echo -e "$msg" >> "$DEPLOY_LOG" 2>/dev/null || true
}
error() {
  local msg="\033[0;31m[error]\033[0m $*"
  echo -e "$msg"
  echo -e "$msg" >> "$DEPLOY_LOG" 2>/dev/null || true
  exit 1
}

# ── Error Diagnostics Trap ───────────────────────────────
error_trap() {
  local exit_code="$?"
  local line_number="$1"
  local last_command="$2"
  
  {
    echo -e "\n\033[0;31m┌────────────────────────────────────────────────────────────┐\033[0m"
    echo -e "\033[0;31m│           CRITICAL DEPLOYMENT FAILURE DIAGNOSTIC            │\033[0m"
    echo -e "\033[0;31m├────────────────────────────────────────────────────────────┤\033[0m"
    echo -e "\033[0;31m│\033[0m \033[1;33mFailure Detail:\033[0m Command returned exit status $exit_code"
    echo -e "\033[0;31m│\033[0m \033[1;33mLine Number:\033[0m    Line $line_number in scripts/deploy-local.sh"
    echo -e "\033[0;31m│\033[0m \033[1;33mFailed Command:\033[0m \033[0;36m$last_command\033[0m"
    echo -e "\033[0;31m├────────────────────────────────────────────────────────────┤\033[0m"
    echo -e "\033[0;31m│                    DEBUGGING RECOMMENDATIONS               │\033[0m"
    echo -e "\033[0;31m├────────────────────────────────────────────────────────────┤\033[0m"
    
    # Contextual recommendations based on the failed command
    if [[ "$last_command" == *"supabase"* ]]; then
      echo -e "\033[0;31m│\033[0m Supabase database operation failed. Try checking Docker:"
      echo -e "\033[0;31m│\033[0m   -> Run: \033[0;32mdocker ps\033[0m to check if Docker is running properly."
      echo -e "\033[0;31m│\033[0m   -> Run: \033[0;32mpnpx supabase status\033[0m for container logs."
    elif [[ "$last_command" == *"pnpm turbo"* ]] || [[ "$last_command" == *"build"* ]]; then
      echo -e "\033[0;31m│\033[0m Portal compilation failed. Check for TypeScript or ESLint errors:"
      echo -e "\033[0;31m│\033[0m   -> Run: \033[0;32mpnpm build\033[0m or \033[0;32mpnpm lint\033[0m manually to see the errors."
    elif [[ "$last_command" == *"healthcheck"* ]] && { [[ "$last_command" == *"localhost"* ]] || [[ "$last_command" == *"3000"* ]]; }; then
      echo -e "\033[0;31m│\033[0m Next.js portal did not start correctly. Tailing logs:"
      echo -e "\033[0;31m│\033[0m --------------------------------------------------------"
      if [ -f "$REPO_ROOT/portal.log" ]; then
        tail -n 8 "$REPO_ROOT/portal.log" | sed 's/^/│   /g'
      else
        echo -e "\033[0;31m│\033[0m   [No portal.log found]"
      fi
      echo -e "\033[0;31m│\033[0m --------------------------------------------------------"
    elif [[ "$last_command" == *"test:e2e"* ]]; then
      echo -e "\033[0;31m│\033[0m Playwright E2E verification failed."
      echo -e "\033[0;31m│\033[0m   -> View reports: Check \033[0;32mplaywright-report/index.html\033[0m"
    else
      echo -e "\033[0;31m│\033[0m General script failure. Verify environment variables and locks:"
      echo -e "\033[0;31m│\033[0m   -> Check file permissions on scripts/deploy-local.sh"
      echo -e "\033[0;31m│\033[0m   -> Run: \033[0;32mpnpm install\033[0m to ensure dependencies are fully synced."
    fi
    
    echo -e "\033[0;31m└────────────────────────────────────────────────────────────┘\033[0m\n"
  } | tee -a "$DEPLOY_LOG"
}

trap 'error_trap ${LINENO} "$BASH_COMMAND"' ERR

# ── Monitor Terminal Launcher ────────────────────────────
launch_monitor_terminal() {
  if [ "${CI:-false}" = "true" ] || [ ! -t 0 ]; then
    return 0
  fi

  # Initialize dynamic colored log file
  echo -e "\033[1;35m┌────────────────────────────────────────────────────────────┐\033[0m" > "$DEPLOY_LOG"
  echo -e "\033[1;35m│         ARCH-SYSTEMS LOCAL DEPLOYMENT LIVE MONITOR         │\033[0m" >> "$DEPLOY_LOG"
  echo -e "\033[1;35m└────────────────────────────────────────────────────────────┘\033[0m\n" >> "$DEPLOY_LOG"

  # Find available terminal emulators and launch the live HUD in background
  if command -v gnome-terminal > /dev/null 2>&1; then
    gnome-terminal --title="Arch-Systems SysOps HUD" -- bash -c "bash '$REPO_ROOT/scripts/monitor-hud.sh'" > /dev/null 2>&1 &
  elif command -v konsole > /dev/null 2>&1; then
    konsole --title "Arch-Systems SysOps HUD" -e "bash '$REPO_ROOT/scripts/monitor-hud.sh'" > /dev/null 2>&1 &
  elif command -v xfce4-terminal > /dev/null 2>&1; then
    xfce4-terminal --title="Arch-Systems SysOps HUD" -e "bash '$REPO_ROOT/scripts/monitor-hud.sh'" > /dev/null 2>&1 &
  elif command -v alacritty > /dev/null 2>&1; then
    alacritty -t "Arch-Systems SysOps HUD" -e bash "$REPO_ROOT/scripts/monitor-hud.sh" > /dev/null 2>&1 &
  elif command -v kitty > /dev/null 2>&1; then
    kitty --title "Arch-Systems SysOps HUD" bash "$REPO_ROOT/scripts/monitor-hud.sh" > /dev/null 2>&1 &
  elif command -v xterm > /dev/null 2>&1; then
    xterm -title "Arch-Systems SysOps HUD" -e "bash '$REPO_ROOT/scripts/monitor-hud.sh'" > /dev/null 2>&1 &
  else
    warn "No standard desktop terminal emulator found. Monitor HUD output written to $DEPLOY_LOG."
  fi
}

launch_monitor_terminal

# ── Pre-flight Engine & Dependency Verification ───────────
verify_engines() {
  log "Verifying system engines and dependencies..."

  # 1. Check Node.js Version
  local CURRENT_NODE
  CURRENT_NODE=$(node -v | sed 's/v//' || echo "0.0.0")
  local REQ_NODE="20.17.0"
  
  if [ "$(printf '%s\n' "$REQ_NODE" "$CURRENT_NODE" | sort -V | head -n1)" != "$REQ_NODE" ]; then
    warn "Node.js version is currently v$CURRENT_NODE, but >= v$REQ_NODE is required."
    if command -v volta > /dev/null 2>&1; then
      log "Volta detected. Downloading and installing Node.js $REQ_NODE..."
      volta install node@$REQ_NODE
    else
      error "Node.js v$CURRENT_NODE is unsupported. Please install Node.js >= v$REQ_NODE."
    fi
  else
    log "Node.js version is healthy (v$CURRENT_NODE)."
  fi

  # 2. Check pnpm Version
  local CURRENT_PNPM
  CURRENT_PNPM=$(pnpm -v || echo "0.0.0")
  local REQ_PNPM="9.12.0"

  if [ "$CURRENT_PNPM" != "$REQ_PNPM" ]; then
    warn "pnpm version is currently $CURRENT_PNPM, but $REQ_PNPM is required."
    if command -v volta > /dev/null 2>&1; then
      log "Volta detected. Downloading and installing pnpm $REQ_PNPM..."
      volta install pnpm@$REQ_PNPM
    else
      log "Attempting to install correct pnpm version ($REQ_PNPM) globally..."
      if npm install -g pnpm@$REQ_PNPM > /dev/null 2>&1; then
        log "pnpm version successfully updated to $REQ_PNPM."
      else
        warn "Failed to install pnpm $REQ_PNPM globally due to system permission constraints (EACCES)."
        warn "Proceeding with current active version $CURRENT_PNPM. (Recommended: run 'sudo npm install -g pnpm@$REQ_PNPM')"
      fi
    fi
  else
    log "pnpm version is healthy ($CURRENT_PNPM)."
  fi

  # 3. Check and Sync node_modules
  log "Verifying node_modules dependency integrity..."
  if [ ! -d "$REPO_ROOT/node_modules" ] || ! pnpm list > /dev/null 2>&1; then
    warn "node_modules is missing or corrupted. Triggering a clean reinstall..."
    
    log "Purging stale node_modules across the monorepo..."
    rm -rf "$REPO_ROOT/node_modules" \
           "$REPO_ROOT/apps/*/node_modules" \
           "$REPO_ROOT/packages/*/node_modules" \
           2>/dev/null || true
           
    log "Downloading and reinstalling all correct dependencies..."
    pnpm install || {
      error "Dependency installation failed. Please check your internet connection and package configs."
    }
    log "Dependencies successfully reinstalled and synchronized!"
  else
    log "node_modules integrity verified. Reusing active dependencies."
  fi
}

verify_engines


healthcheck() {
  local url="$1"
  local max_attempts="${2:-60}"
  log "Waiting for $url to be healthy..."
  for i in $(seq 1 $max_attempts); do
    if curl -fs "$url" > /dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

cleanup_stale_processes() {
  log "Performing comprehensive port and process cleanup..."
  
  # Kill Next.js background process via saved PID
  if [ -f "$REPO_ROOT/.portal.pid" ]; then
    local PID
    PID=$(cat "$REPO_ROOT/.portal.pid" || true)
    if [ -n "$PID" ] && ps -p "$PID" > /dev/null 2>&1; then
      log "Terminating portal server (PID: $PID)..."
      kill -9 "$PID" || true
    fi
    rm -f "$REPO_ROOT/.portal.pid"
  fi

  # Sweep active ports
  local PORTS=(3000 3001 3002 54321 5678 8083)
  for P in "${PORTS[@]}"; do
    local PIDS
    PIDS=$(ss -tunlp | grep ":$P " | grep -oP 'pid=\K\d+' | sort -u || true)
    if [ -n "$PIDS" ]; then
      log "Clearing processes on port $P (PIDs: $PIDS)..."
      echo "$PIDS" | xargs kill -9 2>/dev/null || true
    fi
  done
}

# ── Cleanup Flag Handler & Health Checks ──────────────────
CLEAN_ONLY=false
if [ "${1:-}" = "--clean" ] || [ "${1:-}" = "--cleanup-only" ]; then
  CLEAN_ONLY=true
fi

DB_ALREADY_RUNNING=false
if [ "$CLEAN_ONLY" = false ]; then
  log "Checking if Supabase database gateway is already healthy..."
  if curl -fs "http://127.0.0.1:54321/rest/v1/" > /dev/null 2>&1; then
    log "Database gateway is already healthy and active! Reusing connection."
    DB_ALREADY_RUNNING=true
  else
    log "Database gateway is stopped or unhealthy. A restart will be performed."
  fi
fi

# ── Stop Stack ────────────────────────────────────────────
cleanup_stale_processes

# Stop Supabase stack completely if requested or if database is unhealthy
if [ "$CLEAN_ONLY" = true ] || [ "$DB_ALREADY_RUNNING" = false ]; then
  log "Stopping local Supabase stack..."
  cd "$DATABASE_DIR"
  if docker ps --format '{{.Names}}' | grep -q 'supabase_'; then
    pnpx supabase stop || true
  fi
else
  log "Skipping Supabase stop (reusing active instance)."
fi

# Stop Docker compose tools (n8n, flowise) if requested
if [ "$CLEAN_ONLY" = true ]; then
  if [ -f "$TOOLS_COMPOSE" ]; then
    log "Stopping Docker tools (n8n, flowise)..."
    if $COMPOSE_CMD version > /dev/null 2>&1; then
      $COMPOSE_CMD -f "$TOOLS_COMPOSE" down || true
    fi
  fi
fi

# Stop Observability stack (Prometheus, Grafana, cAdvisor) if requested
if [ "$CLEAN_ONLY" = true ]; then
  MONITOR_COMPOSE="$REPO_ROOT/docker-compose.monitoring.yml"
  if [ -f "$MONITOR_COMPOSE" ]; then
    log "Stopping Observability Stack (Prometheus, Grafana, cAdvisor)..."
    if $COMPOSE_CMD version > /dev/null 2>&1; then
      $COMPOSE_CMD -f "$MONITOR_COMPOSE" down || true
    fi
  fi
fi

if [ "$CLEAN_ONLY" = true ]; then
  log "Cleanup process complete. Stack is stopped cleanly."
  exit 0
fi

# ── Docker Status Verify ──────────────────────────────────
if ! docker info > /dev/null 2>&1; then
  error "Docker daemon is not running. Please start Docker first."
fi

# ── Supabase Bootstrap ────────────────────────────────────
log "Ensuring database migrations are synchronized..."
mkdir -p "$SUPABASE_DIR/supabase/migrations"
cp -r "$DATABASE_DIR/migrations"/* "$SUPABASE_DIR/supabase/migrations/" 2>/dev/null || true

if [ "$DB_ALREADY_RUNNING" = false ]; then
  log "Starting Supabase local stack..."
  cd "$DATABASE_DIR"
  pnpx supabase start

  log "Verifying local API health..."
  if ! healthcheck "http://127.0.0.1:54321/rest/v1/" 60; then
    error "Supabase Gateway API did not become healthy in time."
  fi
else
  log "Supabase stack is already active. Skipping bootstrap phase."
fi

# ── Docker Compose Tools Bootstrap ────────────────────────
if [ -f "$TOOLS_COMPOSE" ]; then
  log "Verifying status of Docker tools (Redis, n8n, Flowise)..."
  if $COMPOSE_CMD -f "$TOOLS_COMPOSE" ps --format '{{.Status}}' | grep -q 'Up'; then
    log "Docker tools (Redis, n8n, Flowise) are already active! Reusing running instances."
  else
    log "Starting Docker tools (Redis, n8n, Flowise)..."
    $COMPOSE_CMD -f "$TOOLS_COMPOSE" up -d
  fi
fi

# ── Prometheus & Grafana Monitoring Stack Bootstrap ──────
MONITOR_COMPOSE="$REPO_ROOT/docker-compose.monitoring.yml"
if [ -f "$MONITOR_COMPOSE" ]; then
  log "Verifying status of Observability Stack (Prometheus, Grafana, cAdvisor)..."
  if $COMPOSE_CMD -f "$MONITOR_COMPOSE" ps --format '{{.Status}}' | grep -q 'Up'; then
    log "Observability Stack (Prometheus, Grafana, cAdvisor) is already active! Reusing running instances."
  else
    log "Starting Observability Stack (Prometheus, Grafana, cAdvisor)..."
    $COMPOSE_CMD -f "$MONITOR_COMPOSE" up -d
  fi
fi


# ── Resilient Admin Registration ──────────────────────────
log "Registering default admin user: $DEFAULT_EMAIL..."
max_signup_attempts=5
signup_success=false

for attempt in $(seq 1 $max_signup_attempts); do
  log "Registration attempt $attempt/$max_signup_attempts..."
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://127.0.0.1:54321/auth/v1/signup" \
    -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$DEFAULT_EMAIL\",
      \"password\": \"$DEFAULT_PASS\",
      \"data\": {
        \"role\": \"admin\",
        \"full_name\": \"System Administrator\"
      }
    }" || echo "failed")

  if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "201" ]; then
    log "Admin credentials successfully registered in Supabase Auth."
    signup_success=true
    break
  elif [ "$RESPONSE" = "422" ]; then
    log "Admin user already exists in Supabase. Skipping registration."
    signup_success=true
    break
  else
    warn "Registration returned response: $RESPONSE. Retrying in 4 seconds..."
    sleep 4
  fi
done

if [ "$signup_success" = false ]; then
  warn "Automatic admin user registration timed out, but proceeding with startup."
fi

# ── Portal Build Phase ────────────────────────────────────
cd "$REPO_ROOT"
log "Compiling packages and portal Next.js application..."
pnpm turbo build --filter=portal...

# ── Launch Portal Server ──────────────────────────────────
log "Starting portal Next.js production server on port $PORT..."
cd "$PORTAL_DIR"
PORT=$PORT pnpm start > "$REPO_ROOT/portal.log" 2>&1 &
echo $! > "$REPO_ROOT/.portal.pid"

if ! healthcheck "http://localhost:$PORT" 60; then
  error "Portal Next.js server did not become healthy in time. Review $REPO_ROOT/portal.log."
fi

# ── E2E Verification Phase ────────────────────────────────
cd "$REPO_ROOT"
log "Running Playwright E2E test suite to verify local deployment..."
if pnpm test:e2e; then
  log "E2E Test Suite passed 100%! Auto-opening browser..."
else
  warn "E2E Test Suite failed! Proceeding to open the browser for manual inspection."
fi

# ── Browser Redirection ───────────────────────────────────
INTRO_URL="http://localhost:$PORT"
log "Opening browser to intro page: $INTRO_URL"

if command -v google-chrome > /dev/null 2>&1; then
  google-chrome --new-window "$INTRO_URL" > /dev/null 2>&1 &
elif command -v xdg-open > /dev/null 2>&1; then
  xdg-open "$INTRO_URL" > /dev/null 2>&1 &
elif command -v open > /dev/null 2>&1; then
  open "$INTRO_URL"
else
  log "Please open $INTRO_URL in your browser manually."
fi

log "Local deployment completed successfully!"
log "Portal PID: $(cat "$REPO_ROOT/.portal.pid")"
log "Logs: tail -f $REPO_ROOT/portal.log"
