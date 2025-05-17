import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './utils/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RecordManagement from './pages/RecordManagement';
import ActivityLogs from './pages/ActivityLogs';
import Settings from './pages/Settings';
import BlockchainHistory from './pages/BlockchainHistory';
import Debug from './pages/Debug';

// Components
import MainLayout from './components/MainLayout';
import PrivateRoute from './components/PrivateRoute';

// Admin Layout wrapper
const AdminLayout = () => {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/debug" element={<Debug />} />
          
          {/* Redirect root to admin dashboard */}
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          
          {/* Legacy routes - redirect to new admin routes */}
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          
          {/* Protected admin routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="records" element={<RecordManagement />} />
              <Route path="blockchain" element={<BlockchainHistory />} />
              <Route path="activity-logs" element={<ActivityLogs />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
          
          {/* Redirect any unknown routes to admin dashboard */}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
