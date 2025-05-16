/**
 * Smart contract deployment script for DBIS
 * Deploys the IdentityManagement contract to the blockchain
 */
const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
const solc = require('solc');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Ensure required environment variables are set
const {
  BLOCKCHAIN_RPC_URL,
  ADMIN_PRIVATE_KEY,
  ADMIN_WALLET_ADDRESS
} = process.env;

if (!BLOCKCHAIN_RPC_URL) {
  console.error('BLOCKCHAIN_RPC_URL is not defined in environment variables');
  process.exit(1);
}

if (!ADMIN_PRIVATE_KEY) {
  console.error('ADMIN_PRIVATE_KEY is not defined in environment variables');
  process.exit(1);
}

// Compile the contract
async function compileContract() {
  console.log('Compiling contract...');
  
  // Read the contract source code
  const contractPath = path.resolve(__dirname, 'contracts', 'IdentityManagement.sol');
  const contractSource = fs.readFileSync(contractPath, 'utf8');
  
  // Prepare input for solc compiler
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
          '*': ['abi', 'evm.bytecode']
        }
      }
    }
  };
  
  // Compile the contract
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  // Check for errors
  if (output.errors) {
    output.errors.forEach(error => {
      console.error(error.formattedMessage);
    });
    
    if (output.errors.some(error => error.severity === 'error')) {
      throw new Error('Compilation failed');
    }
  }
  
  // Get the contract artifacts
  const contractOutput = output.contracts['IdentityManagement.sol']['IdentityManagement'];
  const abi = contractOutput.abi;
  const bytecode = contractOutput.evm.bytecode.object;
  
  // Create output directory if it doesn't exist
  const abiDir = path.resolve(__dirname, 'contracts', 'abi');
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }
  
  // Save the ABI to a file
  fs.writeFileSync(
    path.resolve(abiDir, 'IdentityManagement.json'),
    JSON.stringify(abi, null, 2)
  );
  
  return { abi, bytecode };
}

// Deploy the contract
async function deployContract() {
  try {
    // Compile the contract
    const { abi, bytecode } = await compileContract();
    
    console.log('Contract compiled successfully');
    
    // Connect to the blockchain
    const provider = new ethers.providers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
    
    console.log(`Deploying contract from address: ${wallet.address}`);
    
    // Create contract factory
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    // Deploy the contract
    console.log('Deploying contract...');
    const contract = await factory.deploy();
    
    // Wait for the contract to be deployed
    console.log(`Contract deployment transaction hash: ${contract.deployTransaction.hash}`);
    console.log('Waiting for contract deployment to be confirmed...');
    
    await contract.deployed();
    
    console.log(`Contract deployed successfully at address: ${contract.address}`);
    
    // Save the contract address to a file
    const deploymentInfo = {
      contractAddress: contract.address,
      deployedBy: wallet.address,
      deploymentTime: new Date().toISOString(),
      network: {
        rpcUrl: BLOCKCHAIN_RPC_URL
      }
    };
    
    fs.writeFileSync(
      path.resolve(__dirname, 'deployment-info.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('Deployment information saved to deployment-info.json');
    
    // Update .env file with contract address if it exists
    try {
      const envPath = path.resolve(__dirname, '..', '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Replace or add CONTRACT_ADDRESS
        if (envContent.includes('CONTRACT_ADDRESS=')) {
          envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${contract.address}`);
        } else {
          envContent += `\nCONTRACT_ADDRESS=${contract.address}\n`;
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log('.env file updated with contract address');
      } else {
        console.log('.env file not found. Please add CONTRACT_ADDRESS manually.');
      }
    } catch (error) {
      console.error('Error updating .env file:', error);
    }
    
    return contract;
  } catch (error) {
    console.error('Error deploying contract:', error);
    process.exit(1);
  }
}

// Main function
async function main() {
  console.log('Starting contract deployment process...');
  
  const contract = await deployContract();
  
  console.log('Contract deployment completed successfully');
  console.log(`Contract address: ${contract.address}`);
  
  // Grant GOVERNMENT_ROLE to the admin wallet
  console.log('Granting GOVERNMENT_ROLE to admin wallet...');
  
  const GOVERNMENT_ROLE = ethers.utils.id("GOVERNMENT");
  
  try {
    const tx = await contract.grantRole(ADMIN_WALLET_ADDRESS || contract.signer.address, GOVERNMENT_ROLE);
    console.log(`Transaction hash: ${tx.hash}`);
    
    await tx.wait();
    console.log('GOVERNMENT_ROLE granted successfully');
  } catch (error) {
    console.error('Error granting GOVERNMENT_ROLE:', error);
  }
  
  process.exit(0);
}

// Run the script
main();
