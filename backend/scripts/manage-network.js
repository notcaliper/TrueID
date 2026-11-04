/**
 * Blockchain network management script for TrueID
 * Allows switching between local Hardhat and Ethereum Sepolia networks
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { ethers } = require('ethers');

// Load environment variables
dotenv.config();

/**
 * Get current network configuration
 * @returns {Object} Network configuration
 */
const getCurrentNetworkConfig = () => {
  const network = process.env.BLOCKCHAIN_NETWORK || 'sepolia';
  
  if (network === 'local') {
    return {
      network: 'local',
      rpcUrl: process.env.LOCAL_RPC_URL || 'http://127.0.0.1:8545',
      contractAddress: process.env.LOCAL_CONTRACT_ADDRESS,
      networkName: 'Local Hardhat'
    };
  }
  
  return {
    network: 'sepolia',
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
    contractAddress: process.env.CONTRACT_ADDRESS,
    networkName: 'Ethereum Sepolia Testnet'
  };
};

/**
 * Switch blockchain network
 * @param {String} network - Network to switch to ('local' or 'sepolia')
 * @returns {Boolean} True if switch was successful
 */
const switchNetwork = (network) => {
  try {
    if (network !== 'local' && network !== 'sepolia') {
      throw new Error('Invalid network. Must be "local" or "sepolia"');
    }
    
    const envPath = path.resolve(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('BLOCKCHAIN_NETWORK=')) {
      envContent = envContent.replace(
        /BLOCKCHAIN_NETWORK=.*/,
        `BLOCKCHAIN_NETWORK=${network}`
      );
    } else {
      envContent += `\nBLOCKCHAIN_NETWORK=${network}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`Switched to ${network === 'local' ? 'Local Hardhat' : 'Ethereum Sepolia Testnet'} network`);
    return true;
  } catch (error) {
    console.error('Error switching network:', error.message);
    return false;
  }
};

const command = process.argv[2];
if (command === 'local' || command === 'sepolia') {
  switchNetwork(command);
} else {
  const current = getCurrentNetworkConfig();
  console.log(`Current network: ${current.networkName}`);
  console.log('Usage: node scripts/manage-network.js [local|sepolia]');
}
