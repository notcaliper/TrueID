/**
 * Script to start a local Hardhat blockchain and deploy contracts
 * This script will:
 * 1. Start a local Hardhat node
 * 2. Deploy the smart contracts
 * 3. Update the .env file with contract addresses
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to Hardhat binary
const hardhatBin = path.join(__dirname, '..', 'node_modules', '.bin', 'hardhat');

// Start Hardhat node
console.log('Starting local Hardhat blockchain...');
const hardhatProcess = spawn(hardhatBin, ['node'], {
  stdio: 'inherit',
  shell: true,
  detached: true
});

// Give the node some time to start up
setTimeout(() => {
  console.log('\nHardhat node is running. Deploying contracts...');
  
  // Deploy contracts in a separate process
  const deployProcess = spawn('node', [path.join(__dirname, 'deploy-local-contracts.js')], {
    stdio: 'inherit',
    shell: true
  });
  
  deployProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\nContracts deployed successfully!');
      console.log('\nThe local blockchain is running in the background.');
      console.log('To stop it, you will need to terminate the process manually.');
      console.log('\nYou can now start the backend server with:');
      console.log('node server.js');
    } else {
      console.error(`\nContract deployment failed with code ${code}`);
      console.log('The Hardhat node is still running. You may try to deploy contracts manually with:');
      console.log('node scripts/deploy-local-contracts.js');
    }
  });
}, 5000);

// Handle process exit
process.on('SIGINT', () => {
  if (hardhatProcess) {
    hardhatProcess.kill();
  }
  process.exit(0);
});
