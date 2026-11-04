/**
 * TrueID API Service
 * Production REST client connecting frontend directly to TrueID backend
 */

import axios from 'axios';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create configured axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = 
      localStorage.getItem('accessToken') || 
      localStorage.getItem('authToken') || 
      localStorage.getItem('token');
      
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for automatic token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/user/refresh-token`, { refreshToken });
          const newAccessToken = res.data?.tokens?.accessToken || res.data?.accessToken;
          if (newAccessToken) {
            localStorage.setItem('accessToken', newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
    }
    return Promise.reject(error);
  }
);

// =============================================================================
// Auth API
// =============================================================================
export const authAPI = {
  register: async (userData) => {
    return api.post('/user/register', {
      username: userData.username,
      password: userData.password,
      name: userData.name || userData.fullName,
      governmentId: userData.governmentId,
      email: userData.email,
      phone: userData.phone,
      walletAddress: userData.walletAddress || userData.wallet_address
    });
  },

  login: async (credentials) => {
    return api.post('/user/login', {
      username: credentials.username,
      password: credentials.password
    });
  },

  verifyMFA: async (mfaToken, code) => {
    return api.post('/user/verify-mfa', { mfaToken, code });
  },

  refreshToken: async (refreshToken) => {
    return api.post('/user/refresh-token', { refreshToken });
  },

  verifyBiometric: async (biometricData) => {
    return api.post('/users/verify-biometric', biometricData);
  },

  getMFASettings: async () => {
    return api.get('/mfa/status');
  },

  getMFAStatus: async () => {
    return api.get('/mfa/status');
  },

  setupMFA: async (type = 'TOTP') => {
    return api.post('/mfa/setup', { type });
  },

  verifyMFASetup: async (token) => {
    return api.post('/mfa/verify-setup', { token });
  },

  disableMFA: async (token) => {
    return api.post('/mfa/disable', { token });
  },

  getRecoveryCodes: async () => {
    return api.get('/mfa/recovery-codes');
  },

  regenerateRecoveryCodes: async (mfaToken) => {
    return api.post('/mfa/regenerate-recovery-codes', { token: mfaToken });
  },

  getActiveSessions: async () => {
    return api.get('/sessions');
  },

  revokeSession: async (sessionId) => {
    return api.delete(`/sessions/${sessionId}`);
  },

  revokeAllOtherSessions: async () => {
    return api.post('/sessions/revoke-others');
  },

  getSecuritySettings: async () => {
    return api.get('/users/security-settings');
  },

  updateSecuritySettings: async (settings) => {
    return api.put('/users/security-settings', settings);
  },

  getSuspiciousActivities: async () => {
    return api.get('/users/suspicious-activities');
  },

  exportUserData: async (format = 'JSON') => {
    return api.post('/gdpr/export', { format });
  },

  requestAccountDeletion: async (reason = '') => {
    return api.post('/gdpr/delete-account', { reason });
  }
};

// =============================================================================
// User & Profile API
// =============================================================================
export const userAPI = {
  getProfile: async () => {
    return api.get('/users/profile');
  },

  updateProfile: async (profileData) => {
    return api.put('/users/profile', profileData);
  },

  getVerificationStatus: async () => {
    return api.get('/users/verification-status');
  },

  getBiometricStatus: async () => {
    return api.get('/users/verification-status');
  },

  getProfessionVerificationStatus: async () => {
    return api.get('/users/verification-status');
  },

  getProfessionalRecords: async () => {
    return api.get('/users/professional-records');
  },

  addProfessionalRecord: async (recordData) => {
    return api.post('/users/professional-record', recordData);
  },

  updateProfessionalRecord: async (id, recordData) => {
    return api.put(`/users/professional-record/${id}`, recordData);
  },

  getProfessionalRecordVerification: async (id) => {
    return api.get(`/users/professional-record/${id}/verification`);
  },

  transferToBlockchain: async () => {
    return api.post('/blockchain/register');
  }
};

// =============================================================================
// Blockchain API
// =============================================================================
export const blockchainAPI = {
  getBlockchainStatus: async () => {
    return api.get('/blockchain/status');
  },

  getTransactionStatus: async (txHash) => {
    return api.get(`/blockchain/transaction/${txHash}`);
  },

  getTransactions: async (page = 1, limit = 10) => {
    return api.get(`/blockchain/transactions?page=${page}&limit=${limit}`);
  },

  verifyIdentityOnBlockchain: async () => {
    return api.post('/blockchain/verify');
  },

  registerIdentity: async () => {
    return api.post('/blockchain/register');
  },

  mintSoulboundBadge: async () => {
    return api.post('/blockchain/mint-soulbound-badge');
  },

  getSoulboundBadgeStatus: async () => {
    return api.get('/blockchain/soulbound-badge-status');
  }
};

// =============================================================================
// Wallet API
// =============================================================================
export const walletAPI = {
  getWalletData: async () => {
    const [profileRes, statusRes] = await Promise.all([
      userAPI.getProfile().catch(() => ({ data: {} })),
      blockchainAPI.getBlockchainStatus().catch(() => ({ data: {} }))
    ]);
    const user = profileRes?.data?.user || {};
    const status = statusRes?.data?.status || {};
    const resolvedAddress = user.walletAddress || status.walletAddress || '';
    return {
      data: {
        address: resolvedAddress,
        did: user.did || (resolvedAddress ? `did:trueid:${resolvedAddress}` : ''),
        balance: '0.0000',
        network: 'Ethereum Sepolia Testnet'
      }
    };
  },

  transferFunds: async (recipient, amount) => {
    return api.post('/blockchain/transfer', { recipient, amount });
  },

  getTransactions: async () => {
    return blockchainAPI.getTransactions();
  }
};

// =============================================================================
// Document API
// =============================================================================
export const documentAPI = {
  uploadDocument: async (file, professionalRecordId) => {
    const formData = new FormData();
    formData.append('document', file);
    if (professionalRecordId) {
      formData.append('professionalRecordId', professionalRecordId);
    }

    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// =============================================================================
// Activity & Notifications API
// =============================================================================
export const activityAPI = {
  getActivityLogs: async (page = 1, limit = 10) => {
    return api.get(`/blockchain/transactions?page=${page}&limit=${limit}`);
  },

  getNotifications: async () => {
    return { data: [] };
  },

  markNotificationRead: async (id) => {
    return { data: { success: true } };
  },

  getStatistics: async () => {
    const profileRes = await userAPI.getProfile().catch(() => ({ data: {} }));
    return {
      data: {
        verificationStatus: profileRes?.data?.user?.verificationStatus || profileRes?.data?.user?.verification_status || 'PENDING',
        professionalRecordsCount: profileRes?.data?.professionalRecordsCount || 0
      }
    };
  }
};

export default api;
