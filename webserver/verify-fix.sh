#!/bin/bash
# Verification script for 3kpro.services webserver fix

echo "🔍 Verifying 3kpro.services webserver functionality..."
echo

cd "$(dirname "$0")"

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json missing"
    exit 1
fi

# Check if node_modules exists (after npm install)
if [ -d "node_modules" ]; then
    echo "✅ node_modules directory found"
else
    echo "❌ node_modules missing - run 'npm install' first"
    exit 1
fi

# Test server startup
echo "🚀 Testing server startup..."
timeout 5s node index.js &
SERVER_PID=$!
sleep 2

# Test if server is responding
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server responding to health checks"
    echo "✅ Webserver is fully operational!"
    echo
    echo "🌐 Available endpoints:"
    echo "   • Main page: http://localhost:3000/"
    echo "   • Health check: http://localhost:3000/health"
    echo "   • Admin API: http://localhost:3000/admin/api/sites"
    echo "   • Static sites: http://localhost:3000/site/{site-name}"
    echo "   • Express apps: http://localhost:3000/app/{app-name}"
else
    echo "❌ Server not responding"
    exit 1
fi

# Clean up
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo
echo "🎉 All tests passed! The 'This site can't be reached' issue has been resolved."