import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useColorMode } from '../../context/ThemeContext';
import { getAdminThemeTokens } from '../utils/adminTheme';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  AdminPanelSettingsRounded,
  LockRounded,
  PersonRounded,
  VisibilityRounded,
  VisibilityOffRounded,
  ShieldRounded,
  LanRounded,
  LightModeRounded,
  DarkModeRounded,
  ArrowBackRounded
} from '@mui/icons-material';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, setUser } = useAuth();
  const { toggleTheme, isLight } = useColorMode();
  const t = getAdminThemeTokens(isLight);
  const navigate = useNavigate();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      navigate('/admin');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok && (data.token || data.tokens?.accessToken)) {
        const token = data.token || data.tokens?.accessToken;
        const refreshToken = data.tokens?.refreshToken || token;
        const adminUser = {
          ...data.admin,
          role: data.admin?.role || 'SUPER_ADMIN',
          isAdmin: true
        };
        localStorage.setItem('authToken', token);
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(adminUser));
        if (setUser) {
          setUser(adminUser);
        }
        navigate('/admin');
      } else {
        setError(data.message || 'Invalid credentials. Please verify your username and password.');
      }
    } catch (err) {
      setError('Connection failure. Ensure backend services are running.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: t.bg,
        color: t.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Header with theme switcher & return button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: { xs: 2.5, md: 5 },
          py: 2.5,
          borderBottom: `1px solid ${t.border}`,
          bgcolor: t.paper
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: t.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: isLight ? '0 4px 10px rgba(37, 99, 235, 0.3)' : '0 0 12px rgba(59, 130, 246, 0.4)'
            }}
          >
            <ShieldRounded sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.1 }}>
              TrueID <span style={{ color: t.primary, fontWeight: 700 }}>GovPortal</span>
            </Typography>
            <Typography variant="caption" sx={{ color: t.textMuted, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1 }}>
              Authority Node Console
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title={isLight ? 'Switch to Dark Mode' : 'Switch to White / Light Mode'}>
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{
                border: `1px solid ${t.border}`,
                borderRadius: '8px',
                p: 0.8,
                color: t.textPrimary,
                bgcolor: isLight ? '#f1f5f9' : 'transparent'
              }}
            >
              {isLight ? <DarkModeRounded fontSize="small" /> : <LightModeRounded fontSize="small" />}
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
              borderRadius: '8px'
            }}
          >
            Citizen Portal
          </Button>
        </Box>
      </Box>

      {/* Main Login Body */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        <Card
          sx={{
            maxWidth: 440,
            width: '100%',
            borderRadius: 3,
            bgcolor: t.paper,
            border: `1px solid ${t.border}`,
            boxShadow: isLight ? '0 10px 25px -5px rgba(0, 0, 0, 0.08)' : '0 20px 40px rgba(0, 0, 0, 0.5)',
            p: { xs: 2.5, sm: 4 }
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Header Icon & Title */}
            <Box sx={{ textAlign: 'center', mb: 3.5 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  bgcolor: t.primaryBg,
                  border: `1px solid ${t.primaryBorder}`,
                  color: t.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}
              >
                <AdminPanelSettingsRounded sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: t.textPrimary, letterSpacing: '-0.02em', mb: 0.5 }}>
                Authority Login
              </Typography>
              <Typography variant="body2" sx={{ color: t.textMuted }}>
                Sign in to manage verified identities, biometric meshes, and consensus attestations.
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: t.errorBg, color: t.errorText, border: `1px solid ${t.errorBorder}` }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="caption" sx={{ color: t.textSecondary, fontWeight: 700, mb: 0.8, display: 'block' }}>
                  ADMINISTRATOR USERNAME
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonRounded sx={{ color: t.textMuted, fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: {
                      bgcolor: t.surfaceSubtle,
                      borderRadius: 2,
                      color: t.textPrimary,
                      '& fieldset': { borderColor: t.border },
                      '&:hover fieldset': { borderColor: t.primary },
                      '&.Mui-focused fieldset': { borderColor: t.primary }
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: t.textSecondary, fontWeight: 700, mb: 0.8, display: 'block' }}>
                  MASTER PASSWORD
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter master password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRounded sx={{ color: t.textMuted, fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: t.textMuted }}
                        >
                          {showPassword ? <VisibilityOffRounded fontSize="small" /> : <VisibilityRounded fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      bgcolor: t.surfaceSubtle,
                      borderRadius: 2,
                      color: t.textPrimary,
                      '& fieldset': { borderColor: t.border },
                      '&:hover fieldset': { borderColor: t.primary },
                      '&.Mui-focused fieldset': { borderColor: t.primary }
                    }
                  }}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <AdminPanelSettingsRounded />}
                sx={{
                  bgcolor: t.primary,
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  py: 1.3,
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: isLight ? '0 4px 14px rgba(37, 99, 235, 0.3)' : '0 4px 18px rgba(59, 130, 246, 0.4)',
                  mt: 1,
                  '&:hover': {
                    bgcolor: t.primaryDark
                  }
                }}
              >
                {isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Console'}
              </Button>
            </Box>

            <Box sx={{ mt: 3.5, pt: 2.5, borderTop: `1px solid ${t.border}`, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: t.textMuted }}>
                <LanRounded sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  Consensus Node • Ethereum Sepolia Testnet
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AdminLogin;
