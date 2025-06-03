#!/bin/bash

echo "Starting TrueID Government Portal..."
echo "Installing dependencies..."
npm install

echo "Creating .env file with default configuration..."
cat > .env << EOL
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
EOL

echo "Starting development server..."
npm start
