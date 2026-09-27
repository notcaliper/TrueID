import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  DashboardRounded,
  PersonRounded,
  AccountBalanceWalletRounded,
  VerifiedUserRounded,
  WorkRounded,
  SecurityRounded,
  FingerprintRounded,
  LogoutRounded,
  SettingsRounded,
  ShieldRounded,
  AdminPanelSettingsRounded,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 260;
const miniDrawerWidth = 84;

const menuSections = [
  {
    title: 'Core Platform',
    items: [
      { text: 'Dashboard', icon: <DashboardRounded fontSize="small" />, path: '/' },
      { text: 'Identity Vault', icon: <PersonRounded fontSize="small" />, path: '/profile' },
      { text: 'Web3 Wallet', icon: <AccountBalanceWalletRounded fontSize="small" />, path: '/wallet' },
    ],
  },
  {
    title: 'Verification',
    items: [
      { text: 'Trust Score', icon: <VerifiedUserRounded fontSize="small" />, path: '/verification-status' },
      { text: 'Biometrics', icon: <FingerprintRounded fontSize="small" />, path: '/biometric-verification' },
    ],
  },
  {
    title: 'Immutable Records',
    items: [
      { text: 'Credentials', icon: <WorkRounded fontSize="small" />, path: '/professional-records' },
      { text: 'Blockchain Ledger', icon: <SecurityRounded fontSize="small" />, path: '/blockchain-status' },
    ],
  },
  {
    title: 'Authority Console',
    items: [
      { text: 'Admin Portal', icon: <AdminPanelSettingsRounded fontSize="small" />, path: '/admin' },
    ],
  },
];

const sidebarStyles = `
  @keyframes pulseSubtle {
    0%, 100% { box-shadow: 0 0 12px rgba(99, 102, 241, 0.3); }
    50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.6); }
  }
  .active-nav-item {
    position: relative;
    overflow: hidden;
    background: linear-gradient(90deg, rgba(99, 102, 241, 0.16) 0%, rgba(99, 102, 241, 0.04) 100%) !important;
  }
  .active-nav-item::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0; width: 3px;
    background: #6366f1;
    box-shadow: 0 0 10px #6366f1;
    border-radius: 0 3px 3px 0;
  }
  .hover-nav-item {
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .hover-nav-item:hover {
    background: rgba(255, 255, 255, 0.04) !important;
    transform: translateX(3px);
  }
  .active-nav-item.hover-nav-item:hover {
    transform: none;
    background: linear-gradient(90deg, rgba(99, 102, 241, 0.22) 0%, rgba(99, 102, 241, 0.08) 100%) !important;
  }
  .hide-on-mini {
    opacity: 0;
    transition: opacity 0.2s ease, transform 0.2s ease;
    transform: translateX(-8px);
    pointer-events: none;
    white-space: nowrap;
    overflow: hidden;
  }
  .MuiDrawer-paper:hover .hide-on-mini {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }
`;

const Sidebar = ({ mobileOpen, onDrawerToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const drawerContent = (
    <Box sx={{ width: drawerWidth, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <style>{sidebarStyles}</style>
      
      {/* Subtle Right Separator */}
      <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '1px', background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(99,102,241,0.2), rgba(255,255,255,0.06))' }} />

      {/* Brand Header */}
      <Box sx={{ pt: 3.5, px: 2.5, pb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
          <Box
            sx={{
              minWidth: 40,
              height: 40,
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}
          >
            <ShieldRounded sx={{ fontSize: 22 }} />
          </Box>
          <Box className="hide-on-mini" sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={800} sx={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              fontSize: '1.15rem'
            }}>
              TrueID
            </Typography>
            <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.62rem' }}>
              WEB3 IDENTITY
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* User Info Capsule */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Box
          sx={{
            p: 1.25,
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            transition: 'all 0.2s ease',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(99, 102, 241, 0.3)',
            }
          }}
        >
          <Avatar
            src={user?.profileImage}
            alt={user?.firstName}
            sx={{ minWidth: 36, width: 36, height: 36, border: '1.5px solid rgba(99, 102, 241, 0.5)', bgcolor: '#1e1b4b', fontWeight: 700, fontSize: '0.85rem' }}
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
          <Box className="hide-on-mini" sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap color="#f8fafc" sx={{ fontSize: '0.82rem' }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.2 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>
                {user?.verificationLevel === 'platinum' ? 'Platinum Tier' : 'Standard Tier'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'hidden',
          overflowY: 'auto', 
          px: 1.5, 
          py: 0.5,
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {menuSections.map((section) => (
          <Box key={section.title} sx={{ mb: 2.5 }}>
            <Typography
              className="hide-on-mini"
              variant="caption"
              sx={{
                px: 1.5,
                py: 0.8,
                display: 'block',
                color: '#64748b',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontSize: '0.66rem',
                whiteSpace: 'nowrap'
              }}
            >
              {section.title}
            </Typography>
            <List dense disablePadding>
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.4 }}>
                    <Tooltip title={item.text} placement="right" arrow>
                      <ListItemButton
                        className={`hover-nav-item ${active ? 'active-nav-item' : ''}`}
                        onClick={() => {
                          navigate(item.path);
                          onDrawerToggle?.();
                        }}
                        sx={{
                          borderRadius: '10px',
                          py: 1,
                          px: 1.6,
                          color: active ? '#ffffff' : '#94a3b8',
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 36,
                            color: active ? '#818cf8' : '#64748b',
                            filter: active ? 'drop-shadow(0 0 6px rgba(129, 140, 248, 0.4))' : 'none',
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          className="hide-on-mini"
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: '0.84rem',
                            fontWeight: active ? 600 : 500,
                            whiteSpace: 'nowrap',
                          }}
                        />
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Bottom Actions */}
      <Box sx={{ p: 1.5, pb: 2.5 }}>
        <List dense disablePadding>
          <ListItem disablePadding sx={{ mb: 0.4 }}>
            <ListItemButton
              className="hover-nav-item"
              onClick={() => navigate('/profile')}
              sx={{
                borderRadius: '10px',
                py: 1,
                px: 1.6,
                color: '#94a3b8',
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: '#64748b' }}>
                <SettingsRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText
                className="hide-on-mini"
                primary="Preferences"
                primaryTypographyProps={{ fontSize: '0.84rem', fontWeight: 500, whiteSpace: 'nowrap' }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              className="hover-nav-item"
              onClick={handleLogout}
              sx={{
                borderRadius: '10px',
                py: 1,
                px: 1.6,
                color: '#f43f5e',
                '&:hover': { background: 'rgba(244, 63, 94, 0.1) !important', color: '#fb7185' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: '#f43f5e' }}>
                <LogoutRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText
                className="hide-on-mini"
                primary="Sign Out"
                primaryTypographyProps={{ fontSize: '0.84rem', fontWeight: 500, whiteSpace: 'nowrap' }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: miniDrawerWidth }, flexShrink: { sm: 0 }, zIndex: 1200 }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(10, 14, 23, 0.96)',
            backdropFilter: 'blur(24px)',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: miniDrawerWidth,
            overflowX: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(10, 14, 23, 0.94)',
            backdropFilter: 'blur(24px)',
            '&:hover': {
              width: drawerWidth,
              boxShadow: '12px 0 32px rgba(0, 0, 0, 0.5)',
            }
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
