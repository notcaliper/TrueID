/**
 * Script to generate an Ethereum Sepolia Testnet wallet
 * This creates a new wallet and displays the address and private key
 */
const ethers = require('ethers');
require('dotenv').config();

/**
 * Generate a new random wallet for Ethereum Sepolia Testnet
 */
function generateTestnetWallet() {
  try {
    // Create a random wallet
    const wallet = ethers.Wallet.createRandom();
    
    console.log('\n=== Ethereum Sepolia Testnet Wallet ===');
    console.log('Address:     ', wallet.address);
    console.log('Private Key: ', wallet.privateKey);
    console.log('\nIMPORTANT: Save your private key securely. If lost, you cannot recover your wallet!');
    console.log('\nTo fund this wallet with test Sepolia ETH:');
    console.log('1. Visit the Sepolia Faucet: https://sepoliafaucet.com/ or https://cloud.google.com/application/web3/faucet/ethereum/sepolia');
    console.log('2. Enter your wallet address');
    console.log('3. Request test ETH');
    console.log('\nTo check your balance:');
    console.log(`https://sepolia.etherscan.io/address/${wallet.address}`);
    
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
