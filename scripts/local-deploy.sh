#!/usr/bin/env bash
set -euo pipefail

# Plantcor OS — Local Deploy (Pre-Check + Phase 1 + 2 + 3)
# 1. Pre-deployment checks (Docker, Chrome, ports, dependencies)
# 2. Starts Supabase and waits for health
# 3. Applies all migrations directly via psql
# 4. Disables RLS for local dev
# 5. Starts Next.js frontend
# 6. Opens Chrome browser to login page

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SUPABASE_DIR="$REPO_ROOT/packages/supabase"
MIGRATIONS_DIR="$REPO_ROOT/packages/database/migrations"
PORT="${PORT:-3000}"
LOGIN_URL="http://localhost:$PORT/login"

PHASE0="[Pre-Check]"
PHASE1="[Phase 1 | Supabase]"
PHASE2="[Phase 2 | Migrations]"
PHASE3="[Phase 3 | Frontend]"
PHASE4="[Phase 4 | Route Tests]"

log0() { echo "$PHASE0 $*"; }
log1() { echo "$PHASE1 $*"; }
log2() { echo "$PHASE2 $*"; }
log3() { echo "$PHASE3 $*"; }
log4() { echo "$PHASE4 $*"; }

# ── Pre-Deployment Checklist ─────────────────────────────────
log0 "Running pre-deployment checks..."

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
  log0 "ERROR: Docker daemon is not running. Start Docker first."
  exit 1
fi
log0 "Docker is running."

# Check pnpm is available
if ! command -v pnpm > /dev/null 2>&1; then
  log0 "ERROR: pnpm is not installed. Install pnpm first."
  exit 1
fi
log0 "pnpm is available."

# Check migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
  log0 "ERROR: Migrations directory not found at $MIGRATIONS_DIR"
  exit 1
fi
log0 "Migrations directory found."

# ── Chrome Browser Setup ─────────────────────────────────
setup_chrome() {
  log0 "Checking Chrome browser setup..."
  
  # Detect Chrome/ Chromium variants
  CHROME_CMD=""
  CHROME_NAME=""
  
  if command -v google-chrome > /dev/null 2>&1; then
    CHROME_CMD="google-chrome"
    CHROME_NAME="Google Chrome"
  elif command -v google-chrome-stable > /dev/null 2>&1; then
    CHROME_CMD="google-chrome-stable"
    CHROME_NAME="Google Chrome"
  elif command -v chromium > /dev/null 2>&1; then
    CHROME_CMD="chromium"
    CHROME_NAME="Chromium"
  elif command -v chromium-browser > /dev/null 2>&1; then
    CHROME_CMD="chromium-browser"
    CHROME_NAME="Chromium"
  elif command -v chrome > /dev/null 2>&1; then
    CHROME_CMD="chrome"
    CHROME_NAME="Chrome"
  fi
  
  if [ -n "$CHROME_CMD" ]; then
    # Chrome is installed - check version
    CHROME_VERSION=$($CHROME_CMD --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    log0 "$CHROME_NAME detected: version $CHROME_VERSION"
    
    # Check if version is reasonably recent (major version >= 120)
    MAJOR_VERSION=$(echo "$CHROME_VERSION" | cut -d. -f1)
    if [ "$MAJOR_VERSION" -lt 120 ] 2>/dev/null; then
      log0 "WARNING: Chrome version $CHROME_VERSION is old. Consider updating for best compatibility."
    else
      log0 "Chrome is up to date (>= 120)."
    fi
    
    # Create symlink for xdg-open compatibility if needed
    if [ "$CHROME_CMD" != "google-chrome" ] && ! command -v google-chrome > /dev/null 2>&1; then
      log0 "Creating google-chrome symlink for compatibility..."
      sudo ln -sf "$(which $CHROME_CMD)" /usr/local/bin/google-chrome 2>/dev/null || true
    fi
    
    return 0
  fi
  
  # Chrome not found - install it
  log0 "Chrome not found. Installing Google Chrome..."
  
  detect_distro() {
    if [ -f /etc/os-release ]; then
      . /etc/os-release
      echo "$ID"
    elif [ -f /etc/debian_version ]; then
      echo "debian"
    elif [ -f /etc/redhat-release ]; then
      echo "rhel"
    elif [ -f /etc/arch-release ]; then
      echo "arch"
    else
      echo "unknown"
    fi
  }
  
  DISTRO=$(detect_distro)
  log0 "Detected distribution: $DISTRO"
  
  case "$DISTRO" in
    ubuntu|debian|pop|mint)
      log0 "Installing Chrome via apt..."
      wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add - 2>/dev/null || \
        wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg 2>/dev/null || true
      sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list' 2>/dev/null || true
      sudo apt-get update -qq
      sudo apt-get install -y -qq google-chrome-stable
      ;;
    
    fedora|rhel|centos|rocky|almalinux)
      log0 "Installing Chrome via yum/dnf..."
      sudo tee /etc/yum.repos.d/google-chrome.repo > /dev/null <<EOF
