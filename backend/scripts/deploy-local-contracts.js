/**
 * Script to deploy smart contracts to local Hardhat network
 * This will deploy the contracts and update the .env file with the contract addresses
 */

const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');
const dotenv = require('dotenv');

async function main() {
  console.log('Deploying smart contracts to local Hardhat network...');

  // Get the contract factories
  const BiometricIdentitySystem = await ethers.getContractFactory('BiometricIdentitySystem');
  const IdentityManagement = await ethers.getContractFactory('IdentityManagement');
  const DBISIdentityContract = await ethers.getContractFactory('DBISIdentityContract');

  // Deploy the contracts
  console.log('Deploying BiometricIdentitySystem...');
  const biometricSystem = await BiometricIdentitySystem.deploy();
  await biometricSystem.deployed();
  console.log('BiometricIdentitySystem deployed to:', biometricSystem.address);

  console.log('Deploying IdentityManagement...');
  const identityManagement = await IdentityManagement.deploy();
  await identityManagement.deployed();
  console.log('IdentityManagement deployed to:', identityManagement.address);

  console.log('Deploying DBISIdentityContract...');
  const dbisIdentity = await DBISIdentityContract.deploy();
  await dbisIdentity.deployed();
  console.log('DBISIdentityContract deployed to:', dbisIdentity.address);

  // We'll use the DBISIdentityContract as our main contract
  const mainContractAddress = dbisIdentity.address;

  // Update the .env file with the contract address
  try {
    const envPath = path.resolve(__dirname, '..', '.env');
    
    // Check if .env file exists, if not create one from .env.example
    if (!fs.existsSync(envPath)) {
      console.log('.env file not found, creating from .env.example...');
      const exampleEnvPath = path.resolve(__dirname, '..', '.env.example');
      if (fs.existsSync(exampleEnvPath)) {
        fs.copyFileSync(exampleEnvPath, envPath);
      } else {
        console.error('.env.example file not found');
        return;
      }
    }
    
    // Read the current .env file
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update the LOCAL_CONTRACT_ADDRESS
    let updatedEnvContent = envContent;
    
    if (envContent.includes('LOCAL_CONTRACT_ADDRESS=')) {
      updatedEnvContent = updatedEnvContent.replace(
        /LOCAL_CONTRACT_ADDRESS=.*/,
        `LOCAL_CONTRACT_ADDRESS=${mainContractAddress}`
      );
    } else {
      updatedEnvContent += `\nLOCAL_CONTRACT_ADDRESS=${mainContractAddress}\n`;
    }
    
    // Remove any POLYGON_CONTRACT_ADDRESS if it exists
    if (updatedEnvContent.includes('POLYGON_CONTRACT_ADDRESS=')) {
      updatedEnvContent = updatedEnvContent.replace(/POLYGON_CONTRACT_ADDRESS=.*\n/, '');
    }
    
    // Update BLOCKCHAIN_NETWORK to hardhat
    if (updatedEnvContent.includes('BLOCKCHAIN_NETWORK=')) {
      updatedEnvContent = updatedEnvContent.replace(
        /BLOCKCHAIN_NETWORK=.*/,
        'BLOCKCHAIN_NETWORK=hardhat'
      );
    } else {
      updatedEnvContent += `\nBLOCKCHAIN_NETWORK=hardhat\n`;
    }
    
    // Update BLOCKCHAIN_RPC_URL to local Hardhat node
    if (updatedEnvContent.includes('BLOCKCHAIN_RPC_URL=')) {
      updatedEnvContent = updatedEnvContent.replace(
        /BLOCKCHAIN_RPC_URL=.*/,
        'BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545'
      );
    } else {
      updatedEnvContent += `\nBLOCKCHAIN_RPC_URL=http://127.0.0.1:8545\n`;
    }
    
    // Write the updated content back to the .env file
    fs.writeFileSync(envPath, updatedEnvContent);
    console.log('.env file updated with contract address:', mainContractAddress);
    
    console.log('\nDeployment complete! The backend is now configured to use the local Hardhat network.');
    console.log('To start the Hardhat network, run: npx hardhat node');
    console.log('To start the backend server, run: node server.js');
    
  } catch (error) {
    console.error('Error updating .env file:', error);
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
