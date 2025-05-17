import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

/**
 * PrivateRoute component that protects routes requiring authentication
 * Redirects to login page if user is not authenticated
 */
const PrivateRoute = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  
  // Check if there's a token in localStorage even if currentUser is not set
  const hasToken = Boolean(localStorage.getItem('authToken'));

  // Show loading state if auth is still being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login page with return URL
  if (!currentUser && !hasToken) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default PrivateRoute;
