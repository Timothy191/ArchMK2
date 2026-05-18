#!/bin/bash
# Backend Log Monitor for Arch Systems
# View all backend services in one terminal

REPO_ROOT="/home/timothy/Project/Arch-Mk2"
PORTAL_PID=$(pgrep -f "next-server" | head -1)

echo "=== Arch Systems Backend Monitor ==="
echo "Press Ctrl+C to exit"
echo ""

# Function to get uptime
get_uptime() {
    local pid=$1
    if [ -n "$pid" ]; then
        ps -o etimes= -p "$pid" 2>/dev/null | awk '{print $1 "s"}' || echo "N/A"
    else
        echo "N/A"
    fi
}

while true; do
    clear
    echo "========================================"
    echo "  Arch Systems Backend Monitor"
    echo "  $(date '+%Y-%m-%d %H:%M:%S')"
    echo "========================================"
    echo ""
    
    # Supabase Status
    echo "SUPABASE"
    echo "-------"
    echo -n "  Containers: "
    docker ps --format '{{.Names}}' 2>/dev/null | grep -c supabase || echo "0"
    curl -s -o /dev/null -w "  API: %{http_code}\n" http://127.0.0.1:54321/rest/v1/ 2>/dev/null || echo "  API: down"
    echo ""
    
    # Portal Status
    echo "PORTAL (Next.js)"
    echo "----------------"
    curl -s -o /dev/null -w "  HTTP: %{http_code}\n" http://localhost:3000 2>/dev/null || echo "  HTTP: down"
    echo -n "  Uptime: "
    get_uptime "$PORTAL_PID"
    echo ""
    
    # Portal Logs (last 10 lines)
    echo "PORTAL LOGS"
    echo "-----------"
    if [ -f "$REPO_ROOT/apps/portal/.next/trace" ]; then
        echo "  Tracing available"
    fi
    echo "  Use: tail -f /home/timothy/Project/Arch-Mk2/apps/portal/.next/server.log"
    echo ""
    
    echo "========================================"
    echo "Refresh: 5s | Press Ctrl+C to exit"
    sleep 5
done