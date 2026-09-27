import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { 
  AppBar, Box, Toolbar, IconButton,
  Container, Avatar, Typography, Chip
} from '@mui/material';
import { Menu as MenuIcon, NotificationsOutlined } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

const Layout = () => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  
  const getPageTitle = (pathname) => {
    if (pathname === '/' || pathname.startsWith('/dashboard')) return 'Command Dashboard';
    if (pathname.startsWith('/profile')) return 'Identity Vault';
    if (pathname.startsWith('/biometric')) return 'Biometric Verification Studio';
    if (pathname.startsWith('/verification')) return 'Trust & Compliance Score';
    if (pathname.startsWith('/blockchain')) return 'Blockchain Ledger State';
    if (pathname.startsWith('/wallet')) return 'Web3 Asset Wallet';
    if (pathname.startsWith('/professional') || pathname.startsWith('/records')) return 'Professional Credentials';
    return 'TrueID Platform';
  };
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0e17' }}>
      {/* Top Application Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: 'calc(100% - 84px)' },
          ml: { sm: '84px' },
          background: 'rgba(10, 14, 23, 0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          color: '#f8fafc',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" fontWeight={700} sx={{ 
              color: '#f8fafc',
              letterSpacing: '-0.02em',
              fontSize: { xs: '1rem', sm: '1.15rem' },
            }}>
              {getPageTitle(location.pathname)}
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Network / System Status Pill */}
          <Chip
            size="small"
            icon={<Box component="span" className="status-dot-emerald" sx={{ ml: 1, mr: -0.5 }} />}
            label="Ethereum Sepolia"
            sx={{
              display: { xs: 'none', md: 'inline-flex' },
              mr: 2,
              height: 28,
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          />

          <IconButton 
            sx={{ 
              color: '#94a3b8', 
              mr: 1.5,
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              p: 0.8,
              '&:hover': { color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.05)' } 
            }}
          >
            <NotificationsOutlined fontSize="small" />
          </IconButton>
          
          <Avatar 
            src={user?.profileImage}
            alt={user?.firstName}
            sx={{ 
              width: 36, 
              height: 36,
              bgcolor: '#4f46e5',
              border: '2px solid rgba(255, 255, 255, 0.12)',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 3, md: 3.5 }, 
          width: { sm: 'calc(100% - 84px)' },
          backgroundColor: '#0a0e17',
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        {/* Subtle Ambient Radial Highlight */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '400px',
            background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.09), transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <Toolbar sx={{ minHeight: 64 }} />
        <Container maxWidth={false} sx={{ position: 'relative', zIndex: 1, px: { xs: 1, sm: 2, md: 3 } }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
