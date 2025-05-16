#!/bin/bash

# DBIS Backend Start Script
# This script starts the DBIS backend server and related services

# Print banner
echo "==============================================="
echo "  DBIS - Decentralized Biometric Identity System"
echo "  Backend Server Startup Script"
echo "==============================================="

# Load environment variables
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
else
  echo "Warning: .env file not found. Using default environment settings."
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed. Please install Node.js to run the backend."
  exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo "Error: npm is not installed. Please install npm to run the backend."
  exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  
  if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies. Please check your internet connection and try again."
    exit 1
  fi
fi

# Check if PostgreSQL is running (if using local PostgreSQL)
if [ "$DB_HOST" = "localhost" ] || [ "$DB_HOST" = "127.0.0.1" ]; then
  echo "Checking PostgreSQL status..."
  if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "Warning: PostgreSQL is not running. Please start PostgreSQL before running the backend."
    echo "You can start PostgreSQL with: sudo service postgresql start"
  else
    echo "PostgreSQL is running."
  fi
fi

# Check if Hardhat node is running (if using local blockchain)
if [ "$BLOCKCHAIN_NETWORK" = "local" ] || [ -z "$BLOCKCHAIN_NETWORK" ]; then
  echo "Checking if Hardhat node is running..."
  
  # Try to connect to the local node
  curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' $LOCAL_RPC_URL > /dev/null
  
  if [ $? -ne 0 ]; then
    echo "Local Hardhat node is not running. Starting Hardhat node in a separate terminal..."
    gnome-terminal -- bash -c "cd $(pwd) && npx hardhat node" || xterm -e "cd $(pwd) && npx hardhat node" || konsole -e "cd $(pwd) && npx hardhat node" || echo "Could not open a terminal window. Please start the Hardhat node manually with 'npx hardhat node'"
    
    # Wait for Hardhat node to start
    echo "Waiting for Hardhat node to start..."
    sleep 5
  else
    echo "Hardhat node is running."
  fi
fi

# Check if smart contract is deployed
echo "Checking if smart contract is deployed..."
# This is a placeholder - actual implementation would depend on your backend structure
# You might want to call a script or API endpoint to check contract deployment status

# Start the backend server
echo "Starting DBIS backend server..."

# Check if nodemon is installed for development
if [ "$NODE_ENV" = "development" ] && command -v npx &> /dev/null; then
  echo "Starting server with nodemon for auto-restart on file changes..."
  npx nodemon server.js
else
  # Production mode or nodemon not available
  echo "Starting server in production mode..."
  node server.js
fi

# Exit message - this will only show if the server is stopped
echo "DBIS backend server stopped."
