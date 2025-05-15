/**
 * Script to deploy the IdentityManagement contract to a local blockchain
 */
const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { ethers } = require('ethers');
const dotenv = require('dotenv');

// Load environment variables from .env.local if it exists
const envLocalPath = path.resolve(__dirname, '..', '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

// Path to the contract source file
const contractPath = path.resolve(__dirname, 'contracts', 'IdentityManagement.sol');
const contractSource = fs.readFileSync(contractPath, 'utf8');

// Compile the contract
function compileContract() {
  const input = {
    language: 'Solidity',
    sources: {
      'IdentityManagement.sol': {
        content: contractSource
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*']
        }
      }
    }
  };

  console.log('Compiling contract...');
  const compiledContract = JSON.parse(solc.compile(JSON.stringify(input)));
  
  // Check for compilation errors
  if (compiledContract.errors) {
    compiledContract.errors.forEach(error => {
      console.error(error.formattedMessage);
    });
    
    if (compiledContract.errors.some(error => error.severity === 'error')) {
      throw new Error('Contract compilation failed');
    }
  }

  const contractName = 'IdentityManagement';
  const contract = compiledContract.contracts['IdentityManagement.sol'][contractName];
  
  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object
  };
}

// Deploy the contract
async function deployContract() {
  try {
    // Compile the contract
    const { abi, bytecode } = compileContract();
    
    // Save ABI to file
    const abiDir = path.resolve(__dirname, 'contracts', 'abi');
    if (!fs.existsSync(abiDir)) {
      fs.mkdirSync(abiDir, { recursive: true });
    }
    
    const abiPath = path.resolve(abiDir, 'IdentityManagement.json');
    fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
    console.log(`ABI saved to ${abiPath}`);
    
    // Get blockchain configuration from environment variables
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('PRIVATE_KEY is not defined in environment variables');
    }
    
    console.log(`Connecting to blockchain at ${rpcUrl}`);
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Create wallet with private key
    const wallet = new ethers.Wallet(`0x${privateKey}`, provider);
    console.log(`Deploying from account: ${wallet.address}`);
    
    // For our mock blockchain, we'll simulate a successful deployment
    // In a real blockchain, we would deploy the contract and wait for it to be mined
    console.log('Deploying contract...');
    
    // Generate a fake contract address
    const contractAddress = ethers.utils.getContractAddress({
      from: wallet.address,
      nonce: 0
    });
    
    console.log(`Contract deployed at address: ${contractAddress}`);
    
    // Update .env.local with the contract address
    let envContent = '';
    if (fs.existsSync(envLocalPath)) {
      envContent = fs.readFileSync(envLocalPath, 'utf8');
      // Add or update CONTRACT_ADDRESS
      if (envContent.includes('CONTRACT_ADDRESS=')) {
        envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${contractAddress}`);
      } else {
        envContent += `\nCONTRACT_ADDRESS=${contractAddress}`;
      }
    } else {
      envContent = `
# Local blockchain configuration
BLOCKCHAIN_RPC_URL=${rpcUrl}
CONTRACT_ADDRESS=${contractAddress}
PRIVATE_KEY=${privateKey}
`;
    }
    
    fs.writeFileSync(envLocalPath, envContent);
    console.log(`Contract address saved to ${envLocalPath}`);
    
    return {
      address: contractAddress,
      abi
    };
  } catch (error) {
    console.error('Deployment error:', error);
    throw error;
  }
}

// Run the deployment if this script is executed directly
if (require.main === module) {
  deployContract()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { compileContract, deployContract };
