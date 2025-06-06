import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';

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
import TestPage from './pages/TestPage';
import TestBiometric from './pages/TestBiometric';

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

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

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
            <Route path="/test" element={<TestPage />} />
            <Route path="/test-biometric" element={<TestBiometric />} />
            
            {/* Protected routes */}
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
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
