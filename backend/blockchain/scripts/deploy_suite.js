/**
 * Unified Deployment Script for TrueID Smart Contract Suite on Ethereum Sepolia
 * Deploys:
 *  1. TrueIDZKVerifier (Zero-Knowledge Groth16 Verifier)
 *  2. TrueIDSoulboundBadge (ERC-5192 Soulbound Badge)
 *  3. TrueIDDIDRegistry (W3C & ERC-1056 DID Registry)
 *  4. TrueIDCredentialRegistry (Verifiable Credentials Registry for /professional-records)
 *  5. IdentityManagement (Core Identity Registry)
 */
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function deployContract(name, artifactPath, wallet) {
  console.log(`\nDeploying ${name}...`);
  const artifact = require(artifactPath);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  // Estimate gas and deploy
  const contract = await factory.deploy();
  console.log(`   Tx Submitted: ${contract.deploymentTransaction().hash}`);
  console.log(`   Waiting for block confirmation...`);
  
  const receipt = await contract.deploymentTransaction().wait(1);
  const address = await contract.getAddress();
  console.log(`   ${name} deployed to: ${address}`);
  console.log(`   Block: ${receipt.blockNumber} | Gas Used: ${receipt.gasUsed.toString()}`);
  return { contract, address, txHash: contract.deploymentTransaction().hash };
}

async function main() {
  console.log('====================================================');
  console.log('   TRUEID SMART CONTRACT SUITE - SEPOLIA DEPLOYMENT  ');
  console.log('====================================================');

  const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.BLOCKCHAIN_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
  const privateKey = process.env.ADMIN_WALLET_PRIVATE_KEY || process.env.ADMIN_PRIVATE_KEY || process.env.PRIVATE_KEY;

  if (!privateKey || privateKey.includes('your_')) {
    throw new Error('Valid ADMIN_WALLET_PRIVATE_KEY not found in .env');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const network = await provider.getNetwork();

  const balance = await provider.getBalance(wallet.address);
  console.log(`Network: ${network.name} (chainId: ${network.chainId})`);
  console.log(`RPC URL: ${rpcUrl}`);
  console.log(`Deployer Wallet: ${wallet.address}`);
  console.log(`Deployer Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    throw new Error('Deployer wallet has 0 ETH on Sepolia. Please fund the account before deploying.');
  }

  const artifactsBase = path.resolve(__dirname, '../artifacts/blockchain/contracts');

  // 1. Deploy Zero-Knowledge Groth16 Verifier
  const zkDeployment = await deployContract(
    'TrueIDZKVerifier',
    path.join(artifactsBase, 'TrueIDZKVerifier.sol/TrueIDZKVerifier.json'),
    wallet
  );

  // 2. Deploy ERC-5192 Soulbound Badge
  const sbtDeployment = await deployContract(
    'TrueIDSoulboundBadge',
    path.join(artifactsBase, 'TrueIDSoulboundBadge.sol/TrueIDSoulboundBadge.json'),
    wallet
  );

  // 3. Deploy W3C DID Registry
  const didDeployment = await deployContract(
    'TrueIDDIDRegistry',
    path.join(artifactsBase, 'TrueIDDIDRegistry.sol/TrueIDDIDRegistry.json'),
    wallet
  );

  // 4. Deploy Verifiable Credentials Registry (/professional-records)
  const credentialDeployment = await deployContract(
    'TrueIDCredentialRegistry',
    path.join(artifactsBase, 'TrueIDCredentialRegistry.sol/TrueIDCredentialRegistry.json'),
    wallet
  );

  // 5. Deploy IdentityManagement (Core Registry)
  const identityDeployment = await deployContract(
    'IdentityManagement',
    path.join(artifactsBase, 'IdentityManagement.sol/IdentityManagement.json'),
    wallet
  );

  // 6. Link permissions: Authorize IdentityManagement to mint soulbound badges
  console.log('\nLinking permissions...');
  console.log(`Setting Soulbound Badge registry to IdentityManagement (${identityDeployment.address})...`);
  const linkTx = await sbtDeployment.contract.setRegistryContract(identityDeployment.address);
  console.log(`   Link Tx Hash: ${linkTx.hash}`);
  await linkTx.wait(1);
  console.log('   Soulbound badge linked successfully.');

  // Save deployment manifest
  const deploymentSummary = {
    network: 'sepolia',
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    deployer: wallet.address,
    contracts: {
      TrueIDZKVerifier: {
        address: zkDeployment.address,
        txHash: zkDeployment.txHash,
        explorer: `https://sepolia.etherscan.io/address/${zkDeployment.address}`
      },
      TrueIDSoulboundBadge: {
        address: sbtDeployment.address,
        txHash: sbtDeployment.txHash,
        explorer: `https://sepolia.etherscan.io/address/${sbtDeployment.address}`
      },
      TrueIDDIDRegistry: {
        address: didDeployment.address,
        txHash: didDeployment.txHash,
        explorer: `https://sepolia.etherscan.io/address/${didDeployment.address}`
      },
      TrueIDCredentialRegistry: {
        address: credentialDeployment.address,
        txHash: credentialDeployment.txHash,
        explorer: `https://sepolia.etherscan.io/address/${credentialDeployment.address}`
      },
      IdentityManagement: {
        address: identityDeployment.address,
        txHash: identityDeployment.txHash,
        explorer: `https://sepolia.etherscan.io/address/${identityDeployment.address}`
      }
    }
  };

  const deploymentDir = path.resolve(__dirname, '../deployments');
  fs.mkdirSync(deploymentDir, { recursive: true });
  const manifestPath = path.join(deploymentDir, 'sepolia-suite-deployment.json');
  fs.writeFileSync(manifestPath, JSON.stringify(deploymentSummary, null, 2));

  console.log('\n====================================================');
  console.log('   DEPLOYMENT SUCCESSFUL TO ETHEREUM SEPOLIA!       ');
  console.log('====================================================');
  console.log(`ZK Verifier:             ${zkDeployment.address}`);
  console.log(`Soulbound Badge (5192):  ${sbtDeployment.address}`);
  console.log(`DID Registry (W3C):      ${didDeployment.address}`);
  console.log(`Credential Registry:     ${credentialDeployment.address}`);
  console.log(`Identity Management:     ${identityDeployment.address}`);
  console.log(`\nDeployment manifest saved to: ${manifestPath}`);

  return deploymentSummary;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nDeployment Failed:', err);
    process.exit(1);
  });
