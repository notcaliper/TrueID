import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ColorModeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Citizen Identity Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import TrustVerification from './pages/TrustVerification';
import VerifiableCredentials from './pages/VerifiableCredentials';
import BlockchainLedger from './pages/BlockchainLedger';
import BiometricVault from './pages/BiometricVault';
import NotFound from './pages/NotFound';

// Government & Authority Admin Portal
import AdminRoute from './admin/components/AdminRoute';
import AdminLayout from './admin/components/AdminLayout';
import AdminLogin from './admin/pages/AdminLogin';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminRecordManagement from './admin/pages/AdminRecordManagement';
import AdminFaceVerification from './admin/pages/AdminFaceVerification';
import AdminProfessionalRecords from './admin/pages/AdminProfessionalRecords';
import AdminActivityLogs from './admin/pages/AdminActivityLogs';
import AdminSettings from './admin/pages/AdminSettings';

// Shared Components
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <ColorModeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Citizen Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="verification-status" element={<TrustVerification />} />
              <Route path="professional-records" element={<VerifiableCredentials />} />
              <Route path="blockchain-status" element={<BlockchainLedger />} />
              <Route path="biometric-verification" element={<BiometricVault />} />
            </Route>

            {/* Government / Authority Admin Portal */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="records" element={<AdminRecordManagement />} />
              <Route path="face-verification" element={<AdminFaceVerification />} />
              <Route path="professional-records" element={<AdminProfessionalRecords />} />
              <Route path="activity-logs" element={<AdminActivityLogs />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ColorModeProvider>
  );
}

export default App;