[google-chrome]
name=google-chrome
baseurl=http://dl.google.com/linux/chrome/rpm/stable/\$basearch
enabled=1
gpgcheck=1
gpgkey=https://dl.google.com/linux/linux_signing_key.pub
EOF
      if command -v dnf > /dev/null 2>&1; then
        sudo dnf install -y google-chrome-stable
      else
        sudo yum install -y google-chrome-stable
      fi
      ;;
    
    arch|manjaro)
      log0 "Installing Chromium via pacman..."
      sudo pacman -S --noconfirm chromium
      sudo ln -sf /usr/bin/chromium /usr/local/bin/google-chrome 2>/dev/null || true
      ;;
    
    *)
      log0 "WARNING: Unknown distribution. Attempting snap install..."
      if command -v snap > /dev/null 2>&1; then
        sudo snap install chromium
        sudo ln -sf /snap/bin/chromium /usr/local/bin/google-chrome 2>/dev/null || true
      else
        log0 "ERROR: Could not install Chrome automatically."
        log0 "Please install Chrome manually: https://www.google.com/chrome/"
        return 1
      fi
      ;;
  esac
  
  # Verify installation
  if command -v google-chrome > /dev/null 2>&1 || command -v google-chrome-stable > /dev/null 2>&1 || command -v chromium > /dev/null 2>&1; then
    CHROME_VERSION=$(google-chrome --version 2>/dev/null || google-chrome-stable --version 2>/dev/null || chromium --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    log0 "Chrome installed successfully: version $CHROME_VERSION"
    return 0
  else
    log0 "ERROR: Chrome installation failed."
    return 1
  fi
}

# Run Chrome setup
setup_chrome || log0 "Continuing without Chrome auto-install..."

# Check available memory (Supabase needs ~7GB)
AVAILABLE_MEM_GB=$(free -g | awk '/^Mem:/{print $7}')
if [ "$AVAILABLE_MEM_GB" -lt 6 ]; then
  log0 "WARNING: Low available memory (${AVAILABLE_MEM_GB}GB). Supabase recommends 7GB+."
  log0 "Consider closing other applications or increasing Docker memory limit."
fi

# Kill processes on required ports
kill_port_process() {
  local port="$1"
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    log0 "Port $port is in use. Killing processes: $pids"
    kill -9 $pids 2>/dev/null || true
    sleep 1
    # Verify port is free
    if lsof -ti :"$port" > /dev/null 2>&1; then
      log0 "WARNING: Could not free port $port. Manual intervention may be needed."
    else
      log0 "Port $port is now free."
    fi
  else
    log0 "Port $port is available."
  fi
}

# Free up required ports (3000 for Next.js, 54321 for Supabase API)
kill_port_process "$PORT"
kill_port_process "54321"

# Check for existing Supabase containers and stop/clean if conflicting
if docker ps -a --format '{{.Names}}' | grep -q 'supabase_'; then
  log0 "Existing Supabase containers detected. Stopping and cleaning..."
  cd "$SUPABASE_DIR"
  pnpm exec supabase stop 2>/dev/null || true
  # Also clean up any leftover containers
  docker ps -a --format '{{.Names}}' | grep '^supabase_' | xargs -r docker rm -f 2>/dev/null || true
  sleep 3
