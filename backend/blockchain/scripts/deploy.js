/**
 * Hardhat deployment script for DBIS Identity Management contract
 */
const fs = require('fs');
const path = require('path');
const hre = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('Starting contract deployment process...');
  
  // Get the network name
  const networkName = hre.network.name;
  console.log(`Deploying to network: ${networkName}`);
  
  // Get the contract factory
  const IdentityManagement = await hre.ethers.getContractFactory('IdentityManagement');
  
  // Deploy the contract
  console.log('Deploying IdentityManagement contract...');
  const identityManagement = await IdentityManagement.deploy();
  
  // Wait for deployment to finish
  await identityManagement.deployed();
  
  console.log(`IdentityManagement contract deployed to: ${identityManagement.address}`);
  
  // Always use Avalanche Fuji Testnet regardless of the network we're deploying to
  let envVarName = 'AVALANCHE_FUJI_CONTRACT_ADDRESS';
  let blockchainNetwork = 'avalanche';
  
  // Force the network name to be avalanche_fuji for consistency
  networkName = 'avalanche_fuji';
  
  // Update .env file with contract address and network
  if (envVarName) {
    try {
      const envPath = path.resolve(__dirname, '..', '..', '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Replace or add contract address
        if (envContent.includes(`${envVarName}=`)) {
          envContent = envContent.replace(
            new RegExp(`${envVarName}=.*`), 
            `${envVarName}=${identityManagement.address}`
          );
        } else {
          envContent += `\n${envVarName}=${identityManagement.address}\n`;
        }
        
        // Update BLOCKCHAIN_NETWORK to match the deployed network
        if (envContent.includes('BLOCKCHAIN_NETWORK=')) {
          envContent = envContent.replace(
            /BLOCKCHAIN_NETWORK=.*/,
            `BLOCKCHAIN_NETWORK=${blockchainNetwork}`
          );
        } else {
          envContent += `\nBLOCKCHAIN_NETWORK=${blockchainNetwork}\n`;
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log(`.env file updated with contract address for ${networkName}`);
        console.log(`BLOCKCHAIN_NETWORK set to ${blockchainNetwork}`);
      }
    } catch (error) {
      console.error('Error updating .env file:', error);
    }
  }
  
  // Save deployment info to a JSON file
  const deploymentInfo = {
    network: networkName,
    contractAddress: identityManagement.address,
    deploymentTime: new Date().toISOString(),
    deployer: (await hre.ethers.getSigners())[0].address
  };
  
  const deploymentDir = path.resolve(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.resolve(deploymentDir, `${networkName}-deployment.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`Deployment information saved to ${networkName}-deployment.json`);
  
  // If we're on a testnet or mainnet, wait for a few confirmations
  if (networkName !== 'localhost' && networkName !== 'hardhat') {
    console.log('Waiting for confirmations...');
    await identityManagement.deployTransaction.wait(5);
    console.log('Contract deployment confirmed');
  }
  
  // Grant roles to the deployer
  console.log('Granting roles to deployer...');
  
  const ADMIN_ROLE = hre.ethers.utils.id("ADMIN");
  const GOVERNMENT_ROLE = hre.ethers.utils.id("GOVERNMENT");
  
  try {
    // Grant ADMIN_ROLE
    let tx = await identityManagement.grantRole(ADMIN_ROLE, deploymentInfo.deployer);
    console.log(`ADMIN_ROLE transaction hash: ${tx.hash}`);
    await tx.wait();
    console.log('ADMIN_ROLE granted successfully');
    
    // Grant GOVERNMENT_ROLE
    tx = await identityManagement.grantRole(GOVERNMENT_ROLE, deploymentInfo.deployer);
    console.log(`GOVERNMENT_ROLE transaction hash: ${tx.hash}`);
    await tx.wait();
    console.log('GOVERNMENT_ROLE granted successfully');
  } catch (error) {
    console.error('Error granting roles:', error);
  }
  
  console.log('Deployment completed successfully');
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
