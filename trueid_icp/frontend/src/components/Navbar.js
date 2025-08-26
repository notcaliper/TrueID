import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Chip,
} from '@mui/material';
import {
  AccountCircle,
  Dashboard,
  Work,
  Storage,
  VerifiedUser,
  AdminPanelSettings,
  Logout,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { principal, userRole, identity, logout, hasRole } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/login');
  };

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { path: '/professional', label: 'Professional', icon: <Work /> },
    { path: '/documents', label: 'Documents', icon: <Storage /> },
    { path: '/verification', label: 'Verification', icon: <VerifiedUser /> },
  ];

  if (hasRole('Admin')) {
    navigationItems.push({
      path: '/admin',
      label: 'Admin',
      icon: <AdminPanelSettings />,
    });
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin':
        return 'error';
      case 'Government':
        return 'warning';
      case 'User':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatPrincipal = (principalText) => {
    if (!principalText) return '';
    return principalText.length > 12 
      ? `${principalText.slice(0, 6)}...${principalText.slice(-6)}`
      : principalText;
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          TrueID
        </Typography>

        {/* Navigation Items */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 2 }}>
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                mx: 1,
                backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {/* User Role Chip */}
        {userRole && (
          <Chip
            label={userRole.role}
            color={getRoleColor(userRole.role)}
            size="small"
            sx={{ mr: 2 }}
          />
        )}

        {/* Verification Status */}
        {identity && (
          <Chip
            label={identity.is_verified ? 'Verified' : 'Unverified'}
            color={identity.is_verified ? 'success' : 'default'}
            size="small"
            sx={{ mr: 2 }}
          />
        )}

        {/* User Menu */}
        <div>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              <AccountCircle />
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {formatPrincipal(principal)}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
