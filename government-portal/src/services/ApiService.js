import axios from 'axios';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
    });
    
    // Cache for API responses
    this.cache = {
      profile: null,
      profileTimestamp: null,
      profilePromise: null
    };
    
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
    
    // Log that we're using real API
    console.log('%c🔵 Using REAL API for all calls 🔵', 'background: #0066cc; color: #fff; padding: 4px; border-radius: 4px; font-weight: bold;');
  }

  // Authentication
  async login(username, password) {
    try {
      const response = await this.api.post('/admin/login', { username, password });
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  // Set auth token for API calls
  setAuthToken(token) {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
      // Clear the cache when logging out
      this.cache.profile = null;
      this.cache.profileTimestamp = null;
      this.cache.profilePromise = null;
    }
  }

  // Get current user profile with caching
  async getCurrentUser() {
    try {
      // If we have a cached profile and it's less than 5 minutes old, return it
      const now = Date.now();
      if (this.cache.profile && (now - this.cache.profileTimestamp < 5 * 60 * 1000)) {
        console.log('Using cached profile data');
        return this.cache.profile;
      }
      
      // If there's already a request in progress, return that promise
      if (this.cache.profilePromise) {
        console.log('Using existing profile request');
        return this.cache.profilePromise;
      }
      
      // Create a new promise for the profile request
      this.cache.profilePromise = new Promise(async (resolve, reject) => {
        try {
          const response = await this.api.get('/admin/profile');
          this.cache.profile = response.data;
          this.cache.profileTimestamp = now;
          resolve(response.data);
        } catch (error) {
          console.error('Error fetching current user:', error);
          reject(error);
        } finally {
          // Clear the promise after it resolves or rejects
          setTimeout(() => {
            this.cache.profilePromise = null;
          }, 0);
        }
      });
      
      return this.cache.profilePromise;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      throw error;
    }
  }
  
  // User management
  async getUsers(page = 1, limit = 10, search = '', searchType = 'name') {
    try {
      const response = await this.api.get('/admin/users', {
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
      const response = await this.api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw error;
    }
  }

  async getUserByAddress(address) {
    try {
      
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
      // Validate userId to prevent errors
      if (!userId) {
        console.error('Error: Attempted to verify user with undefined userId');
        throw new Error('User ID is required for verification');
      }
      
      console.log(`Verifying user with ID: ${userId}`);
      const response = await this.api.put(`/admin/users/${userId}/verify`, {
        verificationStatus: 'VERIFIED'
      });
      return response.data;
    } catch (error) {
      console.error(`Error verifying identity for user ${userId}:`, error);
      throw error;
    }
  }

  async rejectIdentity(userId, reason) {
    try {
      
      const response = await this.api.put(`/admin/users/${userId}/verify`, {
        verificationStatus: 'REJECTED',
        verificationNotes: reason
      });
      return response.data;
    } catch (error) {
      console.error(`Error rejecting identity for user ${userId}:`, error);
      throw error;
    }
  }

  // Activity logs
  async getActivityLogs(page = 1, limit = 20, filters = {}) {
    try {
      
      const response = await this.api.get('/admin/logs', {
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
      // Updated endpoint to match backend API structure
      const response = await this.api.get(`/admin/users/${userId}/professional-records`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching professional records for user ${userId}:`, error);
      // Return empty array instead of throwing error to prevent UI from breaking
      return { records: [] };
    }
  }

  async verifyProfessionalRecord(userId, recordId) {
    try {
      
      const response = await this.api.post(`/users/${userId}/professional-records/${recordId}/verify`);
      return response.data;
    } catch (error) {
      console.error(`Error verifying professional record ${recordId}:`, error);
      throw error;
    }
  }

  // Admin management - use the cached getCurrentUser method
  async getAdminProfile() {
    return this.getCurrentUser();
  }

  async updateAdminProfile(profileData) {
    try {
      
      const response = await this.api.put('/admin/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating admin profile:', error);
      throw error;
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      
      const response = await this.api.put('/admin/change-password', {
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
      // Ensure we have the auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token found when fetching dashboard stats');
      }
      
      // Log the request for debugging
      console.log('Fetching dashboard stats from:', `${this.api.defaults.baseURL}/admin/dashboard`);
      
      // Make the API request
      const response = await this.api.get('/admin/dashboard');
      console.log('Dashboard API response:', response);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error.response?.data || error.message || error);
      
      // For debugging - log the full error
      if (error.response) {
        console.log('Error response status:', error.response.status);
        console.log('Error response data:', error.response.data);
      } else if (error.request) {
        console.log('No response received:', error.request);
      }
      
      throw error;
    }
  }

  // Export data
  async exportUsers(filters = {}) {
    try {
      
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
  // Deactivate user
  async deactivateUser(userId, reason) {
    try {
      
      const response = await this.api.put(`/admin/users/${userId}/deactivate`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error deactivating user ${userId}:`, error);
      throw error;
    }
  }

  // Reactivate user
  async reactivateUser(userId) {
    try {
      
      const response = await this.api.put(`/admin/users/${userId}/reactivate`);
      return response.data;
    } catch (error) {
      console.error(`Error reactivating user ${userId}:`, error);
      throw error;
    }
  }

  // Update user information
  async updateUser(userId, userData) {
    try {
      
      const response = await this.api.put(`/admin/users/${userId}/update`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  }

  // Create new admin user (Super Admin only)
  async createAdmin(adminData) {
    try {
      const response = await this.api.post('/admin/create', adminData);
      return response.data;
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  }
}

export default new ApiService();
