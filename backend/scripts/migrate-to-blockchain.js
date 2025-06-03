/**
 * Migration script to prepare data for transferring existing user data to the blockchain
 * 
 * This script fetches users from the database who have wallet addresses
 * but haven't been registered on the blockchain yet, and generates the necessary
 * transaction data for them to register their identity on the Avalanche Fuji Testnet.
 */
const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ethers = require('ethers');

// Load the IdentityManagement ABI from the correct path
let IdentityManagementABI;
try {
  // Try the artifacts path first
  IdentityManagementABI = require('../blockchain/artifacts/blockchain/contracts/IdentityManagement.sol/IdentityManagement.json').abi;
} catch (error) {
  try {
    // Try the src path as fallback
    IdentityManagementABI = require('../src/blockchain/contracts/abi/IdentityManagement.json');
  } catch (error) {
    console.error('Error loading IdentityManagement ABI:', error);
    process.exit(1);
  }
}

require('dotenv').config();

// Initialize PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Function to generate a hash for professional records
const generateProfessionalDataHash = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT id, record_type, institution, title, start_date, end_date
       FROM professional_records
       WHERE user_id = $1
       ORDER BY start_date DESC`,
      [userId]
    );

    if (result.rows.length === 0) {
      // If no professional records, use a placeholder hash
      return crypto.createHash('sha256').update(`user_${userId}_no_records`).digest('hex');
    }

    // Concatenate all professional record data and hash it
    const recordsData = result.rows.map(record => 
      `${record.id}:${record.record_type}:${record.institution}:${record.title}:${record.start_date}:${record.end_date || 'current'}`
    ).join('|');

    return crypto.createHash('sha256').update(recordsData).digest('hex');
  } catch (error) {
    console.error('Error generating professional data hash:', error);
    throw error;
  }
};

// Function to prepare transaction data for a single user
const prepareUserTransactionData = async (user) => {
  try {
    console.log(`Preparing transaction data for user ${user.id} (${user.name})...`);

    // Get user's biometric data
    const biometricResult = await pool.query(
      'SELECT id, facemesh_hash FROM biometric_data WHERE user_id = $1 AND is_active = true',
      [user.id]
    );

    if (biometricResult.rows.length === 0) {
      console.log(`Skipping user ${user.id}: No active biometric data found`);
      return null;
    }

    const biometricData = biometricResult.rows[0];
    
    // Generate professional data hash
    const professionalDataHash = await generateProfessionalDataHash(user.id);

    // Convert hashes to bytes32
    const biometricHashBytes = ethers.utils.id(biometricData.facemesh_hash);
    const professionalDataHashBytes = ethers.utils.id(professionalDataHash);

    // Get contract ABI and address
    const contractAddress = process.env.AVALANCHE_FUJI_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('AVALANCHE_FUJI_CONTRACT_ADDRESS not found in environment variables');
    }

    // Create contract interface
    const contractInterface = new ethers.utils.Interface(IdentityManagementABI);

    // Encode function data for createIdentity
    const encodedData = contractInterface.encodeFunctionData('createIdentity', [
      biometricHashBytes,
      professionalDataHashBytes
    ]);

    // Create transaction data
    const transactionData = {
      userId: user.id,
      name: user.name,
      walletAddress: user.avax_address,
      biometricId: biometricData.id,
      biometricHash: biometricData.facemesh_hash,
      professionalDataHash: professionalDataHash,
      contractAddress: contractAddress,
      encodedData: encodedData,
      network: 'avalanche_fuji',
      chainId: 43113, // Avalanche Fuji Testnet Chain ID
      instructions: [
        'This transaction will register your identity on the Avalanche Fuji Testnet.',
        'To execute this transaction:',
        '1. Connect your wallet to the Avalanche Fuji Testnet',
        '2. Send a transaction to the contract address with the provided data',
        '3. After the transaction is confirmed, notify the TrueID system administrator'
      ]
    };

    // Save transaction data to a file
    const outputDir = path.join(__dirname, '../data/transactions');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `user_${user.id}_transaction.json`);
    fs.writeFileSync(outputFile, JSON.stringify(transactionData, null, 2));

    console.log(`Transaction data for user ${user.id} saved to ${outputFile}`);
    return transactionData;
  } catch (error) {
    console.error(`Error preparing transaction data for user ${user.id}:`, error);
    return null;
  }
};

// Main function to prepare transaction data for all users
const prepareTransactionData = async () => {
  const client = await pool.connect();
  
  try {
    // Get users with wallet addresses but no blockchain transaction
    const usersResult = await client.query(`
      SELECT u.id, u.name, u.avax_address, u.is_verified 
      FROM users u
      LEFT JOIN blockchain_transactions bt ON u.id = bt.user_id
      WHERE u.avax_address IS NOT NULL 
      AND u.avax_address != '' 
      AND bt.id IS NULL
    `);

    console.log(`Found ${usersResult.rows.length} users to prepare transaction data for`);

    // Process each user
    const results = [];
    for (const user of usersResult.rows) {
      const result = await prepareUserTransactionData(user);
      if (result) {
        results.push({
          userId: user.id,
          name: user.name,
          walletAddress: user.avax_address,
          transactionFile: `user_${user.id}_transaction.json`
        });
      }
    }

    // Generate summary file
    const summaryFile = path.join(__dirname, '../data/transactions/summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify({
      totalUsers: usersResult.rows.length,
      preparedTransactions: results.length,
      timestamp: new Date().toISOString(),
      users: results
    }, null, 2));

    console.log('Transaction data preparation summary:');
    console.log(`Total users processed: ${usersResult.rows.length}`);
    console.log(`Successfully prepared: ${results.length}`);
    console.log(`Failed preparations: ${usersResult.rows.length - results.length}`);
    console.log(`Summary saved to: ${summaryFile}`);

    return results;
  } catch (error) {
    console.error('Transaction data preparation failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Create a script to verify and record transactions after they're executed
const createVerificationScript = () => {
  const verificationScriptPath = path.join(__dirname, '../data/transactions/verify-transactions.js');
  const scriptContent = `/**
 * Script to verify and record blockchain transactions after they've been executed by users
 */
