import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { ThemeProvider } from './utils/ThemeContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RecordManagement from './pages/RecordManagement';
import ActivityLogs from './pages/ActivityLogs';
import Settings from './pages/Settings';
import ProfessionalRecords from './pages/ProfessionalRecords';
import FaceVerification from './pages/FaceVerification';

// Components
import MainLayout from './components/MainLayout';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/records" element={
            <ProtectedRoute>
              <MainLayout>
                <RecordManagement />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/activity-logs" element={
            <ProtectedRoute>
              <MainLayout>
                <ActivityLogs />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <MainLayout>
                <Settings />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/professional-records" element={
            <ProtectedRoute>
              <MainLayout>
                <ProfessionalRecords />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/face-verification" element={
            <ProtectedRoute>
              <MainLayout>
                <FaceVerification />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          {/* Redirect any unknown routes to Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
