/**
 * Script to check wallet balances on Avalanche Fuji Testnet
 */
const ethers = require('ethers');
require('dotenv').config();

/**
 * Check wallet balance on Avalanche Fuji Testnet
 * @param {string} address - Wallet address to check
 * @returns {Promise<string>} Balance in AVAX
 */
async function checkWalletBalance(address) {
  try {
    // Initialize provider
    const rpcUrl = process.env.AVALANCHE_FUJI_RPC_URL;
    if (!rpcUrl) {
      throw new Error('AVALANCHE_FUJI_RPC_URL not defined in environment variables');
    }
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Get balance
    const balance = await provider.getBalance(address);
    
    // Convert from wei to AVAX (18 decimals)
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Check admin wallet balance
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) {
      throw new Error('ADMIN_PRIVATE_KEY not found in environment variables');
    }
    
    // Create wallet from admin private key
    const wallet = new ethers.Wallet(adminPrivateKey);
    const adminAddress = wallet.address;
    
    console.log('\n=== Admin Wallet ===');
    console.log('Address:', adminAddress);
    const adminBalance = await checkWalletBalance(adminAddress);
    console.log('Balance:', adminBalance, 'AVAX');
    console.log('Explorer URL:', `https://testnet.snowtrace.io/address/${adminAddress}`);
    
    // Check if we should query the database for user wallets
    const args = process.argv.slice(2);
    if (args.includes('--all-users')) {
      await checkAllUserWallets();
    } else if (args.length > 0 && !args[0].startsWith('--')) {
      // If an address was provided as a command line argument
      const userAddress = args[0];
      console.log('\n=== User Wallet ===');
      console.log('Address:', userAddress);
      const userBalance = await checkWalletBalance(userAddress);
      console.log('Balance:', userBalance, 'AVAX');
      console.log('Explorer URL:', `https://testnet.snowtrace.io/address/${userAddress}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

/**
 * Check balances for all user wallets in the database
 */
async function checkAllUserWallets() {
  try {
    // Require database utilities
    const db = require('../utils/db.utils');
    
    console.log('\n=== User Wallets ===');
    
    // Query user wallets from database
    const result = await db.query(
      'SELECT id, name, avax_address FROM users WHERE avax_address IS NOT NULL',
      []
    );
    
    if (result.rows.length === 0) {
      console.log('No user wallets found in the database.');
      return;
    }
    
    console.log(`Found ${result.rows.length} user wallets.`);
    
    // Check balance for each wallet
    for (const user of result.rows) {
      try {
        const balance = await checkWalletBalance(user.avax_address);
        console.log(`User ID: ${user.id}, Name: ${user.name}`);
        console.log(`Address: ${user.avax_address}`);
        console.log(`Balance: ${balance} AVAX`);
        console.log('---');
      } catch (err) {
        console.error(`Error checking balance for user ${user.id}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Error checking user wallets:', error.message);
  }
}

// Run the main function
main();
