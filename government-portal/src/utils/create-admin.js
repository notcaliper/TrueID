/**
 * Utility script to create an admin user through the API
 * 
 * This script uses the ApiService to create a new admin user by making a direct API call.
 * It requires an existing admin with SUPER_ADMIN privileges to be logged in first.
 */

import ApiService from '../services/ApiService';

// Function to create a new admin user
async function createAdmin(username, email, password, role = 'ADMIN') {
  try {
    // First, login as an existing SUPER_ADMIN
    console.log('Logging in as SUPER_ADMIN...');
    const loginResponse = await ApiService.login('admin@dbis.gov', 'admin123');
    
    if (!loginResponse || !loginResponse.token) {
      console.error('Failed to login as SUPER_ADMIN');
      return;
    }
    
    console.log('Successfully logged in as SUPER_ADMIN');
    
    // Set the auth token for subsequent API calls
    ApiService.setAuthToken(loginResponse.token);
    
    // Create the new admin user
    console.log(`Creating new admin user: ${username}...`);
    const adminData = {
      username,
      email,
      password,
      role
    };
    
    const response = await ApiService.createAdmin(adminData);
    
    console.log('Admin user created successfully:');
    console.log(response);
    
    return response;
  } catch (error) {
    console.error('Error creating admin user:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage:
// createAdmin('newadmin', 'newadmin@trueid.gov', 'securepassword', 'ADMIN');

export default createAdmin;
