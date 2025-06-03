/**
 * Script to test user verification with token transfer using POST request
 */
require('dotenv').config();
const axios = require('axios');

// Admin credentials from environment variables
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

// User ID to verify (can be passed as command line argument)
const userId = process.argv[2] || '1';

// Token transfer amount (can be passed as command line argument)
const transferAmount = process.argv[3] ? parseFloat(process.argv[3]) : 0.03;

// Base URL
const baseUrl = process.env.API_URL || 'http://localhost:3000/api';

async function verifyUser() {
  try {
    console.log(`Attempting to verify user ID: ${userId} with ${transferAmount} AVAX`);
    
    // Step 1: Login as admin to get token
    console.log('Logging in as admin...');
    const loginResponse = await axios.post(`${baseUrl}/admin/login`, {
      username: adminUsername,
      password: adminPassword
    });
    
    const token = loginResponse.data.token;
    console.log('Admin login successful, token received');
    
    // Step 2: Verify the user using POST request
    console.log(`Verifying user ${userId} with token transfer...`);
    const verifyResponse = await axios.post(
      `${baseUrl}/admin/users/${userId}/verify`, 
      {
        verificationStatus: 'VERIFIED',
        verificationNotes: 'Verified by admin script with automatic token transfer',
        transferAmount: transferAmount
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('Verification response:', JSON.stringify(verifyResponse.data, null, 2));
    
    if (verifyResponse.data.transaction) {
      console.log('\nTransaction Details:');
      console.log('-------------------');
      console.log(`Success: ${verifyResponse.data.transaction.success}`);
      console.log(`Amount: ${verifyResponse.data.transaction.amount} AVAX`);
      
      if (verifyResponse.data.transaction.transactionHash) {
        console.log(`Transaction Hash: ${verifyResponse.data.transaction.transactionHash}`);
        console.log(`Explorer URL: https://testnet.snowtrace.io/tx/${verifyResponse.data.transaction.transactionHash}`);
      }
      
      if (!verifyResponse.data.transaction.success) {
        console.log(`Error: ${verifyResponse.data.transaction.error}`);
      }
    } else {
      console.log('No transaction details in response');
    }
    
    console.log('\nUser verification completed successfully');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the verification
verifyUser();
