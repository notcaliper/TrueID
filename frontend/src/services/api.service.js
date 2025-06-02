import axios from 'axios';

// Create an axios instance with default config
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',  // Updated to use port 5001
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add a request interceptor to include the auth token in requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't already tried to refresh the token
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token available, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Try to refresh the token
        const response = await axios.post(
          '/api/user/refresh-token',
          { refreshToken }
        );
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
        
        // Store the new tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Update the authorization header
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        
        // Retry the original request
        return API(originalRequest);
      } catch (refreshError) {
        // If refresh token is invalid, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => {
    return API.post('/user/register', userData);
  },
  login: (credentials) => {
    return API.post('/user/login', credentials);
  },
  refreshToken: (refreshToken) => {
    return API.post('/user/refresh-token', { refreshToken });
  },
  verifyBiometric: (verificationData) => {
    return API.post('/user/verify-biometric', verificationData);
  },
};

// User API calls
export const userAPI = {
  getProfile: async () => {
    const response = await API.get('/users/profile');
    // Extract user data and ensure wallet address is properly set
    const userData = response.data.user;
    userData.walletAddress = userData.walletAddress || userData.avaxAddress;
    response.data.user = userData;
    return response;
  },
  updateProfile: (profileData) => {
    return API.put('/users/profile', profileData);
  },
  getVerificationStatus: async () => {
    try {
      const response = await API.get('/users/verification-status');
      console.log('API response for verification status:', response);
      return response;
    } catch (error) {
      console.error('Error fetching verification status:', error);
      throw error;
    }
  },
  addProfessionalRecord: (recordData) => {
    return API.post('/users/professional-record', recordData);
  },
  getProfessionalRecords: () => {
    return API.get('/users/professional-records');
  },
  updateFacemesh: (facemeshData) => {
    return API.put('/users/update-facemesh', { facemeshData });
  },
  getBiometricStatus: async () => {
    try {
      const response = await API.get('/users/biometric-status');
      console.log('API response for biometric status:', response);
      return response;
    } catch (error) {
      console.error('Error fetching biometric status:', error);
      throw error;
    }
  },
  transferToBlockchain: () => {
    return API.post('/users/transfer-to-blockchain');
  },
};

// Blockchain API calls
export const blockchainAPI = {
  getUserTransactions: () => {
    return API.get('/blockchain/transactions');
  },
  getBlockchainStatus: () => {
    return API.get('/blockchain/status');
  },
  recordIdentityOnBlockchain: () => {
    return API.post('/blockchain/record');
  },
  getTransactionStatus: (txHash) => {
    return API.get(`/blockchain/transaction/${txHash}`);
  },
  verifyDocumentHash: (hash) => {
    return API.get(`/blockchain/verify/${hash}`);
  },
};

// Wallet API service
export const walletAPI = {
  // Get wallet balance from blockchain service
  getWalletBalance: async (address) => {
    // First get blockchain status to check if wallet exists
    const status = await blockchainAPI.getBlockchainStatus();
    if (!status.data.walletAddress) {
      throw new Error('No wallet address found');
    }
    // Return mock balance for now until backend endpoint is implemented
    return Promise.resolve({
      data: {
        balance: '0.00',
        address: status.data.walletAddress
      }
    });
  },
};

export default API;
