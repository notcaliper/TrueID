/**
 * Avalanche Fuji Testnet deployment script for DBIS Identity Management contract
 * This script is specifically for deploying to the Avalanche Fuji testnet
 */
const fs = require('fs');
const path = require('path');
const hre = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('Starting Avalanche Fuji testnet deployment process...');
  
  // Ensure we're on the Fuji testnet
  const networkName = hre.network.name;
  if (networkName !== 'avalanche_fuji') {
    console.error(`ERROR: You're not deploying to Avalanche Fuji testnet. Current network: ${networkName}`);
    console.error('Please run with: npx hardhat run --network avalanche_fuji scripts/deploy-avalanche.js');
    process.exit(1);
  }
  
  console.log(`Deploying to Avalanche Fuji testnet: ${networkName}`);
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  console.log(`Account balance: ${hre.ethers.utils.formatEther(await deployer.getBalance())} AVAX`);

  // Get the contract factory
  const IdentityManagement = await hre.ethers.getContractFactory('IdentityManagement');
  
  // Deploy the contract
  console.log('Deploying IdentityManagement contract...');
  const identityManagement = await IdentityManagement.deploy();
  
  // Wait for deployment to finish
  await identityManagement.deployed();
  
  console.log(`IdentityManagement contract deployed to: ${identityManagement.address}`);
  
  // Wait for additional confirmations as we're on testnet
  console.log('Waiting for confirmations...');
  await identityManagement.deployTransaction.wait(3);
  console.log('Contract deployment confirmed with 3 confirmations');
  
  // Update .env file with contract address
  try {
    const envPath = path.resolve(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace or add CONTRACT_ADDRESS
      if (envContent.includes('CONTRACT_ADDRESS=')) {
        envContent = envContent.replace(
          /CONTRACT_ADDRESS=.*/,
          `CONTRACT_ADDRESS=${identityManagement.address}`
        );
      } else {
        envContent += `\nCONTRACT_ADDRESS=${identityManagement.address}\n`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log(`.env file updated with contract address: ${identityManagement.address}`);
    } else {
      console.warn(`.env file not found at ${envPath}, creating one with the contract address`);
      fs.writeFileSync(envPath, `CONTRACT_ADDRESS=${identityManagement.address}\n`);
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
  
  const deploymentDir = path.resolve(__dirname, '..', 'blockchain', 'deployments');
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
    await tx.wait(2);
    console.log('ADMIN_ROLE granted successfully');
    
    // Grant GOVERNMENT_ROLE
    tx = await identityManagement.grantRole(GOVERNMENT_ROLE, deployer.address);
    console.log(`GOVERNMENT_ROLE transaction hash: ${tx.hash}`);
    await tx.wait(2);
    console.log('GOVERNMENT_ROLE granted successfully');
  } catch (error) {
    console.error('Error granting roles:', error);
  }
  
  console.log('Avalanche Fuji testnet deployment completed successfully');
  console.log('----------------------------------------------');
  console.log('Summary:');
  console.log(`- Network: ${networkName}`);
  console.log(`- IdentityManagement contract: ${identityManagement.address}`);
  console.log(`- Deployer: ${deployer.address}`);
  console.log(`- Roles granted: ADMIN, GOVERNMENT`);
  console.log('----------------------------------------------');
  console.log('Your contract is now deployed on Avalanche Fuji testnet');
  console.log(`Contract address: ${identityManagement.address}`);
  console.log(`View on Snowtrace: https://testnet.snowtrace.io/address/${identityManagement.address}`);
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  }); 