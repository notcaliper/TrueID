#!/bin/bash

# DBIS Services Startup Script
# This script starts both the backend and frontend services for testing

echo "Starting DBIS services..."

# Set environment variables
export PORT=3000
export REACT_APP_API_URL=http://localhost:3000/api

# Function to check if a port is in use
port_in_use() {
  lsof -i:"$1" >/dev/null 2>&1
  return $?
}

# Kill any processes using our ports
echo "Checking for existing processes on ports 3000 and 3003..."
if port_in_use 3000; then
  echo "Killing process on port 3000"
  kill $(lsof -t -i:3000) 2>/dev/null || true
fi

if port_in_use 3003; then
  echo "Killing process on port 3003"
  kill $(lsof -t -i:3003) 2>/dev/null || true
fi

# Start backend server in the background
echo "Starting backend server on port 3000..."
cd "$(dirname "$0")/backend"
npm install &>/dev/null & # Install dependencies in the background
npm start &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Check if backend is running
if ! curl -s http://localhost:3000/health >/dev/null; then
  echo "Backend failed to start. Check logs for details."
  exit 1
fi

# Start frontend in the background
echo "Starting frontend on port 3003..."
cd "$(dirname "$0")/government-portal"
npm install &>/dev/null & # Install dependencies in the background
npm start -- --port 3003 &
FRONTEND_PID=$!

echo "Services are starting..."
echo "Backend running on http://localhost:3000"
echo "Frontend running on http://localhost:3003"
echo "Debug interface available at http://localhost:3003/debug"

# Run the integration test
echo "\nRunning integration tests..."
sleep 10 # Give services time to fully initialize
source "$(dirname "$0")/venv/bin/activate"
python "$(dirname "$0")/test_api_integration.py"

echo "\nPress Ctrl+C to stop all services"

# Wait for user to press Ctrl+C
trap "echo '\nStopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" INT
wait
