import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import IdentitySetup from './pages/IdentitySetup';
import ProfessionalRecords from './pages/ProfessionalRecords';
import DocumentStorage from './pages/DocumentStorage';
import VerificationCenter from './pages/VerificationCenter';
import AdminPanel from './pages/AdminPanel';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, requiresIdentity = false, requiredRole = null }) => {
  const { isAuthenticated, identity, hasRole, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiresIdentity && !identity) {
    return <Navigate to="/setup" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Router Component
const AppRouter = () => {
  const { isAuthenticated, identity, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {isAuthenticated && <Navbar />}
      
      <Box component="main" sx={{ flexGrow: 1, pt: isAuthenticated ? 8 : 0 }}>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to={identity ? "/dashboard" : "/setup"} replace /> : 
                <LoginPage />
            } 
          />

          {/* Identity Setup Route (for new users) */}
          <Route
            path="/setup"
            element={
              <ProtectedRoute>
                {identity ? <Navigate to="/dashboard" replace /> : <IdentitySetup />}
              </ProtectedRoute>
            }
          />

          {/* Protected Routes (require authentication and identity) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiresIdentity>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/professional"
            element={
              <ProtectedRoute requiresIdentity>
                <ProfessionalRecords />
              </ProtectedRoute>
            }
          />

          <Route
            path="/documents"
            element={
              <ProtectedRoute requiresIdentity>
                <DocumentStorage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/verification"
            element={
              <ProtectedRoute requiresIdentity>
                <VerificationCenter />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiresIdentity requiredRole="Admin">
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route
            path="/"
            element={
              <Navigate 
                to={
                  isAuthenticated ? 
                    (identity ? "/dashboard" : "/setup") : 
                    "/login"
                } 
                replace 
              />
            }
          />

          {/* Catch-all Route */}
          <Route
            path="*"
            element={
              <Navigate 
                to={
                  isAuthenticated ? 
                    (identity ? "/dashboard" : "/setup") : 
                    "/login"
                } 
                replace 
              />
            }
          />
        </Routes>
      </Box>
    </Box>
  );
};

// Main App Component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRouter />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
