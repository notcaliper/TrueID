import axios from 'axios';

// Use environment variable for API URL
const API_URL = process.env.REACT_APP_API_URL;

/**
 * Enhanced API service with endpoint health checks before making requests
 */
class ApiService {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
    
    if (!API_URL) {
      throw new Error('REACT_APP_API_URL environment variable is not defined');
    }
    
    this.axiosInstance = axios.create({
      baseURL: API_URL,
      timeout: process.env.REACT_APP_API_TIMEOUT ? parseInt(process.env.REACT_APP_API_TIMEOUT) : 15000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: process.env.REACT_APP_ENABLE_CREDENTIALS === 'true'
    });

    // Add request interceptor for authentication
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add timestamp to prevent caching
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now()
          };
        }
        
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
          // Debug token usage
          if (process.env.REACT_APP_ENV !== 'production') {
            console.log(`Using token for ${config.url}: ${token.substring(0, 15)}...`);
          }
        } else {
          // Debug missing token
          if (process.env.REACT_APP_ENV !== 'production' && !config.url.includes('/login') && !config.url.includes('/health')) {
            console.warn(`No auth token available for request to ${config.url}`);
          }
        }
        
        // Add debug info in development
        if (process.env.REACT_APP_ENV !== 'production') {
          console.log(`🌐 API Request: ${config.method.toUpperCase()} ${config.url}`, {
            url: config.url,
            method: config.method,
            hasAuthHeader: !!config.headers['Authorization'],
            params: config.params
          });
        }
        
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for handling errors
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Log successful responses in development
        if (process.env.REACT_APP_ENV !== 'production') {
          console.log(`✅ API Response: ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        // Log errors in development
        if (process.env.REACT_APP_ENV !== 'production') {
          console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, error.response || error);
        }
        
        // Handle token expiration and refresh
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
          if (originalRequest.url.includes('/refresh-token') || originalRequest.url.includes('/login')) {
            // If refresh token request itself failed, logout
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login?session=expired';
            return Promise.reject(new Error('Authentication failed. Please login again.'));
          }
          
          if (this.isRefreshing) {
            // Queue failed requests to retry after token refresh
            return new Promise((resolve, reject) => {
              this.failedQueue.push({resolve, reject});
            }).then(token => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }
          
          originalRequest._retry = true;
          this.isRefreshing = true;
          
          // Try to refresh the token
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const response = await this.axiosInstance.post('/admin/refresh-token', { refreshToken });
              const { token } = response.data;
              localStorage.setItem('authToken', token);
              
              // Process queue of failed requests with new token
              this.processQueue(null, token);
              
              // Retry original request with new token
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            } catch (refreshError) {
              // If refresh fails, process queue with error and redirect to login
              this.processQueue(refreshError, null);
              localStorage.removeItem('authToken');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login?session=expired';
              return Promise.reject(new Error('Session expired. Please login again.'));
            } finally {
              this.isRefreshing = false;
            }
          } else {
            // No refresh token available
            localStorage.removeItem('authToken');
            window.location.href = '/login?session=expired';
            return Promise.reject(new Error('Session expired. Please login again.'));
          }
        }
        
        // Handle other error types
        if (error.response && error.response.status === 403) {
          return Promise.reject(new Error('You do not have permission to access this resource.'));
        }
        
        if (error.response && error.response.status === 404) {
          return Promise.reject(new Error('The requested resource was not found.'));
        }
        
        if (error.response && error.response.status >= 500) {
          return Promise.reject(new Error('Server error. Please try again later.'));
        }
        
        if (error.code === 'ECONNABORTED') {
          return Promise.reject(new Error('Request timeout. Please check your connection.'));
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Process the queue of failed requests after token refresh
   * @param {Error} error - Error if token refresh failed
   * @param {string} token - New token if refresh succeeded
   */
  processQueue(error, token) {
    this.failedQueue.forEach(request => {
      if (error) {
        request.reject(error);
      } else {
        request.resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * Check if an endpoint exists and is responding
   * @param {string} endpoint - API endpoint to check
   * @param {object} options - Additional options
   * @returns {Promise<boolean>} - True if endpoint is healthy
   */
  async checkEndpointHealth(endpoint, options = {}) {
    try {
      // Use method from options or environment variable, falling back to GET only as last resort
      const method = options.method || process.env.REACT_APP_HEALTH_CHECK_METHOD || 'GET';
      console.log(`Checking endpoint health: ${API_URL}${endpoint}`);
      const response = await this.axiosInstance({
        method,
        url: endpoint,
        timeout: options.timeout || process.env.REACT_APP_HEALTH_CHECK_TIMEOUT || 5000,
        headers: {
          'X-Health-Check': 'true',
          'Accept': 'application/health+json'
        }
      });
      console.log(`Endpoint ${endpoint} health check success:`, response.status);
      return response.status >= 200 && response.status < 400;
    } catch (error) {
      console.error(`Endpoint ${endpoint} health check failed:`, error.message);
      // Log more details about the error for debugging
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
      }
      return false;
    }
  }

  /**
   * Perform a safe API call with endpoint health check
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request payload
   * @param {object} options - Additional options
   * @returns {Promise<object>} - API response or error object
   */
  async safeApiCall(method, endpoint, data = null, options = {}) {
    const isHealthy = await this.checkEndpointHealth(endpoint, {
      method: 'HEAD',
      ...options
    });

    if (!isHealthy) {
      return {
        success: false,
        error: 'API endpoint is not available',
        endpoint,
        status: 'unavailable'
      };
    }

    try {
      const response = await this.axiosInstance({
        method,
        url: endpoint,
        data,
        ...options
      });
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
        endpoint
      };
    }
  }

  // Authentication
  async login(credentials) {
    console.log('Attempting login with credentials:', { email: credentials.email || credentials.username });
    
    try {
      // Make a direct API call to the login endpoint
      const response = await this.axiosInstance.post('/admin/login', credentials);
      
      console.log('Login successful:', response.status);
      console.log('Login response data:', JSON.stringify(response.data, null, 2));
      
      // Store the tokens in localStorage - only use the new API format
      if (response.data && response.data.data) {
        const { token, refreshToken, expiresIn, user } = response.data.data;
        
        if (!token) {
          console.error('No token found in response data.data');
          return {
            success: false,
            error: 'No token returned from server',
            status: 'error'
          };
        }
        
        console.log('Storing token in localStorage:', token.substring(0, 15) + '...');
        localStorage.setItem('authToken', token);
        
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        if (expiresIn) {
          localStorage.setItem('tokenExpiry', Date.now() + (expiresIn * 1000));
        }
        
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
      } else {
        console.error('Response data does not match expected format:', response.data);
        return {
          success: false,
          error: 'Invalid response format from server',
          status: 'error'
        };
      }
      
      // Update the Authorization header for future requests
      const token = localStorage.getItem('authToken');
      if (token) {
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Updated Authorization header with new token');
      }
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('Login error:', error.message);
      console.error('Login error details:', error.response?.data);
      
      // Check if the server is responding at all
      const isServerOnline = await this.checkEndpointHealth('/test');
      
      if (!isServerOnline) {
        return {
          success: false,
          error: 'Login service is currently unavailable',
          status: 'unavailable'
        };
      }
      
      // Return the error from the server if available
      return {
        success: false,
        error: error.response?.data?.message || 'Invalid credentials',
        status: error.response?.status || 'error'
      };
    }
  }

  async logout() {
    try {
      // Call the logout endpoint if it exists
      await this.axiosInstance.post('/admin/logout');
    } catch (error) {
      console.warn('Logout API call failed, proceeding with client-side logout', error);
    } finally {
      // Always clear local storage regardless of API success
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('user');
    }
    
    return { success: true };
  }

  // User Management
  async getUsers(page = 1, limit = 10, filters = {}) {
    return this.safeApiCall('GET', '/admin/users', null, {
      params: { page, limit, ...filters }
    });
  }

  async getUserById(userId) {
    return this.safeApiCall('GET', `/admin/users/${userId}`);
  }

  async updateUser(userId, userData) {
    return this.safeApiCall('PUT', `/admin/users/${userId}/update`, userData);
  }

  async verifyUser(userId, verificationData) {
    return this.safeApiCall('PUT', `/admin/users/${userId}/verify`, verificationData);
  }

  // Record Management
  async getRecords(page = 1, limit = 10, filters = {}) {
    return this.safeApiCall('GET', '/admin/records', null, {
      params: { page, limit, ...filters }
    });
  }

  async getRecordById(recordId) {
    return this.safeApiCall('GET', `/admin/records/${recordId}`);
  }

  // Blockchain Integration
  async getBlockchainHealth() {
    return this.safeApiCall('GET', '/blockchain/health');
  }

  async getAllBlockchainTransactions(page = 1, limit = 10, filters = {}) {
    return this.safeApiCall('GET', '/blockchain/transactions', null, {
      params: { page, limit, ...filters }
    });
  }

  async getTransactionDetails(txHash) {
    return this.safeApiCall('GET', `/blockchain/transaction/${txHash}`);
  }

  async getUserBlockchainTransactions(userId, page = 1, limit = 10) {
    return this.safeApiCall('GET', `/blockchain/user-transactions/${userId}`, null, {
      params: { page, limit }
    });
  }

  async pushRecordToBlockchain(recordId, data = {}) {
    return this.safeApiCall('POST', `/blockchain/push/${recordId}`, data);
  }

  async verifyDocumentHash(hash) {
    return this.safeApiCall('GET', `/blockchain/verify/${hash}`);
  }

  async fetchIdentityFromBlockchain(userId) {
    return this.safeApiCall('GET', `/blockchain/fetch/${userId}`);
  }

  async fetchRecordFromBlockchain(recordId) {
    return this.safeApiCall('GET', `/blockchain/fetch/${recordId}`);
  }

  // Blockchain Transaction History
  async getBlockchainTransactions(page = 1, limit = 10, filters = {}) {
    return this.safeApiCall('GET', '/blockchain/transactions', null, {
      params: { page, limit, ...filters }
    });
  }

  async getTransactionDetails(txHash, network = 'mumbai') {
    return this.safeApiCall('GET', `/blockchain/transaction/${txHash}`, null, {
      params: { network }
    });
  }

  // Network Management
  async getNetworkStatus() {
    return this.safeApiCall('GET', '/network/status');
  }

  async switchNetwork(networkData) {
    return this.safeApiCall('POST', '/network/switch', networkData);
  }

  // Logs and Activity
  async getActivityLogs(page = 1, limit = 20, filters = {}) {
    return this.safeApiCall('GET', '/admin/logs', null, {
      params: { page, limit, ...filters }
    });
  }

  // Dashboard Data
  async getDashboardStats() {
    return this.safeApiCall('GET', '/admin/dashboard/stats');
  }

  async getDashboardActivity(limit = 5) {
    return this.safeApiCall('GET', '/admin/dashboard/activity', null, {
      params: { limit }
    });
  }

  // Check multiple endpoints at once
  async checkMultipleEndpoints(endpoints) {
    const results = {};
    for (const endpoint of endpoints) {
      results[endpoint] = await this.checkEndpointHealth(endpoint);
    }
    return results;
  }

  // Admin Profile
  async getAdminProfile() {
    return this.safeApiCall('GET', '/admin/profile');
  }

  async updateAdminProfile(profileData) {
    return this.safeApiCall('PUT', '/admin/profile', profileData);
  }

  // User management by address (blockchain)
  async getUserByAddress(address) {
    return this.safeApiCall('GET', `/users/address/${address}`);
  }

  // Biometric data management
  async updateBiometricData(userId, biometricHash) {
    return this.safeApiCall('PUT', `/users/${userId}/biometric`, {
      biometricHash
    });
  }

  // Identity verification
  async verifyIdentity(userId) {
    return this.safeApiCall('POST', `/users/${userId}/verify`);
  }

  async rejectIdentity(userId, reason) {
    return this.safeApiCall('POST', `/users/${userId}/reject`, { reason });
  }

  // Professional records
  async getProfessionalRecords(userId) {
    return this.safeApiCall('GET', `/users/${userId}/professional-records`);
  }

  async verifyProfessionalRecord(userId, recordId) {
    return this.safeApiCall('POST', `/users/${userId}/professional-records/${recordId}/verify`);
  }

  // Export data
  async exportUsers(filters = {}) {
    return this.safeApiCall('GET', '/export/users', null, {
      params: filters,
      responseType: 'blob'
    });
  }

  async exportActivityLogs(filters = {}) {
    return this.safeApiCall('GET', '/export/activity-logs', null, {
      params: filters,
      responseType: 'blob'
    });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;