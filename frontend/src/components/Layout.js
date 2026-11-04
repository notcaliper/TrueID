import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Chip,
  Avatar,
  Tooltip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Container,
  useTheme
} from '@mui/material';
import {
  SearchRounded,
  LightModeRounded,
  DarkModeRounded,
  NotificationsNoneRounded,
  ShieldRounded,
  DashboardRounded,
  PersonRounded,
  AccountBalanceWalletRounded,
  VerifiedUserRounded,
  FingerprintRounded,
  WorkspacePremiumRounded,
  SecurityRounded,
  AdminPanelSettingsRounded,
  LogoutRounded,
  ContentCopyRounded,
  QrCode2Rounded
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext';

const navTabs = [
  { label: 'Dashboard', path: '/', icon: <DashboardRounded sx={{ fontSize: 16 }} /> },
  { label: 'Profile', path: '/profile', icon: <PersonRounded sx={{ fontSize: 16 }} /> },
  { label: 'Verification', path: '/verification-status', icon: <VerifiedUserRounded sx={{ fontSize: 16 }} /> },
  { label: 'Face Scan', path: '/biometric-verification', icon: <FingerprintRounded sx={{ fontSize: 16 }} /> },
  { label: 'My Documents', path: '/professional-records', icon: <WorkspacePremiumRounded sx={{ fontSize: 16 }} /> },
  { label: 'Wallet', path: '/wallet', icon: <AccountBalanceWalletRounded sx={{ fontSize: 16 }} /> },
  { label: 'Blockchain Status', path: '/blockchain-status', icon: <SecurityRounded sx={{ fontSize: 16 }} /> },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const { mode, toggleTheme, isLight } = useColorMode();
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const citizenAddress = user?.wallet_address || user?.avax_address || '0xc628d3e2b63cCeb6038Ffe05A8E18B1e9304BBC5';

  const isTabActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(citizenAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default, color: theme.palette.text.primary, display: 'flex', flexDirection: 'column' }}>
      {/* Top Blockscan Header */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: isLight ? '#ffffff' : '#181a1c',
          borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
          color: theme.palette.text.primary,
          zIndex: 1100
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 }, minHeight: 64, gap: 2 }}>
          {/* Left Brand */}
          <Box
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', flexShrink: 0 }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                bgcolor: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <ShieldRounded sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: theme.palette.text.primary }}>
              TrueID
            </Typography>
          </Box>

          {/* Center Search Bar (Blockscan Style) */}
          <Box sx={{ maxWidth: 540, width: '100%', display: { xs: 'none', md: 'block' } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search Citizen DID, Credential, National ID or Proof Hash..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: isLight ? '#94a3b8' : '#6b7280', fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Box sx={{ px: 0.8, py: 0.2, bgcolor: isLight ? '#f1f5f9' : '#282a2d', border: `1px solid ${isLight ? '#e2e8f0' : '#3f4246'}`, borderRadius: 1, fontSize: '0.68rem', fontWeight: 600, color: isLight ? '#64748b' : '#9ca3af' }}>
                      /
                    </Box>
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: isLight ? '#f8fafc' : '#111214',
                  borderRadius: '10px',
                  fontSize: '0.825rem',
                  color: theme.palette.text.primary,
                  '& fieldset': { borderColor: isLight ? '#e2e8f0' : '#282a2d' },
                  '&:hover fieldset': { borderColor: isLight ? '#cbd5e1' : '#3f4246' },
                  '&.Mui-focused fieldset': { borderColor: '#2563eb' }
                }
              }}
            />
          </Box>

          {/* Right Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexShrink: 0 }}>
            {/* Theme Toggle Button (Exact Blockscan moon icon) */}
            <Tooltip title={isLight ? 'Switch to Dark Mode' : 'Switch to White / Light Mode'}>
              <IconButton
                onClick={toggleTheme}
                size="small"
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                  bgcolor: isLight ? '#f8fafc' : '#111214',
                  color: isLight ? '#475569' : '#f8fafc',
                  position: 'relative'
                }}
              >
                {isLight ? <DarkModeRounded sx={{ fontSize: 18 }} /> : <LightModeRounded sx={{ fontSize: 18 }} />}
                {/* Active indicator dot */}
                <Box sx={{ position: 'absolute', top: 5, right: 5, width: 5, height: 5, borderRadius: '50%', bgcolor: '#2563eb' }} />
              </IconButton>
            </Tooltip>

            {/* Notification Bell */}
            <IconButton
              size="small"
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                bgcolor: isLight ? '#f8fafc' : '#111214',
                color: isLight ? '#475569' : '#f8fafc'
              }}
            >
              <NotificationsNoneRounded sx={{ fontSize: 18 }} />
            </IconButton>

            {/* User Profile Avatar Pill */}
            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                p: 0.5,
                pl: 1,
                borderRadius: '8px',
                border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                bgcolor: isLight ? '#f8fafc' : '#111214',
                '&:hover': { bgcolor: isLight ? '#f1f5f9' : '#1e2124' }
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: theme.palette.text.primary, display: { xs: 'none', sm: 'block' } }}>
                {user?.name || user?.username || 'NotAkshay'}
              </Typography>
              <Avatar
                sx={{
                  width: 26,
                  height: 26,
                  bgcolor: '#2563eb',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}
              >
                {(user?.name || user?.username || 'U')[0].toUpperCase()}
              </Avatar>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                sx: {
                  mt: 1,
                  bgcolor: isLight ? '#ffffff' : '#181a1c',
                  border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  borderRadius: 2
                }
              }}
            >
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
                <PersonRounded fontSize="small" sx={{ mr: 1, color: '#64748b' }} /> Identity Vault
              </MenuItem>
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/admin'); }}>
                <AdminPanelSettingsRounded fontSize="small" sx={{ mr: 1, color: '#64748b' }} /> Authority Portal
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ color: '#ef4444' }}>
                <LogoutRounded fontSize="small" sx={{ mr: 1 }} /> Sign Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>

        {/* Blockscan Horizontal Tabs Bar */}
        <Box
          sx={{
            display: 'flex',
            px: { xs: 2, md: 4 },
            gap: 1,
            overflowX: 'auto',
            borderTop: `1px solid ${isLight ? '#f1f5f9' : '#222529'}`,
            bgcolor: isLight ? '#ffffff' : '#181a1c',
            '&::-webkit-scrollbar': { height: 0 }
          }}
        >
          {navTabs.map((tab) => {
            const active = isTabActive(tab.path);
            return (
              <Button
                key={tab.path}
                component={Link}
                to={tab.path}
                startIcon={tab.icon}
                sx={{
                  color: active ? '#2563eb' : isLight ? '#64748b' : '#8b949e',
                  borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
                  borderRadius: 0,
                  py: 1.2,
                  px: 1.8,
                  textTransform: 'none',
                  fontSize: '0.84rem',
                  fontWeight: active ? 700 : 500,
                  whiteSpace: 'nowrap',
                  bgcolor: 'transparent',
                  '&:hover': {
                    bgcolor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
                    color: active ? '#2563eb' : isLight ? '#0f172a' : '#ffffff'
                  }
                }}
              >
                {tab.label}
              </Button>
            );
          })}
        </Box>
      </AppBar>

      {/* Main Content Viewport */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto', width: '100%' }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
