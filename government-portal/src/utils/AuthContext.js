import React, { createContext, useState, useContext, useEffect } from 'react';
import ApiService from '../services/ApiService';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

// No development mode in production

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [apiHealthStatus, setApiHealthStatus] = useState({});

  /**
   * Decode JWT token and extract user information
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded token or null if invalid
   */
  const decodeToken = (token) => {
    if (!token) return null;
    
    try {
      const decoded = jwtDecode(token);
      console.log('Decoded token:', decoded);
      
      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (decoded.exp && decoded.exp < currentTime) {
        console.warn('Token has expired');
        return null;
      }
      
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Check token on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setLoading(false);
          return;
        }
        
        // First try to decode the token
        const decoded = decodeToken(token);
        if (!decoded) {
          // Token is invalid or expired
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setLoading(false);
          return;
        }
        
        // Try to get user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setCurrentUser(parsedUser);
            setLoading(false);
            return;
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }
        
        // If we don't have a stored user, check if the profile endpoint is available
        const isHealthy = await ApiService.checkEndpointHealth('/admin/profile');
        if (!isHealthy) {
          console.warn('Auth API endpoint is not available');
          // Still set the user from the token if possible
          if (decoded.id && decoded.username) {
            const tokenUser = {
              id: decoded.id,
              name: decoded.username || decoded.name,
              email: decoded.email,
              role: decoded.role
            };
            setCurrentUser(tokenUser);
          }
          setLoading(false);
          return;
        }

        // Try to get the user profile from API
        const result = await ApiService.getAdminProfile();
        if (result.success) {
          setCurrentUser(result.data);
          localStorage.setItem('user', JSON.stringify(result.data));
        } else {
          // If we can't get the profile but have a valid token, create a user from the token
          if (decoded.id && decoded.username) {
            const tokenUser = {
              id: decoded.id,
              name: decoded.username || decoded.name,
              email: decoded.email,
              role: decoded.role
            };
            setCurrentUser(tokenUser);
          } else {
            // Clear invalid token
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Handle user inactivity
  useEffect(() => {
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    // Set up event listeners for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    
    // Check for inactivity
    const inactivityInterval = setInterval(() => {
      const currentTime = Date.now();
      if (currentUser && currentTime - lastActivity > INACTIVITY_TIMEOUT) {
        logout();
        alert('You have been logged out due to inactivity.');
      }
    }, 60000); // Check every minute
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(inactivityInterval);
    };
  }, [currentUser, lastActivity]);

  // Monitor API health status for critical endpoints
  useEffect(() => {
    const checkCriticalEndpoints = async () => {
      const criticalEndpoints = [
        '/admin/profile',
        '/admin/users',
        '/admin/logs',
        '/network/status',
        '/blockchain/record'
      ];
      
      const results = await ApiService.checkMultipleEndpoints(criticalEndpoints);
      setApiHealthStatus(results);
    };
    
    // Initial check
    checkCriticalEndpoints();
    
    // Set up interval to check periodically
    const healthCheckInterval = setInterval(checkCriticalEndpoints, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(healthCheckInterval);
  }, []);

  // No development mode in production

  const login = async (email, password) => {
    try {
      setAuthError(null);
      console.log('Attempting login with:', { email });
      
      // Perform login through the API
      const result = await ApiService.login({ email, password });
      console.log('Login API response:', result);
      
      if (result.success) {
        // Handle different response formats from the backend
        if (result.data && result.data.data && result.data.data.token) {
          // New format: { success: true, data: { data: { token, refreshToken, user } } }
          const { token, refreshToken, user } = result.data.data;
          localStorage.setItem('authToken', token);
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
          if (user) localStorage.setItem('user', JSON.stringify(user));
          setCurrentUser(user);
        } else if (result.data && result.data.token) {
          // Legacy format: { success: true, data: { token, admin } }
          localStorage.setItem('authToken', result.data.token);
          if (result.data.refreshToken) localStorage.setItem('refreshToken', result.data.refreshToken);
          if (result.data.admin) {
            localStorage.setItem('user', JSON.stringify(result.data.admin));
            setCurrentUser(result.data.admin);
          }
        } else {
          console.error('Unexpected response format:', result);
          setAuthError('Invalid response format from server');
          return { success: false, error: 'Invalid response format from server' };
        }
        
        console.log('Login successful, token stored in localStorage');
        return { success: true };
      } else {
        setAuthError(result.error || 'Login failed');
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'An unexpected error occurred';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
  };

  const updateUserProfile = async (profileData) => {
    try {
      const result = await ApiService.updateAdminProfile(profileData);
      
      if (result.success) {
        setCurrentUser({
          ...currentUser,
          ...result.data
        });
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    authError,
    updateUserProfile,
    apiHealthStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
