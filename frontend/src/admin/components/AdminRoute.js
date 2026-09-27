import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../../components/LoadingScreen';

/**
 * Route protection wrapper for Admin & Authority views
 */
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Check if authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // In standalone / dev mode, allow access. If user object has role, allow ADMIN/SUPER_ADMIN.
  const isAdmin = !user || !user.role || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isAdmin;
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
