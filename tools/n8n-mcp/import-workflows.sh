#!/bin/bash
set -euo pipefail

N8N_URL="${N8N_URL:-http://localhost:5678}"
N8N_USER="${N8N_USER:-plantcor}"
N8N_PASSWORD="${N8N_PASSWORD:-plantcor}"
WORKFLOW_DIR="$(dirname "$0")/workflows"

echo "Importing n8n workflows from $WORKFLOW_DIR..."

for f in "$WORKFLOW_DIR"/*.json; do
  name=$(basename "$f" .json)
  echo "  Importing: $name..."

  # Extract the workflow JSON and POST to n8n REST API
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$N8N_URL/rest/workflows" \
    -u "$N8N_USER:$N8N_PASSWORD" \
    -H "Content-Type: application/json" \
    -d @"$f")

  if [ "$response" = "200" ] || [ "$response" = "201" ]; then
    echo "    ✓ Imported successfully"
  else
    echo "    ✗ Failed (HTTP $response)"
    # Try to get error details
    curl -s -X POST "$N8N_URL/rest/workflows" \
      -u "$N8N_USER:$N8N_PASSWORD" \
      -H "Content-Type: application/json" \
      -d @"$f" | head -c 200
    echo
  fi
done

echo "Done importing workflows."

# Now activate all imported workflows
echo "Activating workflows..."
curl -s "$N8N_URL/rest/workflows" \
  -u "$N8N_USER:$N8N_PASSWORD" \
  -H "Content-Type: application/json" | \
  python3 -c "
import json, sys, subprocess
data = json.load(sys.stdin)
for w in data.get('data', []):
    wid = w['id']
    name = w['name']
    if not w.get('active'):
        print(f'  Activating: {name} (ID: {wid})')
        subprocess.run([
            'curl', '-s', '-X', 'POST',
            f'$N8N_URL/rest/workflows/{wid}/activate',
            '-u', '$N8N_USER:$N8N_PASSWORD',
            '-H', 'Content-Type: application/json'
        ])
    else:
        print(f'  Already active: {name}')
"

echo "All workflows imported and activated."
