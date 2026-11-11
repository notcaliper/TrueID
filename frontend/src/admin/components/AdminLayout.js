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
  MenuRounded,
  LightModeRounded,
  DarkModeRounded
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useColorMode } from '../../context/ThemeContext';
import { getAdminThemeTokens } from '../utils/adminTheme';

const navItems = [
  { label: 'Overview', path: '/admin', icon: <DashboardRounded fontSize="small" /> },
  { label: 'Identity Directory', path: '/admin/records', icon: <FolderSharedRounded fontSize="small" /> },
  { label: 'Face Mesh & Biometrics', path: '/admin/face-verification', icon: <FingerprintRounded fontSize="small" /> },
  { label: 'Professional Records', path: '/admin/professional-records', icon: <WorkspacePremiumRounded fontSize="small" /> },
  { label: 'Activity Logs', path: '/admin/activity-logs', icon: <HistoryRounded fontSize="small" /> },
  { label: 'Settings', path: '/admin/settings', icon: <SettingsRounded fontSize="small" /> },
];

const AdminLayout = () => {
  const { logout } = useAuth();
  const { toggleTheme, isLight } = useColorMode();
  const t = getAdminThemeTokens(isLight);
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
    <Box sx={{ minHeight: '100vh', backgroundColor: t.bg, color: t.textPrimary, display: 'flex', flexDirection: 'column' }}>
      {/* Top Authority Header */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          backgroundColor: t.paper,
          borderBottom: `1px solid ${t.border}`,
          color: t.textPrimary,
          backgroundImage: 'none',
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
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  background: isLight 
                    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' 
                    : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isLight ? '0 4px 12px rgba(37, 99, 235, 0.25)' : '0 0 15px rgba(59, 130, 246, 0.4)'
                }}
              >
                <AdminPanelSettingsRounded sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1, fontSize: '1.05rem', color: t.textPrimary }}>
                  TrueID <span style={{ color: t.primary, fontWeight: 700 }}>GovPortal</span>
                </Typography>
                <Typography variant="caption" sx={{ color: t.textMuted, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Authority Node • Ethereum Sepolia
                </Typography>
              </Box>
            </Box>

            <Chip
              label="ADMIN CONSOLE"
              size="small"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                backgroundColor: t.primaryBg,
                color: t.primary,
                border: `1px solid ${t.primaryBorder}`,
                fontWeight: 700,
                fontSize: '0.65rem',
                letterSpacing: 0.5,
                height: 22
              }}
            />
          </Box>

          {/* Right: Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title={isLight ? 'Switch to Dark Mode' : 'Switch to White / Light Mode'}>
              <IconButton
                onClick={toggleTheme}
                size="small"
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`,
                  backgroundColor: isLight ? '#f1f5f9' : 'transparent',
                  color: t.textPrimary,
                  '&:hover': {
                    backgroundColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'
                  }
                }}
              >
                {isLight ? <DarkModeRounded sx={{ fontSize: 18 }} /> : <LightModeRounded sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>

            <Button
              startIcon={<ArrowBackRounded />}
              onClick={() => navigate('/')}
              variant="outlined"
              size="small"
              sx={{
                borderColor: t.border,
                color: t.textSecondary,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                borderRadius: '8px',
                py: 0.6,
                px: 1.5,
                '&:hover': {
                  borderColor: t.primary,
                  backgroundColor: t.primaryBg,
                  color: t.primary
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
                  color: t.textMuted,
                  border: `1px solid ${t.border}`,
                  borderRadius: '8px',
                  p: 0.8,
                  '&:hover': {
                    color: t.error,
                    backgroundColor: t.errorBg,
                    borderColor: t.errorBorder
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
            borderTop: `1px solid ${t.border}`,
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
                  color: active ? t.primary : t.textMuted,
                  borderBottom: active ? `2px solid ${t.primary}` : '2px solid transparent',
                  borderRadius: 0,
                  py: 1.2,
                  px: 2,
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  fontWeight: active ? 700 : 500,
                  letterSpacing: -0.1,
                  backgroundColor: active ? t.primaryBg : 'transparent',
                  '&:hover': {
                    color: active ? t.primary : t.textPrimary,
                    backgroundColor: active ? t.primaryBg : t.surfaceHover
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
            backgroundColor: t.paper,
            borderRight: `1px solid ${t.border}`,
            p: 2
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ color: t.textMuted, mb: 2, px: 1, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
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
                    backgroundColor: active ? t.primaryBg : 'transparent',
                    color: active ? t.primary : t.textSecondary
                  }}
                >
                  <ListItemIcon sx={{ color: active ? t.primary : t.textMuted, minWidth: 36 }}>
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
