/**
 * Utility script to create an admin user through the API
 * 
 * This script uses axios to create a new admin user by making a direct API call.
 * It requires an existing admin with SUPER_ADMIN privileges to be logged in first.
 */

const axios = require('axios');
require('dotenv').config();

// Base URL for API
const API_URL = process.env.API_URL || 'http://localhost:3001/api';

// Function to create a new admin user
async function createAdmin(username, email, password, role = 'ADMIN') {
  try {
    // Create axios instance with detailed error logging
    const api = axios.create({
      baseURL: API_URL
    });
    
    // Debug information
    console.log(`Using API URL: ${API_URL}`);
    
    // First, login as an existing SUPER_ADMIN
    console.log('Logging in as SUPER_ADMIN...');
    console.log('Login payload:', { username: 'admin', password: 'admin123' });
    
    try {
      const loginResponse = await api.post('/admin/login', {
        username: 'admin',  // Changed from email to username based on adminLoginRules
        password: 'admin123'
      });
      
      console.log('Login response:', loginResponse.data);
      
      if (!loginResponse || !loginResponse.data || !loginResponse.data.token) {
        console.error('Failed to login as SUPER_ADMIN - no token in response');
        return;
      }
      
      console.log('Successfully logged in as SUPER_ADMIN');
      
      // Set the auth token for subsequent API calls
      const token = loginResponse.data.token;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Create the new admin user
      console.log(`Creating new admin user: ${username}...`);
      const adminData = {
        username,
        email,
        password,
        role
      };
      
      console.log('Admin creation payload:', adminData);
      
      const response = await api.post('/admin/create', adminData);
      
      console.log('Admin user created successfully:');
      console.log(response.data);
      
      return response.data;
    } catch (loginError) {
      console.error('Login error details:', {
        status: loginError.response?.status,
        statusText: loginError.response?.statusText,
        data: loginError.response?.data,
        message: loginError.message
      });
      throw loginError;
    }
  } catch (error) {
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node create-admin-api.js <username> <email> <password> [role]');
  console.log('Example: node create-admin-api.js admin2 admin2@trueid.gov SecurePass123 SUPER_ADMIN');
  process.exit(1);
}

const username = args[0];
const email = args[1];
const password = args[2];
const role = args[3] || 'ADMIN';

// Call the function with command line arguments
createAdmin(username, email, password, role)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
