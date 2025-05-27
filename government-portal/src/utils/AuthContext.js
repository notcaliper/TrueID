import React, { createContext, useState, useContext, useEffect } from 'react';
import ApiService from '../services/ApiService';

// Development mode configuration
const DEV_MODE = process.env.NODE_ENV === 'development';
const DEV_USER = {
  id: 'dev-admin-001',
  name: 'Development Admin',
  email: 'dev@example.gov',
  role: 'admin',
  department: 'IT Security',
  lastLogin: new Date().toISOString()
};

const AuthContext = createContext();

// Check if dev mode is enabled in localStorage
const getInitialDevMode = () => {
  // Set developer mode to true by default
  const savedDevMode = localStorage.getItem('devMode');
  return savedDevMode ? JSON.parse(savedDevMode) : true;
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [devMode, setDevMode] = useState(getInitialDevMode);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token || devMode) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [devMode]);

  // Save dev mode state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('devMode', JSON.stringify(devMode));
  }, [devMode]);

  const fetchUserProfile = async () => {
    try {
      // Always enable developer mode for this session
      setDevMode(true);
      
      // Set a mock admin user for dev mode
      setCurrentUser({
        id: 'dev-admin',
        name: 'Developer Admin',
        email: 'dev@example.com',
        role: 'admin',
        permissions: ['all'],
        isDevMode: true
      });
      
      // Only try to fetch real user if not in dev mode
      if (!devMode) {
        try {
          const response = await ApiService.getCurrentUser();
          setCurrentUser(response.user);
        } catch (apiErr) {
          console.log('Using dev mode instead of API');
        }
      }
    } catch (err) {
      console.error('Error in profile setup:', err);
      // Don't logout in dev mode
      if (!devMode) logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError('');
      const response = await ApiService.login(email, password);
      localStorage.setItem('authToken', response.token);
      ApiService.setAuthToken(response.token);
      setCurrentUser(response.user);
      return { success: true };
    } catch (error) {
      setError(error.message || 'Failed to login');
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    ApiService.setAuthToken(null);
    setCurrentUser(null);
    // Don't disable dev mode on logout - it should persist until explicitly toggled off
  };

  const toggleDevMode = () => {
    setDevMode(prevMode => !prevMode);
  };

  const enableDevMode = () => {
    setDevMode(true);
  };

  const disableDevMode = () => {
    setDevMode(false);
  };

  const value = {
    currentUser,
    login,
    logout,
    error,
    loading,
    devMode,
    toggleDevMode,
    enableDevMode,
    disableDevMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
