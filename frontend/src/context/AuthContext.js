import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authAPI, userAPI } from '../services/api.service';

// Helper to guarantee consistent snake_case & camelCase attributes across the app
const normalizeUser = (u) => {
  if (!u) return null;
  const govId = u.government_id || u.governmentId || '';
  const wallet = u.wallet_address || u.walletAddress || '';
  const did = u.did || (wallet ? `did:trueid:${wallet}` : '');
  return {
    ...u,
    government_id: govId,
    governmentId: govId,
    wallet_address: wallet,
    walletAddress: wallet,
    did: did
  };
};

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mfaPending, setMfaPending] = useState(false);
  const [tempToken, setTempToken] = useState(null);

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
            if (decodedToken.type === 'admin') {
              const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
              });
              const data = await response.json();
              if (response.ok && data.tokens) {
                localStorage.setItem('accessToken', data.tokens.accessToken);
                localStorage.setItem('refreshToken', data.tokens.refreshToken);
              } else {
                throw new Error('Admin refresh failed');
              }
            } else {
              const response = await authAPI.refreshToken(refreshToken);
              const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.tokens;
              
              localStorage.setItem('accessToken', newAccessToken);
              localStorage.setItem('refreshToken', newRefreshToken);
              
              const candidateUser = response.data.user || (storedUser ? JSON.parse(storedUser) : null);
              if (candidateUser) {
                const normalized = normalizeUser(candidateUser);
                setUser(normalized);
                localStorage.setItem('user', JSON.stringify(normalized));
              }
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
            const initialUser = normalizeUser(JSON.parse(storedUser));
            setUser(initialUser);
          }
          
          // Refresh user profile from authoritative database if regular citizen account
          if (decodedToken.type === 'user') {
            try {
              const profileRes = await userAPI.getProfile();
              if (profileRes?.data?.user) {
                const freshUser = normalizeUser(profileRes.data.user);
                setUser(freshUser);
                localStorage.setItem('user', JSON.stringify(freshUser));
              }
            } catch (profErr) {
              // Silent fallback to stored user if offline
            }
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
      const payload = {
        ...userData,
        name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
      };
      const response = await authAPI.register(payload);
      const { user: newUser, tokens } = response.data;
      
      const normalized = normalizeUser(newUser);
      // Store tokens and user data
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(normalized));
      
      setUser(normalized);
      return { success: true, user: normalized };
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
      
      // Check if MFA is required
      if (response.data.mfaRequired) {
        setMfaPending(true);
        setTempToken(response.data.tempToken);
        return { success: false, mfaRequired: true, tempToken: response.data.tempToken };
      }
      
      const { user: loggedInUser, tokens } = response.data;
      
      const normalized = normalizeUser(loggedInUser);
      // Store tokens and user data
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(normalized));
      
      setUser(normalized);
      setMfaPending(false);
      setTempToken(null);
      return { success: true, user: normalized };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Verify MFA code during login
  const verifyMFA = async (mfaToken) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!tempToken) {
        throw new Error('No MFA session available. Please login again.');
      }
      
      const response = await authAPI.verifyMFALogin(tempToken, mfaToken);
      const { user: loggedInUser, tokens } = response.data;
      
      const normalized = normalizeUser(loggedInUser);
      // Store tokens and user data
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(normalized));
      
      setUser(normalized);
      setMfaPending(false);
      setTempToken(null);
      return { success: true, user: normalized };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'MFA verification failed.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Cancel MFA login and reset state
  const cancelMFALogin = () => {
    setMfaPending(false);
    setTempToken(null);
  };
  
  // Verify user biometric data (for verification purposes only, not login)
  const verifyBiometric = async (userId, facemeshData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Format the request data to match backend expectations
      const requestData = {
        userId: userId,
        facemeshData: {
          landmarks: facemeshData.landmarks,
          timestamp: facemeshData.timestamp,
          imageData: facemeshData.imageData
        }
      };

      console.log('Sending biometric verification request:', {
        userId: requestData.userId,
        hasLandmarks: !!requestData.facemeshData.landmarks,
        timestamp: requestData.facemeshData.timestamp
      });

      const response = await authAPI.verifyBiometric(requestData);
      const data = response?.data || response;
      console.log('Biometric verification response:', data);

      if (data && (data.success || data.verified)) {
        return {
          success: true,
          verified: data.verified !== undefined ? data.verified : true,
          similarityScore: data.similarityScore,
          message: data.message
        };
      } else {
        throw new Error(data?.error || data?.message || 'Verification failed');
      }
    } catch (err) {
      const errorMessage = err.message || 'Biometric verification failed.';
      console.error('Biometric verification error:', errorMessage);
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
    mfaPending,
    tempToken,
    register,
    login,
    logout,
    refreshToken,
    isAuthenticated,
    verifyBiometric,
    verifyMFA,
    cancelMFALogin,
    setUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
