import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      const authenticated = await authService.init();
      
      if (authenticated) {
        const principalObj = authService.getPrincipal();
        const principalText = authService.getPrincipalText();
        
        setIsAuthenticated(true);
        setPrincipal(principalText);
        
        // Try to get user identity and role
        try {
          const userIdentity = await authService.getIdentity();
          setIdentity(userIdentity);
          
          const role = await authService.getUserRole();
          setUserRole(role);
        } catch (identityError) {
          console.log('User identity not found - new user');
          setIdentity(null);
          setUserRole(null);
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.login();
      const principalText = authService.getPrincipalText();
      
      setIsAuthenticated(true);
      setPrincipal(principalText);
      
      // Try to get user identity and role
      try {
        const userIdentity = await authService.getIdentity();
        setIdentity(userIdentity);
        
        const role = await authService.getUserRole();
        setUserRole(role);
      } catch (identityError) {
        console.log('User identity not found - new user');
        setIdentity(null);
        setUserRole(null);
      }
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      
      setIsAuthenticated(false);
      setPrincipal(null);
      setUserRole(null);
      setIdentity(null);
      setError(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createUserIdentity = async (biometricHash, professionalDataHash, metadata) => {
    try {
      setLoading(true);
      setError(null);
      
      const newIdentity = await authService.createIdentity(
        biometricHash,
        professionalDataHash,
        metadata
      );
      
      setIdentity(newIdentity);
      
      // Refresh user role
      const role = await authService.getUserRole();
      setUserRole(role);
      
      return newIdentity;
    } catch (error) {
      console.error('Failed to create identity:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (!isAuthenticated) return;
    
    try {
      const userIdentity = await authService.getIdentity();
      setIdentity(userIdentity);
      
      const role = await authService.getUserRole();
      setUserRole(role);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const hasRole = (requiredRole) => {
    if (!userRole) return false;
    
    const roleHierarchy = {
      'User': 1,
      'Government': 2,
      'Admin': 3
    };
    
    const userRoleLevel = roleHierarchy[userRole.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
    
    return userRoleLevel >= requiredRoleLevel;
  };

  const isNewUser = () => {
    return isAuthenticated && !identity;
  };

  const value = {
    // State
    isAuthenticated,
    principal,
    userRole,
    identity,
    loading,
    error,
    
    // Methods
    login,
    logout,
    createUserIdentity,
    refreshUserData,
    hasRole,
    isNewUser,
    
    // Auth service access
    authService,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
