#!/bin/bash
# Conduit Start Script

# Configuration
BACKEND_PORT=6969
FRONTEND_PORT=6968
NEXT_PUBLIC_API_URL="http://127.0.0.1:$BACKEND_PORT"

# Secrets — injected at install time, never stored in source code
export CONDUIT_SECRET_KEY="e69f26a5f0a5025c80db6d27912ec656"

# Function to stop everything on exit
cleanup() {
    echo "Stopping Conduit..."
    kill $BACKEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

echo "Starting Backend on port $BACKEND_PORT..."
java -Dserver.port=$BACKEND_PORT -jar /home/ved/Documents/ved/Conduit/dist/backend/conduit-backend.jar &
BACKEND_PID=$!

echo "Starting Frontend on port $FRONTEND_PORT..."
cd /home/ved/Documents/ved/Conduit/dist/frontend
export NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
export PORT=$FRONTEND_PORT
node server.js &
FRONTEND_PID=$!

wait $BACKEND_PID $FRONTEND_PID