const { Pool } = require('pg');
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Initialize blockchain provider
const provider = new ethers.providers.JsonRpcProvider(process.env.AVALANCHE_FUJI_RPC_URL);

// Function to verify a transaction
const verifyTransaction = async (transactionHash, userId) => {
  try {
    console.log(\`Verifying transaction \${transactionHash} for user \${userId}...\`);
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(transactionHash);
    if (!receipt) {
      console.log(\`Transaction \${transactionHash} not found\`);
      return false;
    }
    
    // Verify transaction status
    if (receipt.status !== 1) {
      console.log(\`Transaction \${transactionHash} failed\`);
      return false;
    }
    
    // Get user's biometric data
    const biometricResult = await pool.query(
      'SELECT id FROM biometric_data WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    
    if (biometricResult.rows.length === 0) {
      console.log(\`No active biometric data found for user \${userId}\`);
      return false;
    }
    
    const biometricData = biometricResult.rows[0];
    
    // Update biometric data with blockchain transaction hash
    await pool.query(
      'UPDATE biometric_data SET blockchain_tx_hash = $1, blockchain_network = $2 WHERE id = $3',
      [transactionHash, 'avalanche_fuji', biometricData.id]
    );
    
    // Record transaction in database
    await pool.query(
      \`INSERT INTO blockchain_transactions 
         (user_id, transaction_type, transaction_hash, block_number, status, network, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)\`,
      [
        userId,
        'IDENTITY_REGISTRATION',
        transactionHash,
        receipt.blockNumber,
        'SUCCESS',
        'avalanche_fuji',
        JSON.stringify({
          transactionHash: transactionHash,
          blockNumber: receipt.blockNumber,
          status: 'SUCCESS',
          network: 'avalanche_fuji'
        })
      ]
    );
    
    console.log(\`Successfully verified and recorded transaction \${transactionHash} for user \${userId}\`);
    return true;
  } catch (error) {
    console.error(\`Error verifying transaction \${transactionHash} for user \${userId}:\`, error);
    return false;
  }
};

// Main function
const main = async () => {
  if (process.argv.length < 4) {
    console.log('Usage: node verify-transactions.js <transaction_hash> <user_id>');
    process.exit(1);
  }
  
  const transactionHash = process.argv[2];
  const userId = process.argv[3];
  
  try {
    const success = await verifyTransaction(transactionHash, userId);
    if (success) {
      console.log('Transaction verification completed successfully');
      process.exit(0);
    } else {
      console.error('Transaction verification failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run the main function
main();
`;

  fs.writeFileSync(verificationScriptPath, scriptContent);
  console.log(`Verification script created at ${verificationScriptPath}`);
};

// Run the transaction data preparation
prepareTransactionData()
  .then(results => {
    console.log('Transaction data preparation completed successfully');
    createVerificationScript();
    console.log('\nTo transfer existing data to blockchain:');
    console.log('1. Share the transaction files with users');
    console.log('2. Users need to execute the transactions using their wallets');
    console.log('3. After a transaction is confirmed, run:');
    console.log('   node data/transactions/verify-transactions.js <transaction_hash> <user_id>');
    process.exit(0);
  })
  .catch(error => {
    console.error('Transaction data preparation failed:', error);
    process.exit(1);
  });
