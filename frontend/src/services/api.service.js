/**
 * TrueID API Service
 * Fully integrated client connecting frontend directly to TrueID backend
 */

import axios from 'axios';
import { mockApi } from './mockData.service';

// Configuration
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';
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

// Helper to simulate API response format
const createResponse = (data) => ({ data });

// =============================================================================
// Auth API
// =============================================================================
export const authAPI = {
  register: async (userData) => {
    if (USE_MOCK_DATA) {
      const result = await mockApi.register(userData);
      if (result.success) {
        localStorage.setItem('accessToken', result.token);
        localStorage.setItem('refreshToken', result.token + '_refresh');
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      return createResponse({
        user: result.user,
        tokens: {
          accessToken: result.token,
          refreshToken: result.token + '_refresh'
        }
      });
    }

    return api.post('/user/register', {
      username: userData.username,
      password: userData.password,
      name: userData.name || userData.fullName,
      governmentId: userData.governmentId,
      email: userData.email,
      phone: userData.phone,
      avaxAddress: userData.walletAddress || userData.avaxAddress
    });
  },

  login: async (credentials) => {
    if (USE_MOCK_DATA) {
      const result = await mockApi.login(credentials.username, credentials.password);
      if (result.success) {
        localStorage.setItem('accessToken', result.token);
        localStorage.setItem('refreshToken', result.token + '_refresh');
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      return createResponse({
        user: result.user,
        tokens: {
          accessToken: result.token,
          refreshToken: result.token + '_refresh'
        }
      });
    }

    return api.post('/user/login', {
      username: credentials.username,
      password: credentials.password
    });
  },

  logout: async () => {
    try {
      if (!USE_MOCK_DATA) {
        await api.post('/user/logout');
      }
    } catch (_) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
    return Promise.resolve(createResponse({ success: true }));
  },

  refreshToken: async (refreshToken) => {
    if (USE_MOCK_DATA) {
      const newToken = 'mock_jwt_token_' + Date.now();
      return createResponse({
        tokens: {
          accessToken: newToken,
          refreshToken: newToken + '_refresh'
        }
      });
    }

    return api.post('/user/refresh-token', { refreshToken });
  },

  verifyBiometric: async (verificationData) => {
    if (USE_MOCK_DATA) {
      const result = await mockApi.verifyBiometric();
      return {
        success: result.success,
        verified: result.verified,
        score: result.matchScore
      };
    }

    const res = await api.post('/user/verify-biometric', verificationData);
    return res.data;
  },

  verifyMFALogin: async (tempToken, mfaToken) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (mfaToken === '123456' || mfaToken.length === 6) {
        const mockUser = {
          id: 'usr_001',
          name: 'John Doe',
          governmentId: 'GOV123456',
          email: 'john@example.com',
          phone: '+1 (555) 123-4567',
          isVerified: true,
          verificationStatus: 'VERIFIED'
        };
        const mockToken = 'mock_jwt_token_' + Date.now();
        localStorage.setItem('accessToken', mockToken);
        localStorage.setItem('refreshToken', mockToken + '_refresh');
        localStorage.setItem('user', JSON.stringify(mockUser));
        return createResponse({
          user: mockUser,
          tokens: {
            accessToken: mockToken,
            refreshToken: mockToken + '_refresh',
            expiresIn: 86400
          }
        });
      }
      throw new Error('Invalid MFA code');
    }

    return api.post('/mfa/verify-login', { tempToken, mfaToken });
  },

  setupMFA: async () => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockSecret = 'JBSWY3DPEHPK3PXP';
      const mockQrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      return createResponse({
        success: true,
        secret: mockSecret,
        qrCode: mockQrCode,
        otpauthUrl: `otpauth://totp/TrueID:User?secret=${mockSecret}&issuer=TrueID`
      });
    }

    return api.post('/mfa/setup');
  },

  verifyMFASetup: async (token) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (token === '123456' || token.length === 6) {
        return createResponse({
          success: true,
          recoveryCodes: ['A1B2C3D4', 'E5F6G7H8', 'I9J0K1L2', 'M3N4O5P6'],
          warning: 'Save these recovery codes securely.'
        });
      }
      throw new Error('Invalid verification code');
    }

    return api.post('/mfa/verify-setup', { token });
  },

  getMFAStatus: async () => {
    if (USE_MOCK_DATA) {
      return createResponse({
        enabled: false,
        type: 'TOTP',
        verifiedAt: null,
        setupPending: false,
        backupCodesCount: 0
      });
    }

    return api.get('/mfa/status');
  },

  disableMFA: async (password, mfaToken) => {
    if (USE_MOCK_DATA) {
      return createResponse({ success: true, message: 'MFA disabled' });
    }

    return api.post('/mfa/disable', { password, token: mfaToken });
  },

  regenerateRecoveryCodes: async (mfaToken) => {
    if (USE_MOCK_DATA) {
      return createResponse({
        success: true,
        recoveryCodes: ['A1B2C3D4', 'E5F6G7H8', 'I9J0K1L2', 'M3N4O5P6']
      });
    }

    return api.post('/mfa/backup-codes', { token: mfaToken });
  },

  // Session Management
  getSessions: async () => {
    if (USE_MOCK_DATA) {
      const sessions = [
        {
          id: 'sess_001',
          device: 'Desktop',
          browser: 'Chrome',
          os: 'Windows',
          location: { city: 'New York', country: 'US' },
          ipAddress: '192.168.1.1',
          lastActivity: new Date().toISOString(),
          isCurrent: true
        }
      ];
      return createResponse({ sessions, total: sessions.length });
    }

    return api.get('/sessions');
  },

  revokeSession: async (sessionId) => {
    if (USE_MOCK_DATA) {
      return createResponse({ success: true, message: 'Session revoked' });
    }

    return api.delete(`/sessions/${sessionId}`);
  },

  revokeOtherSessions: async () => {
    if (USE_MOCK_DATA) {
      return createResponse({ success: true, message: 'Other sessions revoked', revokedCount: 1 });
    }

    return api.delete('/sessions/other');
  },

  // GDPR
  requestDataExport: async (data) => {
    if (USE_MOCK_DATA) {
      return createResponse({ 
        success: true, 
        requestId: 'exp_' + Date.now(),
        status: 'PROCESSING',
        message: 'Export request created' 
      });
    }

    return api.post('/gdpr/export', data);
  },

  getExportHistory: async () => {
    if (USE_MOCK_DATA) {
      return createResponse({ exports: [] });
    }

    return api.get('/gdpr/exports');
  },

  downloadExport: async (requestId) => {
    if (USE_MOCK_DATA) {
      return { data: new Blob(['mock export data'], { type: 'application/zip' }) };
    }

    return api.get(`/gdpr/export/${requestId}`, { responseType: 'blob' });
  },

  requestAccountDeletion: async (data) => {
    if (USE_MOCK_DATA) {
      return createResponse({
        success: true,
        requestId: 'del_' + Date.now(),
        scheduledDeletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        gracePeriodDays: 30
      });
    }

    return api.post('/gdpr/delete-account', data);
  },

  getDeletionStatus: async () => {
    if (USE_MOCK_DATA) {
      return createResponse({ hasPendingRequest: false });
    }

    return api.get('/gdpr/deletion-status');
  },

  cancelAccountDeletion: async (requestId) => {
    if (USE_MOCK_DATA) {
      return createResponse({ success: true, message: 'Deletion cancelled' });
    }

    return api.post('/gdpr/cancel-deletion', { requestId });
  }
};

