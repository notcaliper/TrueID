import React, { createContext, useState, useContext, useEffect } from 'react';
import ApiService from '../services/ApiService';

const AuthContext = createContext();



export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await ApiService.getCurrentUser();
      setCurrentUser(response.user);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setError('');
      const response = await ApiService.login(username, password);
      
      // Handle the token format from the backend
      // Backend returns { tokens: { accessToken, refreshToken }, admin: {...} }
      const token = response.tokens?.accessToken || response.token;
      
      if (!token) {
        throw new Error('No authentication token received');
      }
      
      localStorage.setItem('authToken', token);
      ApiService.setAuthToken(token);
      
      // Set current user from admin object
      setCurrentUser(response.admin || response.user);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to login');
      return { success: false, error: error.response?.data?.message || error.message || 'Invalid credentials' };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    ApiService.setAuthToken(null);
    setCurrentUser(null);
  };

  const toggleDevMode = () => {
    setDevMode(prev => !prev);
  };

  const value = {
    currentUser,
    login,
    logout,
    error,
    loading,
    devMode,
    toggleDevMode
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
