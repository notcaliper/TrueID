/**
 * Script to generate an Avalanche Fuji Testnet wallet
 * This creates a new wallet and displays the address and private key
 */
const ethers = require('ethers');
require('dotenv').config();

/**
 * Generate a new random wallet for Avalanche Fuji Testnet
 */
function generateTestnetWallet() {
  try {
    // Create a random wallet
    const wallet = ethers.Wallet.createRandom();
    
    console.log('\n=== Avalanche Fuji Testnet Wallet ===');
    console.log('Address:     ', wallet.address);
    console.log('Private Key: ', wallet.privateKey);
    console.log('\nIMPORTANT: Save your private key securely. If lost, you cannot recover your wallet!');
    console.log('\nTo fund this wallet with test AVAX:');
    console.log('1. Visit the Avalanche Fuji Testnet Faucet: https://faucet.avax.network/');
    console.log('2. Enter your wallet address');
    console.log('3. Complete the captcha and request test AVAX');
    console.log('\nTo check your balance:');
    console.log(`https://testnet.snowtrace.io/address/${wallet.address}`);
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  } catch (error) {
    console.error('Error generating wallet:', error);
    throw error;
  }
}

// Execute the function
generateTestnetWallet();