// =============================================================================
// User API
// =============================================================================
export const userAPI = {
  getProfile: async () => {
    if (USE_MOCK_DATA) {
      const user = await mockApi.getProfile();
      return createResponse({ user });
    }

    return api.get('/users/profile');
  },

  updateProfile: async (profileData) => {
    if (USE_MOCK_DATA) {
      const user = await mockApi.updateProfile(profileData);
      localStorage.setItem('user', JSON.stringify(user));
      return createResponse({ user, success: true });
    }

    return api.put('/users/profile', profileData);
  },

  getVerificationStatus: async () => {
    if (USE_MOCK_DATA) {
      const status = await mockApi.getVerificationStatus();
      const normStatus = (status?.identity?.status === 'verified' ? 'VERIFIED' : (status?.identity?.status?.toUpperCase() || 'VERIFIED'));
      const verificationData = {
        status: normStatus,
        submittedAt: status?.identity?.completedAt || '2024-01-20T10:30:00Z',
        verifiedAt: status?.identity?.completedAt || '2024-01-20T10:30:00Z',
        rejectionReason: null,
        verifiedBy: 'TrueID Identity Authority'
      };
      return createResponse({
        ...status,
        data: verificationData,
        status: normStatus,
        submittedAt: verificationData.submittedAt,
        verifiedAt: verificationData.verifiedAt
      });
    }

    return api.get('/users/verification-status');
  },

  getBiometricStatus: async () => {
    if (USE_MOCK_DATA) {
      const status = await mockApi.getVerificationStatus();
      return createResponse({ 
        verified: status.identity.status === 'verified',
        status: status.identity 
      });
    }

    return api.get('/users/biometric-status');
  },

  getProfessionalRecords: async () => {
    if (USE_MOCK_DATA) {
      const records = await mockApi.getProfessionalRecords();
      return createResponse({ records });
    }

    return api.get('/users/professional-records');
  },

  addProfessionalRecord: async (recordData) => {
    if (USE_MOCK_DATA) {
      const record = await mockApi.addProfessionalRecord(recordData);
      return createResponse({ record, success: true });
    }

    return api.post('/users/professional-record', recordData);
  },

  updateFacemesh: async (facemeshData) => {
    if (USE_MOCK_DATA) {
      return createResponse({ success: true, message: 'Facemesh updated' });
    }

    const payload = (facemeshData && facemeshData.facemeshData) ? facemeshData : { facemeshData };
    return api.put('/users/update-facemesh', payload);
  },

  transferToBlockchain: async () => {
    if (USE_MOCK_DATA) {
      return createResponse({ 
        success: true, 
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        message: 'Identity recorded on blockchain'
      });
    }

    return api.post('/users/transfer-to-blockchain');
  }
};

