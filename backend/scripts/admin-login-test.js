const axios = require('axios');
const bcrypt = require('bcryptjs');

async function testAdminLogin() {
  try {
    // Test login with trueidadmin
    console.log('Testing admin login...');
    const loginResponse = await axios.post('http://localhost:5000/api/admin/login', {
      username: 'superadmin',
      password: 'Admin@123456'
    });

    console.log('Login successful!');
    console.log('Access Token:', loginResponse.data.token);
    console.log('Admin Details:', loginResponse.data.user);

    // Test getting admin profile with the token
    console.log('\nTesting profile access...');
    const profileResponse = await axios.get('http://localhost:5000/api/admin/profile', {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });

    console.log('Profile access successful!');
    console.log('Profile:', profileResponse.data);

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testAdminLogin();
