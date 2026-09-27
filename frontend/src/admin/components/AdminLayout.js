import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Chip,
  Container,
  Paper,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  DashboardRounded,
  FolderSharedRounded,
  FingerprintRounded,
  WorkspacePremiumRounded,
  HistoryRounded,
  SettingsRounded,
  ArrowBackRounded,
  LogoutRounded,
  AdminPanelSettingsRounded,
  MenuRounded
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Overview', path: '/admin', icon: <DashboardRounded fontSize="small" /> },
  { label: 'Identity Directory', path: '/admin/records', icon: <FolderSharedRounded fontSize="small" /> },
  { label: 'Face Mesh & Biometrics', path: '/admin/face-verification', icon: <FingerprintRounded fontSize="small" /> },
  { label: 'Professional Records', path: '/admin/professional-records', icon: <WorkspacePremiumRounded fontSize="small" /> },
  { label: 'Activity Logs', path: '/admin/activity-logs', icon: <HistoryRounded fontSize="small" /> },
  { label: 'Settings', path: '/admin/settings', icon: <SettingsRounded fontSize="small" /> },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isExactActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#06090e', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Top Authority Header */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          backgroundColor: 'rgba(10, 14, 23, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 }, minHeight: 64 }}>
          {/* Left: Brand & Mode */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ display: { md: 'none' } }}
            >
              <MenuRounded />
            </IconButton>

            <Box 
              onClick={() => navigate('/admin')}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
                }}
              >
                <AdminPanelSettingsRounded sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1, fontSize: '1.05rem' }}>
                  TrueID <span style={{ color: '#818cf8', fontWeight: 500 }}>GovPortal</span>
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Authority Node • Ethereum Sepolia
                </Typography>
              </Box>
            </Box>

            <Chip
              label="ADMIN CONSOLE"
              size="small"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontWeight: 700,
                fontSize: '0.65rem',
                letterSpacing: 0.5,
                height: 22
              }}
            />
          </Box>

          {/* Right: Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              startIcon={<ArrowBackRounded />}
              onClick={() => navigate('/')}
              variant="outlined"
              size="small"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                borderRadius: '8px',
                py: 0.6,
                px: 1.5,
                '&:hover': {
                  borderColor: '#818cf8',
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  color: '#fff'
                }
              }}
            >
              Citizen Portal
            </Button>

            <Tooltip title="Sign Out">
              <IconButton 
                onClick={handleLogout}
                size="small"
                sx={{
                  color: '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  p: 0.8,
                  '&:hover': {
                    color: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    borderColor: 'rgba(239, 68, 68, 0.3)'
                  }
                }}
              >
                <LogoutRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>

        {/* Desktop Navigation Tabs */}
        <Box 
          sx={{ 
            display: { xs: 'none', md: 'flex' },
            px: 4, 
            gap: 1, 
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            overflowX: 'auto'
          }}
        >
          {navItems.map((item) => {
            const active = isExactActive(item.path);
            return (
              <Button
                key={item.path}
                component={NavLink}
                to={item.path}
                startIcon={item.icon}
                sx={{
                  color: active ? '#818cf8' : '#94a3b8',
                  borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
                  borderRadius: 0,
                  py: 1.2,
                  px: 2,
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  fontWeight: active ? 700 : 500,
                  letterSpacing: -0.1,
                  backgroundColor: active ? 'rgba(99, 102, 241, 0.06)' : 'transparent',
                  '&:hover': {
                    color: '#fff',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)'
                  }
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 260,
            backgroundColor: '#0a0e17',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            p: 2
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 2, px: 1, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
          Authority Navigation
        </Typography>
        <List sx={{ p: 0 }}>
          {navItems.map((item) => {
            const active = isExactActive(item.path);
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: '8px',
                    backgroundColor: active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    color: active ? '#818cf8' : '#cbd5e1'
                  }}
                >
                  <ListItemIcon sx={{ color: active ? '#818cf8' : '#94a3b8', minWidth: 36 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 700 : 500 }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1440, mx: 'auto', width: '100%' }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
