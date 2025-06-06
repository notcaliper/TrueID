const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const { Client } = require('pg');
const ethers = require('ethers');

async function main() {
  const txHash = process.argv[2];
  if (!txHash) {
    console.error('Usage: node verifyData.js <transaction_hash>');
    process.exit(1);
  }

  // Setup blockchain provider using Avalanche Fuji Testnet RPC URL
  const rpcUrl = process.env.AVALANCHE_FUJI_RPC_URL;
  let provider;
  if (ethers.providers && ethers.providers.JsonRpcProvider) {
    provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  } else if (ethers.JsonRpcProvider) {
    provider = new ethers.JsonRpcProvider(rpcUrl);
  } else {
    throw new Error('Could not instantiate JsonRpcProvider from ethers');
  }

  console.log(`Fetching blockchain transaction receipt for txHash: ${txHash}`);
  let receipt;
  try {
    receipt = await provider.getTransactionReceipt(txHash);
  } catch (err) {
    console.error('Error fetching transaction receipt:', err);
    process.exit(1);
  }

  if (!receipt) {
    console.error('No transaction receipt found for txHash:', txHash);
    process.exit(1);
  }

  console.log('Blockchain Transaction Receipt:');
  console.log(receipt);

  // Connect to database
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
  } catch (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }

  // Query example: get blockchain transaction hash for user with id = 1
  const userId = 1;
  let userRes;
  try {
    userRes = await client.query(
      'SELECT blockchain_tx_hash, verification_status, created_at as updated_at FROM biometric_data WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
  } catch (err) {
    console.error('Database query error:', err);
    await client.end();
    process.exit(1);
  }

  if (userRes.rows.length === 0) {
    console.error(`No user found with id ${userId}`);
    await client.end();
    process.exit(1);
  }

  const userData = userRes.rows[0];
  console.log(`\nUser Data (id ${userId}):`);
  console.log(userData);

  // Verify that the blockchain_tx_hash from the database matches the provided transaction hash
  if (userData.blockchain_tx_hash && userData.blockchain_tx_hash.toLowerCase() === txHash.toLowerCase()) {
    console.log('\nVerification Success: Database record matches the blockchain transaction.');
  } else {
    console.error('\nVerification Failed: Database record does not match the provided blockchain transaction.');
  }

  await client.end();
}

main();
