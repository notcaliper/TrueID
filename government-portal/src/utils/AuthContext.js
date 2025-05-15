import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

// Development mode flag - set to true to enable dev features
const DEV_MODE = true;

// Create context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  
  // Check if token exists and is valid on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Check if token is expired
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            // Token expired
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
          } else {
            // Set auth header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Get user profile
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/profile`);
            
            setUser(response.data);
            setIsAuthenticated(true);
          }
        } catch (err) {
          console.error('Auth error:', err);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
          setError('Authentication failed. Please login again.');
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    // Development bypass login
    if (DEV_MODE && email === 'dev' && password === 'dev') {
      console.log('DEV MODE: Bypassing authentication');
      
      // Create mock user data
      const mockUser = {
        id: 999,
        username: 'dev_admin',
        fullName: 'Development Admin',
        email: 'dev@example.com',
        roles: ['ADMIN_ROLE', 'GOVERNMENT_ROLE']
      };
      
      // Create mock token
      const mockToken = 'dev_token_' + Date.now();
      
      // Save token to localStorage
      localStorage.setItem('token', mockToken);
      
      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
      
      setIsAuthenticated(true);
      setUser(mockUser);
      navigate('/');
      
      setLoading(false);
      return true;
    }
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setIsAuthenticated(true);
      setUser(user);
      navigate('/');
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };
  
  // Context value
  const value = {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