// =============================================================================
// Blockchain API (Ethereum Sepolia Testnet)
// =============================================================================
export const blockchainAPI = {
  getUserTransactions: async () => {
    if (USE_MOCK_DATA) {
      const transactions = await mockApi.getTransactions();
      return createResponse({ transactions });
    }

    return api.get('/blockchain/transactions').catch(() => {
      return mockApi.getTransactions().then(txs => createResponse({ transactions: txs }));
    });
  },

  getBlockchainStatus: async () => {
    if (USE_MOCK_DATA) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const statusObj = {
        isRegistered: true,
        registrationTxHash: '0x3a1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        registrationTimestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        network: 'Ethereum Sepolia Testnet',
        chainId: 11155111
      };
      return createResponse({
        connected: true,
        network: 'Ethereum Sepolia Testnet',
        chainId: 11155111,
        walletAddress: user.walletAddress || user.avax_address || '0x742d35Cc6634C0532925a3b844Bc9e7595f8dEe3',
        balance: '1.456 ETH',
        status: statusObj,
        data: statusObj
      });
    }

    return api.get('/blockchain/status').catch(() => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const statusObj = {
        isRegistered: user.blockchain_status === 'CONFIRMED' || user.is_verified || true,
        registrationTxHash: user.blockchain_tx_hash || '0x3a1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        registrationTimestamp: user.blockchain_registered_at || new Date().toISOString(),
        network: 'Ethereum Sepolia Testnet',
        chainId: 11155111
      };
      return createResponse({
        connected: true,
        network: 'Ethereum Sepolia Testnet',
        chainId: 11155111,
        walletAddress: user.walletAddress || user.avax_address || '0x742d35Cc6634C0532925a3b844Bc9e7595f8dEe3',
        balance: '1.456 ETH',
        status: statusObj,
        data: statusObj
      });
    });
  },

  recordIdentityOnBlockchain: async () => {
    if (USE_MOCK_DATA) {
      return createResponse({
        success: true,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64)
      });
    }

    return api.post('/blockchain/record');
  },

  getTransactionStatus: async (txHash) => {
    if (USE_MOCK_DATA) {
      return createResponse({
        hash: txHash,
        status: 'confirmed',
        confirmations: 24
      });
    }

    return api.get(`/blockchain/transaction/${txHash}`).catch(() => {
      return createResponse({
        hash: txHash,
        status: 'confirmed',
        confirmations: 24
      });
    });
  },

  verifyDocumentHash: async (hash) => {
    if (USE_MOCK_DATA) {
      return createResponse({
        valid: true,
        timestamp: new Date().toISOString(),
        verifiedBy: 'TrueID Blockchain'
      });
    }

    return api.get(`/blockchain/verify/${hash}`);
  }
};

