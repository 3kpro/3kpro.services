#!/bin/bash

# Display system environment information
echo "======= SYSTEM INFO ========"
if command -v uname &> /dev/null; then
    uname -a
fi
echo ""

# Display Node.js version
echo "======= NODE VERSION ======="
if command -v node &> /dev/null; then
    node --version
else
    echo "Node.js not found"
fi
echo ""

# Test direct connection to Node.js server
echo "======= TEST LOCAL NODE SERVER ======="
if command -v curl &> /dev/null; then
    echo "Testing http://localhost:3000/health..."
    curl -s http://localhost:3000/health || echo "Failed to connect to local Node server"
else
    echo "curl not found, cannot test connection"
fi
echo ""

# Test Docker host connection
echo "======= TEST DOCKER CONNECTION ======="
if command -v docker &> /dev/null; then
    echo "Docker version:"
    docker --version
    
    echo "Docker containers:"
    docker ps
    
    echo "Testing http://localhost:3001/health..."
    curl -s http://localhost:3001/health || echo "Failed to connect to Docker Node server"
else
    echo "Docker not found"
fi
echo ""

# Test HTTPS connection
echo "======= TEST HTTPS CONNECTION ======="
if command -v curl &> /dev/null; then
    echo "Testing https://localhost/ (insecure)..."
    curl -sk https://localhost/ || echo "Failed to connect to HTTPS endpoint"
else
    echo "curl not found, cannot test connection"
fi
echo ""

# Show process listening on ports
echo "======= PROCESSES ON PORTS ======="
if command -v netstat &> /dev/null; then
    echo "Port 3000:"
    netstat -ano | grep ":3000"
    
    echo "Port 3001:"
    netstat -ano | grep ":3001"
    
    echo "Port 443:"
    netstat -ano | grep ":443"
else
    echo "netstat not found"
fi
