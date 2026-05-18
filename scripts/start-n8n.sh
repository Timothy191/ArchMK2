#!/bin/bash
# Start n8n workflow engine for Agentic AI patterns
# Uses globally installed n8n (v2.20.9) with SQLite persistence

set -euo pipefail

N8N_PORT="${N8N_PORT:-5678}"
N8N_EMAIL="${N8N_EMAIL:-timothyoniel558@gmail.com}"
N8N_PASSWORD="${N8N_PASSWORD:-Yugioh@123#}"
N8N_ENCRYPTION_KEY="${N8N_ENCRYPTION_KEY:-mPrxykirb9y+23+njG2uC3DkumzpYvKn}"
LOG_FILE="${LOG_FILE:-/tmp/n8n-server.log}"

# Check if n8n is already running
if curl -s -o /dev/null -w "" "http://localhost:$N8N_PORT/healthz" 2>/dev/null; then
  echo "n8n is already running on port $N8N_PORT"
  exit 0
fi

echo "Starting n8n on port $N8N_PORT..."
N8N_PORT="$N8N_PORT" \
N8N_ENCRYPTION_KEY="$N8N_ENCRYPTION_KEY" \
N8N_BASIC_AUTH_ACTIVE=true \
N8N_BASIC_AUTH_USER="$N8N_EMAIL" \
N8N_BASIC_AUTH_PASSWORD="$N8N_PASSWORD" \
nohup n8n start > "$LOG_FILE" 2>&1 &

N8N_PID=$!
echo "n8n started (PID: $N8N_PID)"

# Wait for ready
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "" "http://localhost:$N8N_PORT/healthz" 2>/dev/null; then
    echo "n8n ready after ${i}s"
    break
  fi
  sleep 1
done

echo "n8n web UI: http://localhost:$N8N_PORT"
echo "Login: $N8N_EMAIL / $N8N_PASSWORD"
