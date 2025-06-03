/**
 * Simple script to test the connection to the TrueID backend API
 */
const axios = require('axios');

const testBackendConnection = async () => {
  try {
    console.log('Testing connection to backend API...');
    const response = await axios.get('http://localhost:5000/api/test/ping');
    console.log('✅ Connection successful!');
    console.log('Response:', response.data);
    
    console.log('\nTesting API status endpoint...');
    const statusResponse = await axios.get('http://localhost:5000/api/test/status');
    console.log('✅ Status endpoint successful!');
    console.log('Status:', statusResponse.data);
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Run the test
testBackendConnection();
