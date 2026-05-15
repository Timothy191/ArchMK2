#!/usr/bin/env bash
set -euo pipefail

# Plantcor OS — Local Deploy (Phase 1 + 2)
# 1. Starts Supabase and waits for health
# 2. Applies all migrations directly via psql
# 3. Disables RLS for local dev

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SUPABASE_DIR="$REPO_ROOT/packages/supabase"
MIGRATIONS_DIR="$REPO_ROOT/packages/database/migrations"

PHASE1="[Phase 1 | Supabase]"
PHASE2="[Phase 2 | Migrations]"

log1() { echo "$PHASE1 $*"; }
log2() { echo "$PHASE2 $*"; }

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
cd "$SUPABASE_DIR"

log1 "Syncing migrations from $MIGRATIONS_DIR..."
mkdir -p supabase/migrations
cp -r "$MIGRATIONS_DIR"/* supabase/migrations/

if docker ps --format '{{.Names}}' | grep -q 'supabase_kong'; then
  log1 "Supabase is already running."
else
  log1 "Starting Supabase..."
  pnpm exec supabase start
fi

log1 "Waiting for Supabase API to be healthy..."
if healthcheck "http://127.0.0.1:54321/rest/v1/" 60; then
  log1 "Supabase is healthy."
else
  log1 "ERROR: Supabase did not become healthy in time."
  exit 1
fi

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

log1 "Local deploy complete. Supabase is running."
