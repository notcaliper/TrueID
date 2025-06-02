import axios from 'axios';

// Development mode flag - set to false to use actual API calls
const DEV_MODE = false;

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

// Mock data for development
const mockData = {
  user: {
    id: 'mock-user-id',
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
    walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    verified: true,
    createdAt: new Date().toISOString()
  },
  tokens: {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token'
  },
  verificationStatus: {
    status: 'VERIFIED',
    updatedAt: new Date().toISOString()
  },
  blockchainStatus: {
    isOnBlockchain: true,
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    contractAddress: '0x266B577380aE3De838A66DEf28fffD5e75c5816E',
    transferredAt: new Date().toISOString()
  },
  professionalRecords: [
    {
      id: 'record-1',
      title: 'Medical License',
      organization: 'Medical Council',
      description: 'General Practitioner License',
      issuedDate: '2023-01-15',
      expiryDate: '2028-01-15',
      verified: true,
      on_blockchain: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'record-2',
      title: 'Specialist Certification',
      organization: 'Medical Board',
      description: 'Cardiology Specialist',
      issuedDate: '2023-03-20',
      expiryDate: '2028-03-20',
      verified: true,
      on_blockchain: false,
      createdAt: new Date().toISOString()
    }
  ],
  walletBalance: '10.5',
  biometricStatus: {
    verified: true,
    lastVerified: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    facemeshExists: true,
    facialMatchScore: 0.92,
    livenessScore: 0.95
  },
  transactions: [
    {
      id: 'tx-1',
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      type: 'IDENTITY_TRANSFER',
      status: 'CONFIRMED',
      timestamp: new Date().toISOString()
    }
  ]
};

// Helper function for mock responses
const mockResponse = (data, delay = 500) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ data });
    }, delay);
  });
};

// Auth API calls
export const authAPI = {
  register: (userData) => {
    if (DEV_MODE) {
      console.log('DEV MODE: Mock registration', userData);
      return mockResponse({ user: mockData.user, tokens: mockData.tokens });
    }
    return API.post('/user/register', userData);
  },
  login: (credentials) => {
    if (DEV_MODE) {
      console.log('DEV MODE: Mock login', credentials);
      return mockResponse({ user: mockData.user, tokens: mockData.tokens });
    }
    return API.post('/user/login', credentials);
  },
  refreshToken: (refreshToken) => {
    if (DEV_MODE) {
      console.log('DEV MODE: Mock refresh token');
      return mockResponse({ tokens: mockData.tokens });
    }
    return API.post('/user/refresh-token', { refreshToken });
  },
  verifyBiometric: (verificationData) => {
    if (DEV_MODE) {
      console.log('DEV MODE: Mock biometric verification', verificationData);
      return mockResponse({ verified: true, message: 'Biometric verification successful' });
    }
    return API.post('/user/verify-biometric', verificationData);
  },
};

// User API calls
export const userAPI = {
  getProfile: () => {
    if (DEV_MODE) {
      console.log('DEV MODE: Mock get profile');
      return mockResponse(mockData.user);
    }
    return API.get('/users/profile');
  },
  updateProfile: (profileData) => {
    if (DEV_MODE) {
      console.log('DEV MODE: Mock update profile', profileData);
      return mockResponse({ ...mockData.user, ...profileData });
    }
    return API.put('/users/profile', profileData);
  },
  getVerificationStatus: async () => {
    if (DEV_MODE) {
      console.log('DEV MODE: Mock verification status');
      return mockResponse(mockData.verificationStatus);
    }
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
    if (DEV_MODE) {
      console.log('DEV MODE: Mock add professional record', recordData);
      const newRecord = {
        id: `record-${Date.now()}`,
        ...recordData,
        verified: false,
        on_blockchain: false,
        createdAt: new Date().toISOString()
      };
      return mockResponse(newRecord);
    }
    return API.post('/users/professional-record', recordData);
  },
  getProfessionalRecords: () => {
    if (DEV_MODE) {
      console.log('DEV MODE: Mock get professional records');
      return mockResponse({ records: mockData.professionalRecords });
    }
    return API.get('/users/professional-records');
  },
  updateFacemesh: (facemeshData) => {
    if (DEV_MODE) {
      console.log('DEV MODE: Mock update facemesh', facemeshData);
      return mockResponse({ success: true });
    }
    return API.put('/users/update-facemesh', { facemeshData });
  },
  getBlockchainStatus: () => {
    if (DEV_MODE) {
      console.log('DEV MODE: Mock blockchain status');
      return mockResponse(mockData.blockchainStatus);
    }
    return API.get('/blockchain/status');
  },
  getBiometricStatus: async () => {
    if (DEV_MODE) {
      console.log('DEV MODE: Mock biometric status');
      return mockResponse({
        verified: Math.random() > 0.5, // randomly return verified or not for testing
        lastVerified: new Date().toISOString(),
        facemeshExists: true
      });
    }
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
    if (DEV_MODE) {
      console.log('DEV MODE: Mock transfer to blockchain');
      return mockResponse({
        success: true,
        transactionHash: mockData.blockchainStatus.transactionHash
      });
    }
    return API.post('/blockchain/record');
  },
};

// Blockchain API calls
export const blockchainAPI = {
  getUserTransactions: () => {
    if (DEV_MODE) {
      console.log('DEV MODE: Mock get user transactions');
      return mockResponse({ transactions: mockData.transactions });
    }
    return API.get('/blockchain/transactions');
  },
  getBlockchainStatus: () => {
    if (DEV_MODE) {
      console.log('DEV MODE: Mock blockchain status');
      return mockResponse(mockData.blockchainStatus);
    }
    return API.get('/blockchain/status');
  },
  verifyDocumentHash: (hash) => {
    if (DEV_MODE) {
      console.log('DEV MODE: Mock verify document hash', hash);
      return mockResponse({ verified: true, timestamp: new Date().toISOString() });
    }
    return API.get(`/blockchain/verify/${hash}`);
  },
};

// Wallet API service
export const walletAPI = {
  getWalletBalance: (address) => {
    if (DEV_MODE) {
      console.log('DEV MODE: Mock get wallet balance', address);
      return mockResponse({ balance: mockData.walletBalance });
    }
    return API.get(`/blockchain/wallet/balance/${address}`);
  },
};

export default API;
