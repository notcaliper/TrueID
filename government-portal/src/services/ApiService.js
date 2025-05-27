import axios from 'axios';
import MockDataService from './MockDataService';

// Flag to determine if we should use mock data or real API
const USE_MOCK_DATA = true;

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
    });
    
    // Add request interceptor to include auth token in all requests
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Log that we're using mock data
    if (USE_MOCK_DATA) {
      console.log('%c🔶 Using MOCK DATA for all API calls 🔶', 'background: #FFA500; color: #000; padding: 4px; border-radius: 4px; font-weight: bold;');
    }
  }

  // User management
  async getUsers(page = 1, limit = 10, search = '', searchType = 'name') {
    try {
      if (USE_MOCK_DATA) {
        return await MockDataService.getUsers(page, limit, search, searchType);
      }
      
      const response = await this.api.get('/users', {
        params: { page, limit, search, searchType }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      if (USE_MOCK_DATA) {
        return await MockDataService.getUserById(userId);
      }
      
      const response = await this.api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw error;
    }
  }

  async getUserByAddress(address) {
    try {
      if (USE_MOCK_DATA) {
        // Find user with matching wallet address in mock data
        const users = await MockDataService.getUsers(1, 50);
        const user = users.users.find(u => u.walletAddress === address);
        if (!user) throw new Error('User not found');
        return user;
      }
      
      const response = await this.api.get(`/users/address/${address}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user with address ${address}:`, error);
      throw error;
    }
  }

  // Biometric data management
  async updateBiometricData(userId, biometricHash) {
    try {
      if (USE_MOCK_DATA) {
        return await MockDataService.updateBiometricData(userId, biometricHash);
      }
      
      const response = await this.api.put(`/users/${userId}/biometric`, {
        biometricHash
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating biometric data for user ${userId}:`, error);
      throw error;
    }
  }

  // Identity verification
  async verifyIdentity(userId) {
    try {
      if (USE_MOCK_DATA) {
        return await MockDataService.verifyIdentity(userId, true);
      }
      
      const response = await this.api.post(`/users/${userId}/verify`);
      return response.data;
    } catch (error) {
      console.error(`Error verifying identity for user ${userId}:`, error);
      throw error;
    }
  }

  async rejectIdentity(userId, reason) {
    try {
      if (USE_MOCK_DATA) {
        return await MockDataService.verifyIdentity(userId, false);
      }
      
      const response = await this.api.post(`/users/${userId}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error rejecting identity for user ${userId}:`, error);
      throw error;
    }
  }

  // Activity logs
  async getActivityLogs(page = 1, limit = 20, filters = {}) {
    try {
      if (USE_MOCK_DATA) {
        return await MockDataService.getActivityLogs(page, limit, filters);
      }
      
      const response = await this.api.get('/activity-logs', {
        params: {
          page,
          limit,
          ...filters
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  }

  // Professional records
  async getProfessionalRecords(userId) {
    try {
      if (USE_MOCK_DATA) {
        return await MockDataService.getProfessionalRecords(userId);
      }
      
      const response = await this.api.get(`/users/${userId}/professional-records`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching professional records for user ${userId}:`, error);
      throw error;
    }
  }

  async verifyProfessionalRecord(userId, recordId) {
    try {
      if (USE_MOCK_DATA) {
        // For mock purposes, just return success with a transaction hash
        return {
          success: true,
          txHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`
        };
      }
      
      const response = await this.api.post(`/users/${userId}/professional-records/${recordId}/verify`);
      return response.data;
    } catch (error) {
      console.error(`Error verifying professional record ${recordId}:`, error);
      throw error;
    }
  }

  // Admin management
  async getAdminProfile() {
    try {
      if (USE_MOCK_DATA) {
        // Return mock admin profile
        return {
          id: 'admin-001',
          name: 'Admin Singh',
          email: 'admin.singh@gov.in',
          role: 'Senior Administrator',
          department: 'Identity Management',
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3 hours ago
        };
      }
      
      const response = await this.api.get('/admin/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      throw error;
    }
  }

  async updateAdminProfile(profileData) {
    try {
      if (USE_MOCK_DATA) {
        // Return success with updated profile data
        return {
          success: true,
          profile: {
            ...profileData,
            id: 'admin-001',
            role: 'Senior Administrator',
            department: 'Identity Management',
            lastUpdated: new Date()
          }
        };
      }
      
      const response = await this.api.put('/admin/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating admin profile:', error);
      throw error;
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      if (USE_MOCK_DATA) {
        // Simulate password validation
        if (currentPassword === 'admin123') {
          return { success: true, message: 'Password changed successfully' };
        } else {
          throw new Error('Current password is incorrect');
        }
      }
      
      const response = await this.api.post('/admin/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // Dashboard statistics
  async getDashboardStats() {
    try {
      if (USE_MOCK_DATA) {
        return await MockDataService.getDashboardStats();
      }
      
      const response = await this.api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      throw error;
    }
  }

  // Export data
  async exportUsers(filters = {}) {
    try {
      if (USE_MOCK_DATA) {
        // Create a mock CSV blob
        const header = 'ID,Name,Email,Phone,Registration Date,Verification Status\n';
        const rows = [];
        
        // Get users from mock service
        const users = await MockDataService.getUsers(1, 100, '');
        
        // Create CSV rows
        users.users.forEach(user => {
          rows.push(`${user.id},${user.name},${user.email},${user.phone},${user.registrationDate.toISOString()},${user.verificationStatus}`);
        });
        
        // Return as blob
        return new Blob([header + rows.join('\n')], { type: 'text/csv' });
      }
      
      const response = await this.api.get('/export/users', {
        params: filters,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting users:', error);
      throw error;
    }
  }

  async exportActivityLogs(filters = {}) {
    try {
      if (USE_MOCK_DATA) {
        return await MockDataService.exportActivityLogs(filters);
      }
      
      const response = await this.api.get('/export/activity-logs', {
        params: filters,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting activity logs:', error);
      throw error;
    }
  }
}

export default new ApiService();
