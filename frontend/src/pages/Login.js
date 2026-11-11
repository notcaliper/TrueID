import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Fade,
  Tooltip,
  useTheme,
  Chip
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ArrowForward,
  ShieldRounded,
  LightModeRounded,
  DarkModeRounded,
  CheckCircleRounded,
  LanRounded,
  VpnKeyRounded,
  FingerprintRounded
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext';
import MFAVerification from '../components/MFAVerification';

// Keyframes for background animation
const float1 = `
  @keyframes float1 {
    0% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(25px, -40px) scale(1.08); }
    66% { transform: translate(-15px, 20px) scale(0.92); }
    100% { transform: translate(0, 0) scale(1); }
  }
`;

const float2 = `
  @keyframes float2 {
    0% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-25px, 40px) scale(1.1); }
    66% { transform: translate(15px, -20px) scale(0.9); }
    100% { transform: translate(0, 0) scale(1); }
  }
`;

const pulseBadge = `
  @keyframes pulseBadge {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.04); opacity: 0.85; }
    100% { transform: scale(1); opacity: 1; }
  }
`;

const Login = () => {
  const { login, isAuthenticated, loading, error, mfaPending, verifyMFA, cancelMFALogin } = useAuth();
  const { isLight, toggleTheme } = useColorMode();
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mfaError, setMfaError] = useState('');

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setMfaError('');
    
    if (!formData.username || !formData.password) {
      setLocalError('Please enter both username and password');
      return;
    }
    
    const result = await login(formData);
    if (result.success) {
      navigate('/');
    } else if (!result.mfaRequired) {
      setLocalError(result.error || 'Login failed');
    }
  };

  const handleMFAVerify = async (code) => {
    setMfaError('');
    const result = await verifyMFA(code);
    if (result.success) {
      navigate('/');
    } else {
      setMfaError(result.error || 'Invalid code');
    }
  };

  const handleMFACancel = () => {
    cancelMFALogin();
    setMfaError('');
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: isLight ? '#f8fafc' : '#0a0e17',
        color: theme.palette.text.primary,
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 4, md: 6 },
        px: 2,
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <style>{float1}</style>
      <style>{float2}</style>
      <style>{pulseBadge}</style>

      {/* Top Floating Controls: Brand & Theme Toggle */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: { xs: 16, sm: 32 },
          right: { xs: 16, sm: 32 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
            }}
          >
            <ShieldRounded sx={{ color: '#ffffff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', color: theme.palette.text.primary }}>
              TrueID
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
              Decentralized Identity
            </Typography>
          </Box>
        </Box>

        {/* Theme Toggle Button */}
        <Tooltip title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
          <IconButton
            onClick={toggleTheme}
            size="small"
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)'}`,
              bgcolor: isLight ? '#ffffff' : '#181a1c',
              color: isLight ? '#1e293b' : '#f8fafc',
              boxShadow: isLight ? '0 2px 8px rgba(15, 23, 42, 0.06)' : '0 2px 10px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: isLight ? '#f1f5f9' : '#22252a',
                transform: 'scale(1.05)',
              },
            }}
          >
            {isLight ? (
              <DarkModeRounded sx={{ fontSize: 20, color: '#475569' }} />
            ) : (
              <LightModeRounded sx={{ fontSize: 20, color: '#facc15' }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Ambient Gradient Orbs */}
      <Box
        sx={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: { xs: '80vw', md: '50vw' },
          height: { xs: '80vw', md: '50vw' },
          background: isLight 
            ? 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, rgba(248,250,252,0) 70%)'
            : 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, rgba(10,14,23,0) 70%)',
          borderRadius: '50%',
          animation: 'float1 20s infinite ease-in-out',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: { xs: '75vw', md: '45vw' },
          height: { xs: '75vw', md: '45vw' },
          background: isLight 
            ? 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, rgba(248,250,252,0) 70%)'
            : 'radial-gradient(circle, rgba(16,185,129,0.09) 0%, rgba(10,14,23,0) 70%)',
          borderRadius: '50%',
          animation: 'float2 25s infinite ease-in-out reverse',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <Fade in={mounted} timeout={700}>
        <Box
          sx={{
            width: '100%',
            maxWidth: 1040,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            position: 'relative',
            zIndex: 1,
            mt: { xs: 7, md: 4 },
            bgcolor: isLight ? '#ffffff' : 'rgba(24, 26, 28, 0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: { xs: '18px', md: '24px' },
            boxShadow: isLight 
              ? '0 20px 45px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)' 
              : '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 1px rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Left Side - Interactive Identity Platform Showcase */}
          <Box
            sx={{
              flex: 1.1,
              p: { xs: 3.5, sm: 5, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              bgcolor: isLight ? '#f8fafc' : 'rgba(17, 18, 20, 0.75)',
              borderRight: { md: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}` },
              borderBottom: { xs: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}`, md: 'none' },
              position: 'relative',
            }}
          >
            <Box>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Chip
                  icon={<LanRounded sx={{ fontSize: '14px !important', color: '#2563eb !important' }} />}
                  label="ETHEREUM SEPOLIA LIVE"
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    letterSpacing: '0.06em',
                    bgcolor: isLight ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.2)',
                    color: isLight ? '#1d4ed8' : '#60a5fa',
                    border: `1px solid ${isLight ? 'rgba(37, 99, 235, 0.25)' : 'rgba(59, 130, 246, 0.3)'}`,
                  }}
                />
              </Box>

              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 900, 
                  letterSpacing: '-0.03em', 
                  color: theme.palette.text.primary,
                  lineHeight: 1.15,
                  mb: 2,
                  fontSize: { xs: '1.8rem', md: '2.2rem' }
                }}
              >
                Decentralized Biometric Trust Engine
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: theme.palette.text.secondary, 
                  lineHeight: 1.6, 
                  mb: 4.5,
                  fontSize: '0.95rem'
                }}
              >
                Zero-knowledge biometric attestation and cryptographically anchored W3C Verifiable Credentials on Ethereum Sepolia.
              </Typography>

              {/* Feature Points */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
                {[
                  {
                    icon: <CheckCircleRounded sx={{ color: '#16a34a', fontSize: 20 }} />,
                    title: 'ERC-5192 Soulbound Badges',
                    desc: 'Non-transferable on-chain proof of identity verification.'
                  },
                  {
                    icon: <FingerprintRounded sx={{ color: '#2563eb', fontSize: 20 }} />,
                    title: 'ZK-Biometric Vault',
                    desc: 'Facial landmarks encrypted locally with Zero-Knowledge verification.'
                  },
                  {
                    icon: <VpnKeyRounded sx={{ color: '#d97706', fontSize: 20 }} />,
                    title: 'Hardware & TOTP Two-Factor',
                    desc: 'Military-grade protection for cryptographic pass management.'
                  }
                ].map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.8 }}>
                    <Box 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: 1.5, 
                        bgcolor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}`,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0,
                        mt: 0.2
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1.2 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.78rem' }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Bottom Proof Tag */}
            <Box 
              sx={{ 
                mt: 5, 
                p: 2, 
                borderRadius: 2.5, 
                bgcolor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.06)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Box 
                  sx={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%', 
                    bgcolor: '#22c55e', 
                    boxShadow: '0 0 10px #22c55e' 
                  }} 
                />
                <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: '0.78rem' }}>
                  Smart Contract Suite Live
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: theme.palette.text.secondary, fontSize: '0.72rem' }}>
                Chain ID 11155111
              </Typography>
            </Box>
          </Box>

          {/* Right Side - Login Form */}
          <Box
            sx={{
              flex: 1.2,
              p: { xs: 3.5, sm: 5, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              bgcolor: isLight ? '#ffffff' : 'transparent',
            }}
          >
            {mfaPending ? (
              <MFAVerification
                onVerify={handleMFAVerify}
                onCancel={handleMFACancel}
                error={mfaError}
                loading={loading}
              />
            ) : (
              <>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.text.primary, letterSpacing: '-0.02em', mb: 0.8 }}>
                  Welcome back
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 4, fontSize: '0.95rem' }}>
                  Sign in to access your digital identity and ledger
                </Typography>

                {(error || localError) && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                      bgcolor: isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.15)',
                      color: isLight ? '#b91c1c' : '#fca5a5',
                      border: `1px solid ${isLight ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.3)'}`,
                      '& .MuiAlert-icon': { color: '#ef4444' }
                    }}
                  >
                    {error || localError}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    id="username"
                    label="Username or Email"
                    name="username"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        bgcolor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        color: theme.palette.text.primary,
                        '& fieldset': {
                          borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)',
                        },
                        '&:hover fieldset': {
                          borderColor: isLight ? '#94a3b8' : 'rgba(255, 255, 255, 0.3)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2563eb',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: theme.palette.text.secondary,
                        '&.Mui-focused': { color: '#2563eb' }
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    id="password"
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    sx={{
                      mb: 2.5,
                      '& .MuiOutlinedInput-root': {
                        bgcolor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        color: theme.palette.text.primary,
                        '& fieldset': {
                          borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)',
                        },
                        '&:hover fieldset': {
                          borderColor: isLight ? '#94a3b8' : 'rgba(255, 255, 255, 0.3)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2563eb',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: theme.palette.text.secondary,
                        '&.Mui-focused': { color: '#2563eb' }
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          size="small"
                          sx={{ 
                            color: isLight ? '#94a3b8' : 'rgba(255, 255, 255, 0.3)',
                            '&.Mui-checked': { color: '#2563eb' }
                          }}
                        />
                      }
                      label={<Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>Remember me</Typography>}
                    />
                    <Link 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); alert('Please contact administrator to initiate password recovery via government ID.'); }}
                      variant="body2" 
                      sx={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Forgot password?
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    endIcon={<ArrowForward />}
                    sx={{
                      py: 1.6,
                      fontSize: '0.98rem',
                      fontWeight: 700,
                      borderRadius: '12px',
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                        boxShadow: '0 6px 20px rgba(37, 99, 235, 0.45)',
                      },
                    }}
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </Button>
                </Box>

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Don&apos;t have an account?{' '}
                    <Link 
                      component={RouterLink} 
                      to="/register" 
                      sx={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Create account
                    </Link>
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};

export default Login;
