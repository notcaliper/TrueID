/**
 * Wallet Service
 * Handles EVM / Ethereum Sepolia wallet operations
 */
const { ethers } = require('ethers');

/**
 * Initialize connection to Ethereum Sepolia Testnet
 * @returns {ethers.JsonRpcProvider} Provider instance
 */
const initProvider = () => {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    throw new Error('SEPOLIA_RPC_URL environment variable is required');
  }
  return ethers.JsonRpcProvider ? new ethers.JsonRpcProvider(rpcUrl) : new ethers.providers.JsonRpcProvider(rpcUrl);
};

/**
 * Generate a new random EVM wallet
 * @returns {Object} Object containing wallet address and private key
 */
exports.generateWallet = () => {
  try {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  } catch (error) {
    console.error('Error generating wallet:', error);
    throw new Error('Failed to generate wallet');
  }
};

/**
 * Get wallet balance
 * @param {String} address - Wallet address
 * @returns {String} Balance in ETH
 */
exports.getBalance = async (address) => {
  try {
    const provider = initProvider();
    const balance = await provider.getBalance(address);
    return ethers.formatEther ? ethers.formatEther(balance) : ethers.utils.formatEther(balance);
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    throw new Error('Failed to get wallet balance');
  }
};

/**
 * Validate if an address is a valid Ethereum address
 * @param {String} address - Address to validate
 * @returns {Boolean} True if valid, false otherwise
 */
exports.isValidAddress = (address) => {
  try {
    return ethers.isAddress ? ethers.isAddress(address) : ethers.utils.isAddress(address);
  } catch (error) {
    return false;
  }
};

/**
 * Transfer ETH tokens from admin wallet to user wallet during verification
 * @param {String} toAddress - User's wallet address to receive tokens
 * @param {Number} amount - Amount of ETH to transfer (default: 0.005)
 * @returns {Object} Transaction details
 */
exports.transferTokens = async (toAddress, amount = 0.005) => {
  try {
    if (!exports.isValidAddress(toAddress)) {
      throw new Error(`Invalid destination address: ${toAddress}`);
    }
    
    const adminPrivateKey = process.env.ADMIN_WALLET_PRIVATE_KEY;
    if (!adminPrivateKey) {
      throw new Error('ADMIN_WALLET_PRIVATE_KEY environment variable is required');
    }

    const provider = initProvider();
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    
    const adminBalance = await provider.getBalance(adminWallet.address);
    const parseEther = ethers.parseEther || ethers.utils.parseEther;
    const formatEther = ethers.formatEther || ethers.utils.formatEther;
    const amountInWei = parseEther(amount.toString());
    
    const adminBalanceBigInt = BigInt(adminBalance.toString());
    const amountBigInt = BigInt(amountInWei.toString());
    
    if (adminBalanceBigInt < amountBigInt) {
      throw new Error(`Insufficient balance. Admin has ${formatEther(adminBalance)} ETH, trying to send ${amount} ETH`);
    }
    
    const tx = {
      to: toAddress,
      value: amountInWei
    };
    
    const transaction = await adminWallet.sendTransaction(tx);
    const receipt = await transaction.wait(1);
    
    return {
      success: true,
      transactionHash: transaction.hash,
      blockNumber: receipt.blockNumber,
      from: adminWallet.address,
      to: toAddress,
      amount: amount,
      gasUsed: receipt.gasUsed.toString(),
      explorerUrl: `https://sepolia.etherscan.io/tx/${transaction.hash}`
    };
  } catch (error) {
    console.error('Error transferring ETH tokens:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