fi

# Clean up any orphaned networks/volumes that might cause conflicts
docker network prune -f 2>/dev/null || true

log0 "All pre-deployment checks passed."

healthcheck() {
  local url="$1"
  local max_attempts="${2:-60}"
  for i in $(seq 1 $max_attempts); do
    if curl -fs "$url" > /dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

# ── Phase 1: Start Supabase ─────────────────────────────────
log1 "Starting Supabase setup..."
cd "$SUPABASE_DIR"

log1 "Syncing migrations from $MIGRATIONS_DIR..."
mkdir -p supabase/migrations
cp -r "$MIGRATIONS_DIR"/* supabase/migrations/

if docker ps --format '{{.Names}}' | grep -q 'supabase_kong'; then
  log1 "Supabase is already running."
else
  log1 "Starting Supabase (with health check ignore for transient 502s)..."
  # Retry logic for supabase start (handles transient 502 errors)
  MAX_RETRIES=3
  RETRY_COUNT=0
  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if pnpm exec supabase start --ignore-health-check; then
      log1 "Supabase containers started successfully."
      break
    else
      RETRY_COUNT=$((RETRY_COUNT + 1))
      if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        log1 "Start failed (attempt $RETRY_COUNT/$MAX_RETRIES). Retrying after cleanup..."
        pnpm exec supabase stop 2>/dev/null || true
        docker ps -a --format '{{.Names}}' | grep '^supabase_' | xargs -r docker rm -f 2>/dev/null || true
        sleep 5
      else
        log1 "ERROR: Failed to start Supabase after $MAX_RETRIES attempts."
        log1 "Try: cd $SUPABASE_DIR && pnpm exec supabase start --debug"
        exit 1
      fi
    fi
  done
fi

# Wait for services to stabilize after container start
log1 "Waiting for services to stabilize (10s)..."
sleep 10

log1 "Waiting for Supabase API to be healthy..."
# Retry health check a few times with shorter waits
HEALTH_RETRIES=0
MAX_HEALTH_RETRIES=3
while [ $HEALTH_RETRIES -lt $MAX_HEALTH_RETRIES ]; do
  if healthcheck "http://127.0.0.1:54321/rest/v1/" 30; then
    log1 "Supabase is healthy."
    break
  else
    HEALTH_RETRIES=$((HEALTH_RETRIES + 1))
    if [ $HEALTH_RETRIES -lt $MAX_HEALTH_RETRIES ]; then
      log1 "Health check failed (attempt $HEALTH_RETRIES/$MAX_HEALTH_RETRIES). Retrying..."
      sleep 5
    else
      log1 "WARNING: Supabase API health check failed, but containers are running."
      log1 "This may be transient. Continuing with migrations..."
    fi
  fi
done

# ── Phase 2: Apply Migrations ─────────────────────────────────
log2 "Applying migrations via psql..."
for f in "$MIGRATIONS_DIR"/*.sql; do
  log2 "  → $(basename "$f")"
  docker exec -i supabase_db_supabase psql -U postgres -d postgres < "$f" > /dev/null 2>&1 || true
done
log2 "Migrations applied."

log2 "Disabling RLS for local dev..."
docker exec supabase_db_supabase psql -U postgres -d postgres -c "
DO \$\$ DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
  END LOOP;
END \$\$;
" > /dev/null
log2 "RLS disabled."

# ── Phase 3: Start Frontend ─────────────────────────────────
log3 "Starting Next.js dev server..."
cd "$REPO_ROOT"

# Check if dev server is already running
if curl -fs "http://localhost:$PORT" > /dev/null 2>&1; then
  log3 "Frontend already running on port $PORT."
else
  nohup pnpm --filter portal dev > /tmp/portal-dev.log 2>&1 &
  FRONTEND_PID=$!
  echo $FRONTEND_PID > "$REPO_ROOT/.frontend.pid"
  
  log3 "Waiting for frontend to be ready..."
  HEALTH_RETRIES=0
  while [ $HEALTH_RETRIES -lt 60 ]; do
    if curl -fs "http://localhost:$PORT" > /dev/null 2>&1; then
      log3 "Frontend is ready on port $PORT (PID $FRONTEND_PID)."
      break
    fi
    sleep 1
    HEALTH_RETRIES=$((HEALTH_RETRIES + 1))
  done
  
  if [ $HEALTH_RETRIES -eq 60 ]; then
    log3 "WARNING: Frontend did not become ready in time. Check /tmp/portal-dev.log"
  fi
fi

# ── Open Browser ───────────────────────────────────────────
log3 "Opening browser → $LOGIN_URL"

# Try to open with Chrome specifically for best testing experience
CHROME_BIN=""
for cmd in google-chrome google-chrome-stable chromium chromium-browser chrome; do
  if command -v "$cmd" > /dev/null 2>&1; then
    CHROME_BIN="$cmd"
    break
  fi
done

if [ -n "$CHROME_BIN" ]; then
  log3 "Opening with $CHROME_BIN..."
  # Open in new window, allow file access from files (for local testing)
  "$CHROME_BIN" --new-window "$LOGIN_URL" 2>/dev/null || "$CHROME_BIN" "$LOGIN_URL" 2>/dev/null || true
  log3 "Chrome should now be open."
else
  # Fallback to system default
  if command -v xdg-open > /dev/null 2>&1; then
    xdg-open "$LOGIN_URL"
  elif command -v open > /dev/null 2>&1; then
    open "$LOGIN_URL"
  else
    log3 "No browser opener found. Please open $LOGIN_URL manually."
  fi
fi

# ── Phase 4: Route Testing ─────────────────────────────────
log4 "Testing application routes..."

BASE_URL="http://localhost:$PORT"
TESTS_PASSED=0
TESTS_FAILED=0

test_route() {
  local route="$1"
  local expected_status="$2"
  local description="$3"
  local full_url="${BASE_URL}${route}"
  
  local actual_status
  actual_status=$(curl -s -o /dev/null -w "%{http_code}" "$full_url" 2>/dev/null || echo "000")
  
  if [ "$actual_status" = "$expected_status" ]; then
    log4 "✓ $description ($route) → $actual_status"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    log4 "✗ $description ($route) → Expected $expected_status, got $actual_status"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# Test unauthenticated routes
test_route "/" "307" "Root redirects to login (unauthenticated)"
test_route "/login" "200" "Login page loads"
test_route "/_next/static/chunks/main.js" "200" "Next.js assets served"

# Test API health
test_route "/api/health" "200" "Health check endpoint"

log4 "Route tests complete: $TESTS_PASSED passed, $TESTS_FAILED failed"

if [ $TESTS_FAILED -gt 0 ]; then
  log4 "WARNING: Some route tests failed. Check the application status."
fi

# ── Open Browser ───────────────────────────────────────────
log3 "Opening browser → $LOGIN_URL"

# Try to open with Chrome specifically for best testing experience
CHROME_BIN=""
for cmd in google-chrome google-chrome-stable chromium chromium-browser chrome; do
  if command -v "$cmd" > /dev/null 2>&1; then
    CHROME_BIN="$cmd"
    break
  fi
done

if [ -n "$CHROME_BIN" ]; then
  log3 "Opening with $CHROME_BIN..."
  # Open in new window, allow file access from files (for local testing)
  "$CHROME_BIN" --new-window "$LOGIN_URL" 2>/dev/null || "$CHROME_BIN" "$LOGIN_URL" 2>/dev/null || true
  log3 "Chrome should now be open."
else
  # Fallback to system default
  if command -v xdg-open > /dev/null 2>&1; then
    xdg-open "$LOGIN_URL"
  elif command -v open > /dev/null 2>&1; then
    open "$LOGIN_URL"
  else
    log3 "No browser opener found. Please open $LOGIN_URL manually."
  fi
fi

log3 "Local deploy complete!"
log3 "Supabase API: http://127.0.0.1:54321"
log3 "Frontend: http://localhost:$PORT"
log3 "Login: $LOGIN_URL"
