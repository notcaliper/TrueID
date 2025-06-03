/**
 * Script to verify a user and trigger automatic token transfer
 * This uses a direct POST request to the admin API
 */
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

// Configuration
const API_URL = 'http://localhost:3000/api';

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin2',
  password: 'SecurePass123'
};

// Function to login as admin and get token
async function loginAsAdmin() {
  try {
    const response = await axios.post(`${API_URL}/admin/login`, ADMIN_CREDENTIALS);
    return response.data.tokens.accessToken;
  } catch (error) {
    console.error('Admin login failed:', error.response?.data || error.message);
    throw new Error('Failed to login as admin');
  }
}

// Function to verify a user
async function verifyUser(userId, adminToken, transferAmount = 0.03) {
  try {
    const verificationData = {
      verificationStatus: 'VERIFIED',
      verificationNotes: 'Verified by admin via script',
      transferAmount: transferAmount
    };

    const response = await axios.put(
      `${API_URL}/admin/users/${userId}/verify`,
      verificationData,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('User verification failed:', error.response?.data || error.message);
    throw new Error(`Failed to verify user ${userId}`);
  }
}

// Main function
async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  const userId = args[0];
  const transferAmount = args[1] ? parseFloat(args[1]) : 0.03;

  if (!userId) {
    console.error('Error: User ID is required');
    console.log('Usage: node verify_user.js <userId> [transferAmount]');
    process.exit(1);
  }

  try {
    console.log(`Verifying user ${userId} with token transfer of ${transferAmount} AVAX...`);
    
    // Login as admin
    console.log('Logging in as admin...');
    const adminToken = await loginAsAdmin();
    console.log('Admin login successful');
    
    // Verify user
    console.log(`Verifying user ${userId}...`);
    const result = await verifyUser(userId, adminToken, transferAmount);
    
    console.log('\n✅ User verification successful!');
    console.log(`User ID: ${result.user.id}`);
    console.log(`Name: ${result.user.name}`);
    console.log(`Verification Status: ${result.user.verification_status}`);
    
    // Display transaction details if available
    if (result.transaction) {
      console.log('\n💰 Token Transfer Details:');
      if (result.transaction.success) {
        console.log(`Status: Success`);
        console.log(`Amount: ${result.transaction.amount} AVAX`);
        console.log(`Transaction Hash: ${result.transaction.transactionHash}`);
        console.log(`Explorer URL: https://testnet.snowtrace.io/tx/${result.transaction.transactionHash}`);
      } else {
        console.log(`Status: Failed`);
        console.log(`Error: ${result.transaction.error}`);
      }
    }
    
    // Save result to file
    const outputFile = `user_${userId}_verification_result.json`;
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`\nResult saved to ${outputFile}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
