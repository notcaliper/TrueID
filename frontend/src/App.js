import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import theme from './theme'; // Dark Glassmorphism Theme

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import WalletPage from './pages/WalletPage';
import VerificationStatus from './pages/VerificationStatus';
import ProfessionalRecords from './pages/ProfessionalRecords';
import BlockchainStatus from './pages/BlockchainStatus';
import BiometricVerificationPage from './pages/BiometricVerificationPage';
import NotFound from './pages/NotFound';

// Admin Portal
import AdminRoute from './admin/components/AdminRoute';
import AdminLayout from './admin/components/AdminLayout';
import AdminLogin from './admin/pages/AdminLogin';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminRecordManagement from './admin/pages/AdminRecordManagement';
import AdminFaceVerification from './admin/pages/AdminFaceVerification';
import AdminProfessionalRecords from './admin/pages/AdminProfessionalRecords';
import AdminActivityLogs from './admin/pages/AdminActivityLogs';
import AdminSettings from './admin/pages/AdminSettings';

// Components
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
              <Route path="wallet" element={<WalletPage />} />
              <Route path="verification-status" element={<VerificationStatus />} />
              <Route path="professional-records" element={<ProfessionalRecords />} />
              <Route path="blockchain-status" element={<BlockchainStatus />} />
              <Route path="biometric-verification" element={<BiometricVerificationPage />} />
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
    </ThemeProvider>
  );
}

export default App;
