#!/bin/bash
sleep 2
clear
echo -e "\033[0;35m╔════════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[0;35m║        🎉 ARCH-SYSTEMS DEPLOYMENT COMPLETE 🎉                   ║\033[0m"
echo -e "\033[0;35m╚════════════════════════════════════════════════════════════════╝\033[0m"
echo ""
echo -e "\033[1m📊 Deployment Results Summary\033[0m"
echo "────────────────────────────────────────────────────────────────"
echo ""

# Check each service and show status
if curl -fs http://localhost:3000 > /dev/null 2>&1; then
  echo -e "  ✅ \033[1mPortal:\033[0m       http://localhost:3000"
  echo -e "  ✅ \033[1mLogin Page:\033[0m   http://localhost:3000/login"
else
  echo -e "  ❌ \033[1mPortal:\033[0m       FAILED"
fi

if curl -fs http://127.0.0.1:54321/rest/v1/ > /dev/null 2>&1; then
  echo -e "  ✅ \033[1mSupabase:\033[0m     http://localhost:54321"
else
  echo -e "  ⚪ \033[1mSupabase:\033[0m     Not running"
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q plantcor-n8n; then
  echo -e "  ✅ \033[1mn8n:\033[0m          http://localhost:5678 (user: plantcor)"
else
  echo -e "  ⚪ \033[1mn8n:\033[0m          Not running"
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q plantcor-flowise; then
  echo -e "  ✅ \033[1mFlowise:\033[0m      http://localhost:3001 (user: plantcor)"
else
  echo -e "  ⚪ \033[1mFlowise:\033[0m      Not running"
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q plantcor-redis; then
  echo -e "  ✅ \033[1mRedis:\033[0m        Port 6379"
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q plantcor-grafana; then
  echo -e "  ✅ \033[1mGrafana:\033[0m      http://localhost:9091"
else
  echo -e "  ⚪ \033[1mGrafana:\033[0m      Not running"
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q plantcor-prometheus; then
  echo -e "  ✅ \033[1mPrometheus:\033[0m   http://localhost:9092"
else
  echo -e "  ⚪ \033[1mPrometheus:\033[0m   Not running"
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q plantcor-langfuse; then
  echo -e "  ✅ \033[1mLangfuse:\033[0m     http://localhost:3002"
else
  echo -e "  ⚪ \033[1mLangfuse:\033[0m     Not running"
fi

echo ""
echo -e "\033[0;35m────────────────────────────────────────────────────────────────\033[0m"
echo ""
echo -e "\033[1m🔧 Quick Commands:\033[0m"
echo "  Stop:      ./scripts/deploy.sh local --clean"
echo "  Logs:      tail -f deployment-logs/deploy-*.log portal.log"
echo "  Monitor:   docker ps | grep plantcor"
echo ""
echo -e "\033[0;35m────────────────────────────────────────────────────────────────\033[0m"
echo ""
echo -e "\033[1m📁 Log Files:\033[0m"
ls -t deployment-logs/deploy-*.log 2>/dev/null | head -1 | xargs -I {} echo "  {}"
echo "  portal.log"
echo ""
echo -e "\033[0;36m────────────────────────────────────────────────────────────────\033[0m"
echo -e "\033[1m⚠️  SUPABASE SESSION REFRESH REQUIRED\033[0m"
echo -e "\033[0;36m────────────────────────────────────────────────────────────────\033[0m"
echo ""
echo "Supabase was restarted during deployment. Clear browser cache:"
echo "  • Hard refresh: Ctrl+F5 or Cmd+Shift+R"
echo "  • Or open incognito/private window"
echo "  • Or clear cookies for localhost:3000"
echo ""
echo "Without clearing cache, you may see:"
echo -e "  \033[0;31m'Invalid Refresh Token: Refresh Token Not Found'\033[0m"
echo ""
echo -e "\033[0;32m\033[1mPress Enter to close this window...\033[0m"
read
date
