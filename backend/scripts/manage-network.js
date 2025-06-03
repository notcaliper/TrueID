/**
 * Blockchain network management script for DBIS
 * Allows switching between local Hardhat and Avalanche Fuji networks
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
  const network = process.env.BLOCKCHAIN_NETWORK || 'local';
  
  // Configuration for local network
  if (network === 'local') {
    return {
      network: 'local',
      rpcUrl: process.env.LOCAL_RPC_URL || 'http://127.0.0.1:8545',
      contractAddress: process.env.LOCAL_CONTRACT_ADDRESS,
      networkName: 'Local Hardhat'
    };
  }
  
  // Configuration for Avalanche Fuji testnet
  if (network === 'avalanche') {
    return {
      network: 'avalanche',
      rpcUrl: process.env.AVALANCHE_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
      contractAddress: process.env.AVALANCHE_FUJI_CONTRACT_ADDRESS,
      networkName: 'Avalanche Fuji Testnet'
    };
  }
  
  // Default to local if network is not recognized
  return {
    network: 'local',
    rpcUrl: process.env.LOCAL_RPC_URL || 'http://127.0.0.1:8545',
    contractAddress: process.env.LOCAL_CONTRACT_ADDRESS,
    networkName: 'Local Hardhat'
  };
};

/**
 * Switch blockchain network
 * @param {String} network - Network to switch to ('local' or 'avalanche')
 * @returns {Boolean} True if switch was successful
 */
const switchNetwork = async (network) => {
  try {
    if (network !== 'local' && network !== 'avalanche') {
      throw new Error('Invalid network. Must be "local" or "avalanche"');
    }
    
    // Update .env file
    const envPath = path.resolve(__dirname, '..', '.env');
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace network setting
      envContent = envContent.replace(
        /BLOCKCHAIN_NETWORK=.*/,
        `BLOCKCHAIN_NETWORK=${network}`
      );
      
      fs.writeFileSync(envPath, envContent);
      
      // Update environment variable in current process
      process.env.BLOCKCHAIN_NETWORK = network;
      
      console.log(`Switched to ${network === 'local' ? 'Local Hardhat' : 'Avalanche Fuji Testnet'} network`);
      return true;
    } else {
      throw new Error('.env file not found');
    }
  } catch (error) {
    console.error('Switch network error:', error);
    return false;
  }
};

/**
 * Check if contract is accessible
 * @returns {Promise<Object>} Contract status
 */
const checkContract = async () => {
  try {
    const config = getCurrentNetworkConfig();
    
    if (!config.contractAddress) {
      return {
        accessible: false,
        deployed: false,
        error: 'Contract address not set',
        network: config.networkName
      };
    }
    
    // Create provider
    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    
    // Check if provider is connected
    await provider.getNetwork();
    
    // Check if contract exists at address
    const code = await provider.getCode(config.contractAddress);
    
    if (code === '0x') {
      return {
        accessible: false,
        deployed: false,
        error: 'No contract at specified address',
        network: config.networkName
      };
    }
    
    return {
      accessible: true,
      deployed: true,
      address: config.contractAddress,
      network: config.networkName
    };
  } catch (error) {
    return {
      accessible: false,
      deployed: false,
      error: error.message,
      network: getCurrentNetworkConfig().networkName
    };
  }
};

/**
 * Display network status
 */
const displayNetworkStatus = async () => {
  const config = getCurrentNetworkConfig();
  console.log('\n=== DBIS Blockchain Network Status ===');
  console.log(`Current Network: ${config.networkName}`);
  console.log(`RPC URL: ${config.rpcUrl}`);
  
  if (config.contractAddress) {
    console.log(`Contract Address: ${config.contractAddress}`);
  } else {
    console.log('Contract Address: Not deployed');
  }
  
  console.log('\nChecking contract accessibility...');
  const contractStatus = await checkContract();
  
  if (contractStatus.accessible) {
    console.log('✅ Contract is accessible and deployed');
  } else {
    console.log('❌ Contract is not accessible');
    if (contractStatus.error) {
      console.log(`   Error: ${contractStatus.error}`);
    }
  }
  
  console.log('\n=== Available Commands ===');
  console.log('1. Switch to Local Hardhat: node scripts/manage-network.js local');
  console.log('2. Switch to Avalanche Fuji: node scripts/manage-network.js avalanche');
  console.log('3. Check Status: node scripts/manage-network.js status');
  console.log('');
};

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'status') {
    await displayNetworkStatus();
    return;
  }
  
  if (command === 'local' || command === 'avalanche') {
    const currentConfig = getCurrentNetworkConfig();
    
    if (currentConfig.network === command) {
      console.log(`Already on ${command === 'local' ? 'Local Hardhat' : 'Avalanche Fuji Testnet'} network`);
    } else {
      await switchNetwork(command);
    }
    
    await displayNetworkStatus();
    return;
  }
  
  console.log('Invalid command. Available commands:');
  console.log('- node scripts/manage-network.js status');
  console.log('- node scripts/manage-network.js local');
  console.log('- node scripts/manage-network.js avalanche');
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
