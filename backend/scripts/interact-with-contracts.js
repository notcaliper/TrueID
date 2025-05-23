/**
 * Script to interact with deployed contracts
 * Can be used with either local or Avalanche Fuji Testnet deployments
 */
const fs = require('fs');
const path = require('path');
const hre = require('hardhat');
require('dotenv').config();

async function main() {
  // Get the network name
  const networkName = hre.network.name;
  console.log(`Interacting with contracts on network: ${networkName}`);
  
  // Get the first account
  const [account] = await hre.ethers.getSigners();
  console.log(`Using account: ${account.address}`);
  console.log(`Account balance: ${hre.ethers.utils.formatEther(await account.getBalance())} ${networkName.includes('avalanche') ? 'AVAX' : 'ETH'}`);
  
  // Get the contract information
  let contractAddress;
  try {
    // First, try to get contract address from deployment file
    let deploymentPath;
    if (networkName === 'localhost' || networkName === 'hardhat') {
      deploymentPath = path.resolve(__dirname, '..', 'blockchain', 'deployments', 'localhost-deployment.json');
    } else if (networkName === 'avalanche_fuji') {
      deploymentPath = path.resolve(__dirname, '..', 'blockchain', 'deployments', 'avalanche_fuji-deployment.json');
    }
    
    if (deploymentPath && fs.existsSync(deploymentPath)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      contractAddress = deploymentInfo.contractAddress;
      console.log(`Found contract address from deployment file: ${contractAddress}`);
    }
    // Otherwise, try to get from .env
    else {
      const envPath = path.resolve(__dirname, '..', '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/CONTRACT_ADDRESS=([^\s]+)/);
        if (match && match[1]) {
          contractAddress = match[1];
          console.log(`Found contract address from .env: ${contractAddress}`);
        }
      }
    }
  } catch (error) {
    console.error('Error loading contract address:', error);
  }
  
  if (!contractAddress) {
    console.error('No contract address found. Please deploy the contract first.');
    process.exit(1);
  }
  
  // Get the contract factory and attach to the deployed address
  console.log(`Attempting to connect to contract at ${contractAddress}`);
  
  let contract;
  try {
    // Using ABI instead of the full contract to avoid bytecode verification
    const IdentityManagementArtifact = await hre.artifacts.readArtifact('IdentityManagement');
    contract = new hre.ethers.Contract(
      contractAddress,
      IdentityManagementArtifact.abi,
      account
    );
    console.log(`Connected to contract at ${contractAddress} using ABI only (bypassing bytecode verification)`);
  } catch (error) {
    console.error(`Error connecting to contract using ABI: ${error.message}`);
    // Try alternative method
    console.log('Trying alternative connection method...');
    
    try {
      const IdentityManagement = await hre.ethers.getContractFactory('IdentityManagement');
      contract = IdentityManagement.attach(contractAddress);
      console.log(`Connected to IdentityManagement at ${contractAddress}`);
    } catch (attachError) {
      console.error(`Failed to connect using contract factory: ${attachError.message}`);
      process.exit(1);
    }
  }
  
  // Read contract information
  try {
    console.log('\nReading contract information...');
    
    // Check if the account has admin role
    try {
      const ADMIN_ROLE = hre.ethers.utils.id("ADMIN");
      const hasAdminRole = await contract.hasRole(ADMIN_ROLE, account.address);
      console.log(`Account has ADMIN role: ${hasAdminRole}`);
    } catch (error) {
      console.log(`Could not check ADMIN role: ${error.message}`);
    }
    
    // Check if the account has government role
    try {
      const GOVERNMENT_ROLE = hre.ethers.utils.id("GOVERNMENT");
      const hasGovernmentRole = await contract.hasRole(GOVERNMENT_ROLE, account.address);
      console.log(`Account has GOVERNMENT role: ${hasGovernmentRole}`);
    } catch (error) {
      console.log(`Could not check GOVERNMENT role: ${error.message}`);
    }
    
    // Get the total number of identities registered
    try {
      const totalIdentities = await contract.getTotalIdentityCount();
      console.log(`Total identities registered: ${totalIdentities}`);
    } catch (error) {
      console.log('Could not get total identity count. Contract may not have this function.');
    }
    
    console.log('\nContract interaction completed successfully');
  } catch (error) {
    console.error('Error interacting with contract:', error);
    process.exit(1);
  }
}

// Execute the interaction
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Interaction failed:', error);
    process.exit(1);
  }); 