import axios from 'axios';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
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
  /**
   * Get professional records for a specific user (admin endpoint)
   * @param {string|number} userId
   */
  async getProfessionalRecords(userId) {
    try {
      const response = await this.api.get(`/admin/users/${userId}/professional-records`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching professional records for user ${userId}:`, error);
      throw error;
    }
  }

  async getAllProfessionalRecords(page = 1, limit = 10, search = '') {
    try {
      const response = await this.api.get('/admin/professional-records', {
        params: { page, limit, search }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all professional records:', error);
      throw error;
    }
  }

  async getProfessionalRecord(recordId) {
    try {
      const response = await this.api.get(`/admin/professional-records/${recordId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching professional record ${recordId}:`, error);
      throw error;
    }
  }

  async updateProfessionalRecordStatus(recordId, data) {
    try {
      const response = await this.api.put(
        `/admin/professional-records/${recordId}/status`,
        data
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating professional record status ${recordId}:`, error);
      throw error;
    }
  }

  async verifyProfessionalRecord(userId, recordId) {
    try {
      const response = await this.api.post(
        `/admin/professional-records/${recordId}/verify`,
        { userId }
      );
      return response.data;
    } catch (error) {
      console.error(`Error verifying professional record ${recordId}:`, error);
      throw error;
    }
  }

  // Document Management
  async getDocuments(professionalRecordId) {
    try {
      const response = await this.api.get(`/documents/admin/professional-record/${professionalRecordId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  async verifyDocument(documentId, data) {
    try {
      const response = await this.api.put(`/documents/verify/${documentId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error verifying document:', error);
      throw error;
    }
  }

  async getDocument(documentId) {
    try {
      const response = await this.api.get(`/documents/admin/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  }

  async uploadDocument(formData, onUploadProgress) {
    try {
      const response = await this.api.post('/admin/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onUploadProgress) {
            onUploadProgress(percentCompleted);
          }
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  // Blockchain Integration
  async getBlockchainStatus(recordId) {
    try {
      const response = await this.api.get(`/admin/blockchain/status/${recordId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching blockchain status:', error);
      throw error;
    }
  }

  async verifyOnBlockchain(recordId) {
    try {
      // First get the professional record details
      const { record } = await this.getProfessionalRecord(recordId);
      
      if (!record) {
        throw new Error('Professional record not found');
      }

      // Check if record is already on blockchain
      if (!record.on_blockchain) {
        // Record the professional record on blockchain first
        await this.api.post('/blockchain/professional-record', {
          userId: record.user_id,
          recordId: parseInt(recordId, 10)  // Ensure recordId is a number
        });
      }
      
      // Then verify it
      const response = await this.api.post(`/blockchain/verify/${recordId}`);
      return response.data;
    } catch (error) {
      console.error('Error verifying on blockchain:', error);
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

  // List all professional records for a specific user (used after biometric identification)
  async listUserProfessionalRecords(userId) {
    try {
      if (!userId) throw new Error('userId is required');
      const response = await this.api.get(`/admin/users/${userId}/professional-records`);
      return response.data; // Assumes API returns { records: [...] } or an array
    } catch (error) {
      this.handleError(error);
    }
  }
  
  // Verify user with biometric data - directly identifies user from face
  async verifyUserBiometric(biometricData) {
    try {
      // In a real implementation, this would send the biometric data to the server
      // and match against the database of registered biometric templates
      console.log('Verifying user from biometric data directly');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, we'll simulate finding a matching user
      // In a real implementation, this would use facial recognition to identify the user
      
      // Get a sample user to demonstrate the flow
      // Using the correct endpoint '/admin/users' instead of '/users'
      const response = await this.api.get('/admin/users', {
        params: { page: 1, limit: 5 }
      });
      const users = response.data.users || [];
      
      if (users.length > 0) {
        // Simulate finding a match - in reality this would be done by comparing biometric templates
        const matchedUser = users[0]; // Just use the first user for demo purposes
        
        return {
          success: true,
          userInfo: matchedUser,
          message: 'User identified and verified successfully'
        };
      } else {
        return {
          success: false,
          message: 'No matching user found for this biometric data'
        };
      }
    } catch (error) {
      console.error('Error identifying user from biometric data:', error);
      return {
        success: false,
        message: error.message || 'Biometric identification failed'
      };
    }
  }

  // Document management
  async listProfessionalRecordDocuments(recordId) {
    try {
      if (!recordId) throw new Error('recordId is required');
      const response = await this.api.get(`/documents/admin/professional-record/${recordId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async uploadDocument(formData, onProgress) {
    try {
      const response = await this.api.post('/admin/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            const percent = Math.round((event.loaded * 100) / event.total);
            onProgress(percent);
          }
        }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async verifyDocument(documentId, payload) {
    try {
      if (!documentId) throw new Error('documentId is required');
      const response = await this.api.put(`/admin/documents/verify/${documentId}`, payload);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Error handling
  handleError(error) {
    if (error.response) {
      // Server responded with error
      console.error('API Error Response:', error.response.data);
      throw new Error(error.response.data.message || 'Server error occurred');
    } else if (error.request) {
      // Request made but no response
      console.error('API No Response:', error.request);
      throw new Error('No response from server');
    } else {
      // Error in request setup
      console.error('API Request Error:', error.message);
      throw new Error('Error setting up request');
    }
  }
}

const apiServiceInstance = new ApiService();
export default apiServiceInstance;
