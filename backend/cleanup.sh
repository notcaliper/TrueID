#!/bin/bash

# TrueID Backend Cleanup Script
# This script cleans temporary files, logs, and build artifacts

echo "Cleaning TrueID Backend..."

# Remove log files
echo "Removing log files..."
rm -f local-blockchain.log hardhat-node.log .node.pid

# Clean blockchain build artifacts
echo "Cleaning blockchain build artifacts..."
rm -rf blockchain/cache/* blockchain/artifacts/*

# Option to clean node_modules (commented out by default)
if [ "$1" == "--deep" ]; then
  echo "Performing deep clean (including node_modules)..."
  rm -rf node_modules
  echo "You will need to run 'npm install' before starting the server again."
fi

# Option to clean unnecessary development files
if [ "$1" == "--clean-dev" ] || [ "$1" == "--full" ]; then
  echo "Removing unnecessary development/utility files..."
  # Remove test utility scripts
  rm -f interact-with-contracts.js restart-server.js 
  
  # Remove redundant connection check scripts
  rm -f check-connection.js checkConnection.js
  
  # Remove unnecessary documentation
  rm -f README-AVALANCHE.md README-BLOCKCHAIN.md
  
  # Remove development-only scripts
  rm -f scripts/deploy-avalanche.js
fi

# Option to clean possibly redundant contracts
if [ "$1" == "--clean-contracts" ] || [ "$1" == "--full" ]; then
  echo "Removing redundant smart contracts..."
  # BiometricIdentitySystem.sol is older and appears to be replaced by IdentityManagement.sol
  rm -f blockchain/contracts/BiometricIdentitySystem.sol
  
  # DBISIdentityContract.sol may also be redundant - backup before removing
  if [ ! -d "blockchain/contracts/backup" ]; then
    mkdir -p blockchain/contracts/backup
  fi
  cp blockchain/contracts/DBISIdentityContract.sol blockchain/contracts/backup/
  rm -f blockchain/contracts/DBISIdentityContract.sol
  
  echo "Contracts backed up to blockchain/contracts/backup before removal"
fi

echo "Cleanup complete!" 