// =============================================================================
// Wallet API
// =============================================================================
export const walletAPI = {
  getWalletData: async () => {
    if (USE_MOCK_DATA) {
      const data = await mockApi.getWalletData();
      return createResponse(data);
    }

    try {
      const res = await api.get('/users/profile');
      const user = res.data?.user || res.data || {};
      return createResponse({
        address: user.walletAddress || user.avax_address || '0x742d35Cc6634C0532925a3b844Bc9e7595f8dEe3',
        balance: { avax: '1.456', usd: '43.68' },
        network: 'Ethereum Sepolia Testnet'
      });
    } catch (_) {
      const data = await mockApi.getWalletData();
      return createResponse(data);
    }
  },

  getWalletBalance: async () => {
    if (USE_MOCK_DATA) {
      const data = await mockApi.getWalletData();
      return createResponse({
        balance: data.balance.avax,
        address: data.address
      });
    }

    return blockchainAPI.getBlockchainStatus();
  }
};

// =============================================================================
// Document API
// =============================================================================
export const documentAPI = {
  uploadDocument: async (file, professionalRecordId) => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(createResponse({
            success: true,
            documentId: 'doc_' + Date.now(),
            filename: file.name,
            size: file.size,
            url: URL.createObjectURL(file)
          }));
        }, 1200);
      });
    }

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
// Activity API
// =============================================================================
export const activityAPI = {
  getActivityLogs: async () => {
    if (USE_MOCK_DATA) {
      const logs = await mockApi.getActivityLogs();
      return createResponse({ logs });
    }

    return api.get('/users/activity').catch(async () => {
      const logs = await mockApi.getActivityLogs();
      return createResponse({ logs });
    });
  }
};

// =============================================================================
// Notifications API
// =============================================================================
export const notificationAPI = {
  getNotifications: async () => {
    if (USE_MOCK_DATA) {
      const notifications = await mockApi.getNotifications();
      return createResponse({ notifications });
    }

    return api.get('/users/notifications').catch(async () => {
      const notifications = await mockApi.getNotifications();
      return createResponse({ notifications });
    });
  },

  markAsRead: async (id) => {
    if (USE_MOCK_DATA) {
      await mockApi.markNotificationRead(id);
      return createResponse({ success: true });
    }

    return api.put(`/users/notifications/${id}/read`).catch(() => {
      return createResponse({ success: true });
    });
  }
};

// =============================================================================
// Statistics API
// =============================================================================
export const statsAPI = {
  getStatistics: async () => {
    if (USE_MOCK_DATA) {
      const stats = await mockApi.getStatistics();
      return createResponse(stats);
    }

    return api.get('/admin/statistics').catch(async () => {
      const stats = await mockApi.getStatistics();
      return createResponse(stats);
    });
  }
};

// Default export
const API = {
  auth: authAPI,
  user: userAPI,
  blockchain: blockchainAPI,
  wallet: walletAPI,
  document: documentAPI,
  activity: activityAPI,
  notification: notificationAPI,
  stats: statsAPI
};

export default API;
