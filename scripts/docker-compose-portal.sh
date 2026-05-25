#!/usr/bin/env bash
set -euo pipefail

# Arch-Systems Portal — Docker Compose wrapper
# Handles BuildKit + correct env file so you don't have to remember the flags.
#
# Usage: ./scripts/docker-compose-portal.sh up -d --build portal
#        ./scripts/docker-compose-portal.sh down
#        ./scripts/docker-compose-portal.sh logs -f portal

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export COMPOSE_BAKE=true

exec docker-compose \
  --env-file "$REPO_ROOT/apps/portal/.env.portal.compose" \
  -f "$REPO_ROOT/docker-compose.portal.yml" \
  "$@"
