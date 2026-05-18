#!/bin/bash
# Kiro Agent — Full System Startup
set -e

PROJ="/home/timothy/Project/Arch-Mk2"
ENV="${KIRO_ENV:-development}"

echo "╔══════════════════════════════════════════════════╗"
echo "║   Kiro Agent — System Startup                   ║"
echo "║   Environment: $ENV"
echo "╚══════════════════════════════════════════════════╝"

# 1. Verify prerequisites
echo -n "  Node.js: "
node --version
echo -n "  n8n: "
n8n --version 2>/dev/null || echo "not found"

# 2. Start infrastructure services if in development
if [ "$ENV" = "development" ]; then
  echo ""
  echo "━━━ Infrastructure Services ━━━"
  cd "$PROJ"
  # Redis
  if ! docker ps --format '{{.Names}}' | grep -q plantcor-redis; then
    echo "  Starting Redis..."
    docker compose -f docker-compose.tools.yml up -d redis
  else
    echo "  ✓ Redis already running"
  fi
fi

# 3. Start n8n
echo ""
echo "━━━ n8n Engine ━━━"
if pgrep -f "n8n start" > /dev/null 2>&1; then
  echo "  ✓ n8n already running"
else
  echo "  Starting n8n..."
  cd "$PROJ" && scripts/start-n8n.sh
  echo "  ✓ n8n started"
fi

# 4. Start metrics endpoint
echo ""
echo "━━━ Metrics ━━━"
if pgrep -f "executor/metrics.js" > /dev/null 2>&1; then
  echo "  ✓ Prometheus metrics endpoint already running"
else
  echo "  Starting Prometheus metrics endpoint..."
  nohup node "$PROJ/.kiro/executor/metrics.js" > /dev/null 2>&1 &
  echo "  ✓ Metrics endpoint started on port 9464"
fi

# 5. Enable shadow mode if staging
if [ "$ENV" = "staging" ]; then
  echo ""
  echo "━━━ Shadow Mode ━━━"
  node "$PROJ/.kiro/deploy/shadow.js" start
fi

# 6. Update MCP registry
echo ""
echo "━━━ MCP Registry ━━━"
node "$PROJ/.kiro/mcp/index.js" discover 2>/dev/null || echo "  MCP discovery skipped (handled by hook)"

# 7. Verify
echo ""
echo "━━━ System Health ━━━"
echo -n "  n8n: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:5678/healthz 2>/dev/null || echo "down"
echo -n "  Redis: "
docker exec plantcor-redis redis-cli ping 2>/dev/null || echo "down"
echo -n "  Metrics: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:9464/metrics 2>/dev/null || echo "down"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  System ready | Environment: $ENV"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
