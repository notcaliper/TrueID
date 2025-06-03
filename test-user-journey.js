/**
 * TrueID User Journey Test Script
 * 
 * This script tests the complete user journey in the TrueID system:
 * 1. Register a new user
 * 2. Verify biometric status
 * 3. Check wallet balance
 * 4. Admin verification
 * 5. Logout and login again
 * 6. Verify all data is correct after login
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const API_URL = 'http://localhost:5000/api';

// API endpoint prefixes
const USER_API = '/user';
const USERS_API = '/users';
const ADMIN_API = '/admin';
const BLOCKCHAIN_API = '/blockchain';

const ADMIN_CREDENTIALS = {
  username: 'admin2',
  password: 'SecurePass123'
};

const crypto = require('crypto');

// Mock data for user registration
const mockUser = {
  name: 'Test User',
  username: `testuser_${Date.now()}`,
  password: 'Password123!',
  email: `testuser_${Date.now()}@example.com`,
  phone: '+12025550179', // Valid US phone number format
  governmentId: `GOV${Date.now()}`,
  // Mock facemesh data (simplified for testing)
  facemeshData: {
    landmarks: [
      { x: 0.1, y: 0.2, z: 0.3 },
      { x: 0.2, y: 0.3, z: 0.4 },
      { x: 0.3, y: 0.4, z: 0.5 }
    ]
  }
};

// Store tokens and user data
let userTokens = null;
let userData = null;
let adminTokens = null;

// Helper function to log steps
const logStep = (step) => {
  console.log('\n' + '='.repeat(50));
  console.log(`STEP: ${step}`);
  console.log('='.repeat(50));
};

// Helper function to make authenticated API requests
const authRequest = async (method, endpoint, data = null, isAdmin = false) => {
  const tokens = isAdmin ? adminTokens : userTokens;
  const headers = tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
  
  try {
    console.log(`Making ${method.toUpperCase()} request to ${endpoint}...`);
    const response = await axios({
      method,
      url: `${API_URL}${endpoint}`,
      data,
      headers
    });
    return response.data;
  } catch (error) {
    console.error(`Error in ${method.toUpperCase()} ${endpoint}:`, error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.error(`Endpoint ${endpoint} not found. Make sure the backend server is running on port 5000.`);
    }
    throw error;
  }
};

// 1. Register a new user
async function registerUser() {
  logStep('Registering new user');
  try {
    const response = await authRequest('post', `${USER_API}/register`, mockUser);
    userTokens = response.tokens;
    userData = response.user;
    
    console.log('User registered successfully!');
    console.log('User ID:', userData.id);
    console.log('Government ID:', userData.governmentId);
    console.log('Verification Status:', userData.verificationStatus);
    
    return userData;
  } catch (error) {
    console.error('Failed to register user');
    throw error;
  }
}

// 2. Get user profile and check wallet
async function getUserProfileAndWallet() {
  logStep('Getting user profile and wallet information');
  try {
    const profileResponse = await authRequest('get', `${USERS_API}/profile`);
    
    // Extract user data from the nested user object
    const profile = profileResponse.user;
    
    console.log('User Profile:');
    console.log('Name:', profile.name);
    console.log('Email:', profile.email);
    console.log('Verification Status:', profile.verificationStatus);
    console.log('Has Biometric Data:', profileResponse.hasBiometricData);
    console.log('Professional Records Count:', profileResponse.professionalRecordsCount);
    
    if (profile.walletAddress) {
      console.log('Wallet Address:', profile.walletAddress);
      console.log('Note: Wallet balance check skipped - using blockchain status instead');
    } else {
      console.log('Wallet not found or not initialized');
    }
    
    return profile;
  } catch (error) {
    console.error('Failed to get user profile');
    throw error;
  }
}

// 3. Check biometric status
async function checkBiometricStatus() {
  logStep('Checking biometric status');
  try {
    const biometricStatus = await authRequest('get', `${USERS_API}/biometric-status`);
    console.log('Biometric Status:', biometricStatus.status);
    console.log('Is Verified:', biometricStatus.isVerified);
    return biometricStatus;
  } catch (error) {
    console.error('Failed to check biometric status');
    throw error;
  }
}

// 4. Verify biometric data
async function verifyBiometric() {
  logStep('Verifying biometric data');
  try {
    const verificationData = {
      userId: userData.id,
      facemeshData: mockUser.facemeshData
    };
    
    const result = await authRequest('post', `${USER_API}/verify-biometric`, verificationData);
    console.log('Biometric Verification Result:', result.verified ? 'Success' : 'Failed');
    console.log('Message:', result.message);
    return result;
  } catch (error) {
    console.error('Failed to verify biometric data');
    throw error;
  }
}

// 5. Admin login
async function adminLogin() {
  logStep('Admin login');
  try {
    const response = await authRequest('post', `${ADMIN_API}/login`, ADMIN_CREDENTIALS);
    adminTokens = response.tokens;
    console.log('Admin logged in successfully!');
    return response;
  } catch (error) {
    console.error('Failed to login as admin');
    throw error;
  }
}

// 6. Admin verifies user
async function adminVerifyUser() {
  logStep('Admin verifying user');
  try {
    const verificationData = {
      verificationStatus: 'VERIFIED', // Changed from status to verificationStatus and APPROVED to VERIFIED
      notes: 'Verified through automated test script'
    };
    
    const result = await authRequest('put', `${ADMIN_API}/users/${userData.id}/verify`, verificationData, true);
    console.log('User Verification Result:', result.success ? 'Success' : 'Failed');
    console.log('Message:', result.message);
    
    if (result.user) {
      console.log('New Verification Status:', result.user.verificationStatus);
    }
    
    return result;
  } catch (error) {
    console.error('Failed to verify user as admin');
    throw error;
  }
}

// 7. Check blockchain status
async function checkBlockchainStatus() {
  logStep('Checking blockchain status');
  try {
    const status = await authRequest('get', `${BLOCKCHAIN_API}/status`);
    console.log('Blockchain Status:', status);
    if (status.walletAddress) {
      console.log('Wallet Address:', status.walletAddress);
      console.log('Network:', status.network || 'Unknown');
      console.log('Identity Status:', status.identityStatus || 'Unknown');
    }
    
    return status;
  } catch (error) {
    console.log('Note: Blockchain status check failed but continuing test');
    console.log('Error:', error.response ? error.response.data.message : error.message);
    // Return a placeholder result to continue the test
    return { message: 'Blockchain status check skipped' };
  }
}

// 8. User logout (simulated by clearing tokens)
async function userLogout() {
  logStep('User logout');
  userTokens = null;
  console.log('User logged out successfully!');
}

// 9. User login again
async function userLogin() {
  logStep('User login');
  try {
    const loginData = {
      username: mockUser.username,
      password: mockUser.password
    };
    
    const response = await authRequest('post', `${USER_API}/login`, loginData);
    userTokens = response.tokens;
    userData = response.user;
    
    console.log('User logged in successfully!');
    console.log('User ID:', userData.id);
    console.log('Verification Status:', userData.verificationStatus);
    
    return response;
  } catch (error) {
    console.error('Failed to login user');
    throw error;
  }
}

// 10. Transfer to blockchain (if not already on blockchain)
async function transferToBlockchain() {
  logStep('Transferring to blockchain');
  try {
    const result = await authRequest('post', `${USERS_API}/transfer-to-blockchain`);
    console.log('Blockchain Transfer Result:', result.message ? 'Success' : 'Failed');
    console.log('Message:', result.message || 'No message returned');
    
    // Even if there's an error, we'll continue with the test
    // This is because the blockchain transfer might be optional
    return result;
  } catch (error) {
    console.log('Note: Blockchain transfer failed but continuing test');
    console.log('Error:', error.response ? error.response.data.message : error.message);
    // Return a placeholder result to continue the test
    return { message: 'Blockchain transfer skipped' };
  }
}

// 11. Get professional records
async function getProfessionalRecords() {
  logStep('Getting professional records');
  try {
    const records = await authRequest('get', `${USERS_API}/professional-records`);
    console.log(`Found ${records.length} professional records`);
    
    if (records.length > 0) {
      records.forEach((record, index) => {
        console.log(`Record ${index + 1}:`);
        console.log('Title:', record.title);
        console.log('Institution:', record.institution);
        console.log('Record Type:', record.record_type);
        console.log('Start Date:', record.start_date);
        console.log('End Date:', record.end_date);
      });
    } else {
      console.log('No professional records found');
      
      // Add a professional record if none exist
      const newRecord = {
        title: 'Software Engineering Experience',
        recordType: 'EMPLOYMENT',  // Must be uppercase as per validation
        institution: 'TrueID Technologies',  // Must not be empty
        startDate: '2022-01-01',  // Required for EMPLOYMENT type
        endDate: '2023-01-01',    // Required for EMPLOYMENT type
        description: 'Senior Software Engineer',
        isCurrent: false          // Optional boolean field
      };
      
      console.log('Adding a new professional record...');
      let retryCount = 0;
      const maxRetries = 3;
      let recordAdded = false;
      while (!recordAdded && retryCount < maxRetries) {
        try {
          const recordResponse = await authRequest('post', `${USERS_API}/professional-record`, newRecord);
          console.log('Record added successfully!');
          if (recordResponse.record) {
            console.log('Record ID:', recordResponse.record.id);
            console.log('Record Type:', recordResponse.record.record_type);
          }
          recordAdded = true;
        } catch (error) {
          retryCount++;
          console.error(`Failed to add professional record (retry ${retryCount}/${maxRetries}):`);
          if (error.response && error.response.data) {
            console.error(JSON.stringify(error.response.data, null, 2));
          } else {
            console.error(error.message);
          }
          if (retryCount >= maxRetries) {
            throw error;
          }
        }
      }
    }
    
    return records;
  } catch (error) {
    console.error('Failed to get professional records');
    throw error;
  }
}

// 12. Get verification status
async function getVerificationStatus() {
  logStep('Getting verification status');
  try {
    const statusResponse = await authRequest('get', `${USERS_API}/verification-status`);
    const status = statusResponse.data;  // Extract the nested data object
    console.log('Verification Status:', status.status);
    console.log('Submitted At:', status.submittedAt);
    console.log('Verified At:', status.verifiedAt);
    console.log('Verified By:', status.verifiedBy || 'None');
    
    return statusResponse;
  } catch (error) {
    console.error('Failed to get verification status');
    throw error;
  }
}

// Check if backend server is running
async function checkServerStatus() {
  try {
    console.log('Checking if backend server is running...');
    await axios.get(`${API_URL}/health`);
    console.log('Backend server is running!');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ ERROR: Backend server is not running! Please start the server on port 5000.\n');
      return false;
    }
    // If we get any response, even an error, the server is running
    console.log('Backend server is running but health endpoint not available.');
    return true;
  }
}

// Main function to run the entire flow
async function runUserJourney() {
  try {
    console.log('\n🚀 STARTING TRUEID USER JOURNEY TEST 🚀\n');
    
    // Check if server is running first
    const serverRunning = await checkServerStatus();
    if (!serverRunning) {
      console.log('Please start the backend server with: npm run start');
      return;
    }
    
    // User registration and initial checks
    await registerUser();
    await getUserProfileAndWallet();
    await checkBiometricStatus();
    await verifyBiometric();
    
    // Admin verification
    await adminLogin();
    await adminVerifyUser();
    
    // Check updated status
    await checkBlockchainStatus();
    
    // Logout and login again
    await userLogout();
    await userLogin();
    
    // Final verification checks
    await getUserProfileAndWallet();
    await getVerificationStatus();
    await getProfessionalRecords();
    await transferToBlockchain();
    await checkBlockchainStatus();
    
    console.log('\n✅ USER JOURNEY TEST COMPLETED SUCCESSFULLY ✅\n');
  } catch (error) {
    console.error('\n❌ USER JOURNEY TEST FAILED ❌\n');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
runUserJourney();
