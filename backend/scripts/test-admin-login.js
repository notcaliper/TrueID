/**
 * Script to test admin login using credentials
 * This makes a direct POST request to the login endpoint
 */

const axios = require('axios');
require('dotenv').config();

// Base URL for API
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function testAdminLogin(username, password) {
  try {
    console.log(`Testing login for admin user: ${username}`);
    console.log(`Using API URL: ${API_URL}`);
    
    // Create axios instance
    const api = axios.create({
      baseURL: API_URL
    });
    
    // Attempt login
    console.log('Sending login request...');
    console.log('Login payload:', { username, password: '*'.repeat(password.length) });
    
    const loginResponse = await api.post('/admin/login', {
      username,
      password
    });
    
    console.log('\nLogin successful!');
    console.log('Status:', loginResponse.status);
    console.log('Response data:', JSON.stringify(loginResponse.data, null, 2));
    
    // If login successful, try to fetch admin profile
    if (loginResponse.data && loginResponse.data.token) {
      console.log('\nTesting profile access with token...');
      
      // Set the auth token for subsequent API calls
      api.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.token}`;
      
      try {
        const profileResponse = await api.get('/admin/profile');
        console.log('\nProfile access successful!');
        console.log('Profile data:', JSON.stringify(profileResponse.data, null, 2));
      } catch (profileError) {
        console.error('\nError accessing profile:', {
          status: profileError.response?.status,
          statusText: profileError.response?.statusText,
          data: profileError.response?.data,
          message: profileError.message
        });
      }
    }
    
    return loginResponse.data;
  } catch (error) {
    console.error('Login error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}

// Get command line arguments or use defaults
const args = process.argv.slice(2);
const username = args[0] || 'admin2';
const password = args[1] || 'SecurePass123';

// Run the test
testAdminLogin(username, password)
  .then(() => console.log('\nTest completed'))
  .catch(() => console.log('\nTest failed'));
