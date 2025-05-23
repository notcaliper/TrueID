/**
 * Local deployment script for DBIS Identity Management contract
 * This script is specifically for deploying to a local network
 */
const fs = require('fs');
const path = require('path');
const hre = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('Starting local contract deployment process...');
  
  // Ensure we're on the local network
  const networkName = hre.network.name;
  if (networkName !== 'localhost' && networkName !== 'hardhat') {
    console.warn(`WARNING: You're not deploying to a local network. Current network: ${networkName}`);
    const proceed = await promptToContinue();
    if (!proceed) {
      console.log('Deployment canceled.');
      return;
    }
  } else {
    console.log(`Deploying to local network: ${networkName}`);
  }
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  console.log(`Account balance: ${hre.ethers.utils.formatEther(await deployer.getBalance())} ETH`);

  // Get the contract factory
  const IdentityManagement = await hre.ethers.getContractFactory('IdentityManagement');
  
  // Deploy the contract
  console.log('Deploying IdentityManagement contract...');
  const identityManagement = await IdentityManagement.deploy();
  
  // Wait for deployment to finish
  await identityManagement.deployed();
  
  console.log(`IdentityManagement contract deployed to: ${identityManagement.address}`);
  
  // Update .env file with contract address
  try {
    const envPath = path.resolve(__dirname, '..', '..', '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace or add LOCAL_CONTRACT_ADDRESS
      if (envContent.includes('LOCAL_CONTRACT_ADDRESS=')) {
        envContent = envContent.replace(
          /LOCAL_CONTRACT_ADDRESS=.*/,
          `LOCAL_CONTRACT_ADDRESS=${identityManagement.address}`
        );
      } else {
        envContent += `\nLOCAL_CONTRACT_ADDRESS=${identityManagement.address}\n`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log(`.env file updated with local contract address: ${identityManagement.address}`);
    } else {
      console.warn(`.env file not found at ${envPath}, creating one with the contract address`);
      fs.writeFileSync(envPath, `LOCAL_CONTRACT_ADDRESS=${identityManagement.address}\n`);
    }
  } catch (error) {
    console.error('Error updating .env file:', error);
  }
  
  // Save deployment info to a JSON file
  const deploymentInfo = {
    network: networkName,
    contractAddress: identityManagement.address,
    deploymentTime: new Date().toISOString(),
    deployer: deployer.address
  };
  
  const deploymentDir = path.resolve(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  const deploymentFile = path.resolve(deploymentDir, `${networkName}-deployment.json`);
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`Deployment information saved to ${deploymentFile}`);
  
  // Grant roles to the deployer
  console.log('Granting roles to deployer...');
  
  const ADMIN_ROLE = hre.ethers.utils.id("ADMIN");
  const GOVERNMENT_ROLE = hre.ethers.utils.id("GOVERNMENT");
  
  try {
    // Grant ADMIN_ROLE
    let tx = await identityManagement.grantRole(ADMIN_ROLE, deployer.address);
    console.log(`ADMIN_ROLE transaction hash: ${tx.hash}`);
    await tx.wait();
    console.log('ADMIN_ROLE granted successfully');
    
    // Grant GOVERNMENT_ROLE
    tx = await identityManagement.grantRole(GOVERNMENT_ROLE, deployer.address);
    console.log(`GOVERNMENT_ROLE transaction hash: ${tx.hash}`);
    await tx.wait();
    console.log('GOVERNMENT_ROLE granted successfully');
  } catch (error) {
    console.error('Error granting roles:', error);
  }
  
  // Deploy BiometricIdentitySystem contract
  try {
    console.log('Deploying BiometricIdentitySystem contract...');
    const BiometricIdentitySystem = await hre.ethers.getContractFactory('BiometricIdentitySystem');
    // Deploy without arguments since the constructor doesn't take any parameters
    const biometricSystem = await BiometricIdentitySystem.deploy();
    await biometricSystem.deployed();
    
    console.log(`BiometricIdentitySystem contract deployed to: ${biometricSystem.address}`);
    
    // Save BiometricIdentitySystem address to deployment info
    deploymentInfo.biometricSystemAddress = biometricSystem.address;
    fs.writeFileSync(
      deploymentFile,
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('Updated deployment information with BiometricIdentitySystem address');
  } catch (error) {
    console.error('Error deploying BiometricIdentitySystem contract:', error);
  }
  
  console.log('Local deployment completed successfully');
  console.log('----------------------------------------------');
  console.log('Summary:');
  console.log(`- Network: ${networkName}`);
  console.log(`- IdentityManagement contract: ${identityManagement.address}`);
  console.log(`- Deployer: ${deployer.address}`);
  console.log(`- Roles granted: ADMIN, GOVERNMENT`);
  console.log('----------------------------------------------');
  console.log('To interact with the contract, use:');
  console.log(`npx hardhat console --network ${networkName}`);
  console.log('> const IdentityManagement = await ethers.getContractFactory("IdentityManagement")');
  console.log(`> const contract = await IdentityManagement.attach("${identityManagement.address}")`);
}

// Helper function to prompt user for confirmation
async function promptToContinue() {
  return new Promise((resolve) => {
    process.stdout.write('Do you want to continue? (y/n): ');
    process.stdin.once('data', (data) => {
      const input = data.toString().trim().toLowerCase();
      resolve(input === 'y' || input === 'yes');
    });
  });
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  }); 