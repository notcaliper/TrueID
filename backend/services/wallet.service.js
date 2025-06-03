/**
 * Wallet Service
 * Handles Avalanche C-Chain wallet operations
 */
const ethers = require('ethers');

/**
 * Initialize connection to Avalanche Fuji Testnet
 * @returns {ethers.providers.JsonRpcProvider} Provider instance
 */
const initProvider = () => {
  const rpcUrl = process.env.AVALANCHE_FUJI_RPC_URL;
  if (!rpcUrl) {
    throw new Error('AVALANCHE_FUJI_RPC_URL not defined in environment variables');
  }
  return new ethers.providers.JsonRpcProvider(rpcUrl);
};

/**
 * Generate a new random wallet
 * @returns {Object} Object containing wallet address and private key
 */
exports.generateWallet = () => {
  try {
    // Create a random wallet
    const wallet = ethers.Wallet.createRandom();
    
    // Connect wallet to provider (optional, not needed just for address generation)
    const provider = initProvider();
    const connectedWallet = wallet.connect(provider);
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  } catch (error) {
    console.error('Error generating wallet:', error);
    throw new Error('Failed to generate Avalanche wallet');
  }
};

/**
 * Get wallet balance
 * @param {String} address - Wallet address
 * @returns {String} Balance in AVAX
 */
exports.getBalance = async (address) => {
  try {
    const provider = initProvider();
    const balance = await provider.getBalance(address);
    
    // Convert from wei to AVAX (18 decimals)
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    throw new Error('Failed to get wallet balance');
  }
};

/**
 * Validate if an address is a valid Ethereum/Avalanche address
 * @param {String} address - Address to validate
 * @returns {Boolean} True if valid, false otherwise
 */
exports.isValidAddress = (address) => {
  try {
    return ethers.utils.isAddress(address);
  } catch (error) {
    return false;
  }
};

/**
 * Transfer AVAX tokens from admin wallet to user wallet during verification
 * @param {String} toAddress - User's wallet address to receive tokens
 * @param {Number} amount - Amount of AVAX to transfer (default: 0.03)
 * @returns {Object} Transaction details
 */
exports.transferTokens = async (toAddress, amount = 0.03) => {
  try {
    // Validate the destination address
    if (!exports.isValidAddress(toAddress)) {
      throw new Error(`Invalid destination address: ${toAddress}`);
    }
    
    // Get admin private key from environment variables
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) {
      throw new Error('ADMIN_PRIVATE_KEY not found in environment variables');
    }

    // Connect to the Avalanche Fuji Testnet
    const provider = initProvider();
    
    // Create wallet from admin private key
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    
    // Check admin wallet balance
    const adminBalance = await provider.getBalance(adminWallet.address);
    const adminBalanceInAVAX = ethers.utils.formatEther(adminBalance);
    
    // Convert amount to wei (AVAX has 18 decimals)
    const amountInWei = ethers.utils.parseEther(amount.toString());
    
    // Check if admin has enough balance
    if (adminBalance.lt(amountInWei)) {
      throw new Error(`Insufficient balance. Admin has ${adminBalanceInAVAX} AVAX, trying to send ${amount} AVAX`);
    }
    
    // Create transaction
    const tx = {
      to: toAddress,
      value: amountInWei,
      gasLimit: 21000, // Standard gas limit for simple transfers
    };
    
    // Send transaction
    const transaction = await adminWallet.sendTransaction(tx);
    
    // Wait for transaction to be mined
    const receipt = await transaction.wait();
    
    return {
      success: true,
      transactionHash: transaction.hash,
      blockNumber: receipt.blockNumber,
      from: adminWallet.address,
      to: toAddress,
      amount: amount,
      gasUsed: receipt.gasUsed.toString(),
      explorerUrl: `https://testnet.snowtrace.io/tx/${transaction.hash}`
    };
  } catch (error) {
    console.error('Error transferring AVAX tokens:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
