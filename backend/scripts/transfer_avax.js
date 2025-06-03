/**
 * Transfer AVAX script
 * Sends AVAX from one wallet to another on the Avalanche C-Chain Fuji Testnet
 */
require('dotenv').config();
const ethers = require('ethers');
const { Pool } = require('pg');

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
 * Transfer AVAX from admin wallet to user wallet
 * @param {String} toAddress - Recipient wallet address
 * @param {String} amount - Amount of AVAX to send (in AVAX, not wei)
 * @returns {Object} Transaction details
 */
async function transferAVAX(toAddress, amount) {
  try {
    // Get admin wallet private key from environment variables
    const adminPrivateKey = process.env.ADMIN_WALLET_PRIVATE_KEY;
    if (!adminPrivateKey) {
      throw new Error('ADMIN_WALLET_PRIVATE_KEY not defined in environment variables');
    }

    // Initialize provider and wallet
    const provider = initProvider();
    const wallet = new ethers.Wallet(adminPrivateKey, provider);
    
    // Convert AVAX amount to wei
    const amountWei = ethers.utils.parseEther(amount.toString());
    
    // Create transaction
    const tx = {
      to: toAddress,
      value: amountWei,
      gasLimit: 21000, // Standard gas limit for simple transfers
    };
    
    // Send transaction
    const transaction = await wallet.sendTransaction(tx);
    
    // Wait for transaction to be mined
    const receipt = await transaction.wait();
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      fromAddress: wallet.address,
      toAddress,
      amount
    };
  } catch (error) {
    console.error('Error transferring AVAX:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update user's blockchain status after successful transfer
 * @param {Number} userId - User ID
 * @param {Object} txDetails - Transaction details
 * @returns {Boolean} Success status
 */
async function updateUserBlockchainStatus(userId, txDetails) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update user record with blockchain status and expiry time (48 hours from now)
    const updateResult = await client.query(
      `UPDATE users 
       SET blockchain_status = 'PENDING', 
           blockchain_expiry = NOW() + INTERVAL '48 hours',
           blockchain_tx_hash = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, government_id, blockchain_status, blockchain_expiry`,
      [txDetails.transactionHash, userId]
    );
    
    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }
    
    // Log the transaction
    await client.query(
      `INSERT INTO blockchain_transactions 
       (user_id, tx_hash, from_address, to_address, amount, tx_type, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        userId,
        txDetails.transactionHash,
        txDetails.fromAddress,
        txDetails.toAddress,
        txDetails.amount,
        'INITIAL_FUNDING',
        'COMPLETED'
      ]
    );
    
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating user blockchain status:', error);
    return false;
  } finally {
    client.release();
  }
}

// Export functions for use in other modules
module.exports = {
  transferAVAX,
  updateUserBlockchainStatus
};

// If script is run directly, execute example transfer
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node transfer_avax.js <recipient_address> <amount_in_avax>');
    process.exit(1);
  }
  
  const [toAddress, amount] = args;
  
  transferAVAX(toAddress, amount)
    .then(result => {
      console.log('Transfer result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Transfer failed:', error);
      process.exit(1);
    });
}
