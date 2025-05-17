#!/bin/bash

echo "Starting DBIS Government Portal..."
echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Creating .env file with default configuration..."
cat > .env << EOL
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
EOL

echo "Starting development server..."
PORT=3006 npm start
