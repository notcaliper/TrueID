/**
 * Fund Admin Wallet Script
 * 
 * This script transfers ETH from a Hardhat default account to the admin wallet
 * specified in the .env file.
 */

const { ethers } = require('ethers');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function main() {
  console.log('Starting to fund admin wallet...');
  
  // Hardhat's first account has plenty of ETH
  const hardhatPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  
  // Get admin private key from .env
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
  
  if (!adminPrivateKey) {
    console.error('Error: ADMIN_PRIVATE_KEY not found in .env file');
    process.exit(1);
  }
  
  // Fix private key format if needed (add 0x prefix if missing)
  const formattedAdminKey = adminPrivateKey.startsWith('0x') 
    ? adminPrivateKey 
    : `0x${adminPrivateKey}`;
  
  // Create provider
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  
  // Create wallets
  const hardhatWallet = new ethers.Wallet(hardhatPrivateKey, provider);
  const adminWallet = new ethers.Wallet(formattedAdminKey, provider);
  
  // Get admin wallet address
  const adminAddress = adminWallet.address;
  console.log(`Admin wallet address: ${adminAddress}`);
  
  // Check initial balances
  const initialHardhatBalance = await provider.getBalance(hardhatWallet.address);
  const initialAdminBalance = await provider.getBalance(adminAddress);
  
  console.log(`Initial Hardhat wallet balance: ${ethers.utils.formatEther(initialHardhatBalance)} ETH`);
  console.log(`Initial Admin wallet balance: ${ethers.utils.formatEther(initialAdminBalance)} ETH`);
  
  // Send 1 ETH to admin wallet
  const tx = await hardhatWallet.sendTransaction({
    to: adminAddress,
    value: ethers.utils.parseEther('1.0')
  });
  
  console.log(`Transaction hash: ${tx.hash}`);
  console.log('Waiting for transaction confirmation...');
  
  // Wait for transaction to be mined
  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
  
  // Check final balances
  const finalHardhatBalance = await provider.getBalance(hardhatWallet.address);
  const finalAdminBalance = await provider.getBalance(adminAddress);
  
  console.log(`Final Hardhat wallet balance: ${ethers.utils.formatEther(finalHardhatBalance)} ETH`);
  console.log(`Final Admin wallet balance: ${ethers.utils.formatEther(finalAdminBalance)} ETH`);
  console.log('Admin wallet funded successfully!');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  }); 