const axios = require('axios');

const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Test123!'
};

async function createTestUser() {
  try {
    console.log('Creating test user...');
    const response = await axios.post('http://localhost:5002/api/auth/register', testUser);
    console.log('User created successfully:', response.data);
  } catch (error) {
    if (error.response?.data?.message === 'User already exists with this email') {
      console.log('Test user already exists, trying to login...');
      try {
        const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
          email: testUser.email,
          password: testUser.password
        });
        console.log('Login successful:', loginResponse.data);
      } catch (loginError) {
        console.error('Login failed:', loginError.response?.data || loginError.message);
      }
    } else {
      console.error('Registration failed:', error.response?.data || error.message);
    }
  }
}

createTestUser();