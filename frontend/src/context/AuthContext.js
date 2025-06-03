import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authAPI } from '../services/api.service';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('user');

        if (!accessToken || !refreshToken) {
          setLoading(false);
          return;
        }

        // Check if token is expired
        const decodedToken = jwtDecode(accessToken);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
          // Token is expired, try to refresh
          try {
            const response = await authAPI.refreshToken(refreshToken);
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.tokens;
            
            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            }
          } catch (refreshError) {
            // Refresh token is invalid, clear storage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          }
        } else {
          // Token is still valid
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError('Authentication error. Please try logging in again.');
        
        // Clear storage on error
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Register a new user
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.register(userData);
      const { user: newUser, tokens } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Login a user with username and password
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      // Make sure we have username and password
      if (!credentials.username || !credentials.password) {
        throw new Error('Username and password are required');
      }
      
      const response = await authAPI.login(credentials);
      const { user: loggedInUser, tokens } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  // Verify user biometric data (for verification purposes only, not login)
  const verifyBiometric = async (userId, facemeshData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.verifyBiometric({ userId, facemeshData });
      return { success: true, verified: response.data.verified };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Biometric verification failed.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout a user
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Refresh the user token
  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      logout();
      return { success: false, error: 'No refresh token available' };
    }
    
    try {
      const response = await authAPI.refreshToken(refreshToken);
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.tokens;
      
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      return { success: true };
    } catch (err) {
      logout();
      return { success: false, error: 'Failed to refresh token' };
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Provide the context value
  const contextValue = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    refreshToken,
    isAuthenticated,
    verifyBiometric,
    setUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
