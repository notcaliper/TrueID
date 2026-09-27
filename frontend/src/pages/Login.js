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
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowForward, LockOutlined } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import MFAVerification from '../components/MFAVerification';

// Keyframes for background animation
const float1 = `
  @keyframes float1 {
    0% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0, 0) scale(1); }
  }
`;

const float2 = `
  @keyframes float2 {
    0% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-30px, 50px) scale(1.2); }
    66% { transform: translate(20px, -20px) scale(0.8); }
    100% { transform: translate(0, 0) scale(1); }
  }
`;

const pulseGlow = `
  @keyframes pulseGlow {
    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
  }
`;

const Login = () => {
  const { login, isAuthenticated, loading, error, mfaPending, verifyMFA, cancelMFALogin } = useAuth();
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
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0a0e17',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{float1}</style>
      <style>{float2}</style>
      <style>{pulseGlow}</style>

      {/* Subtle Ambient Gradients */}
      <Box
        sx={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '55vw',
          height: '55vw',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(10,14,23,0) 70%)',
          borderRadius: '50%',
          animation: 'float1 20s infinite ease-in-out',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, rgba(10,14,23,0) 70%)',
          borderRadius: '50%',
          animation: 'float2 25s infinite ease-in-out reverse',
          zIndex: 0,
        }}
      />

      <Fade in={mounted} timeout={800}>
        <Box
          sx={{
            width: '100%',
            maxWidth: 1020,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            mx: 2,
            position: 'relative',
            zIndex: 1,
            backgroundColor: 'rgba(17, 24, 39, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Left Side - Branding (Fintech Panel) */}
          <Box
            sx={{
              flex: 1.1,
              p: { xs: 4, md: 6 },
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'center',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              background: 'linear-gradient(180deg, rgba(99,102,241,0.04) 0%, rgba(16,185,129,0.03) 100%)',
            }}
          >
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box 
                sx={{ 
                  p: 1.4, 
                  borderRadius: '12px', 
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                }}
              >
                <LockOutlined sx={{ color: '#fff', fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ 
                  background: 'linear-gradient(135deg, #fff 0%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1
                }}>
                  TrueID
                </Typography>
                <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 700, letterSpacing: '0.1em' }}>
                  FINTECH & WEB3 IDENTITY
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
              Institutional Digital Identity
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
              Next-generation decentralized biometric authentication and tamper-proof verification on the blockchain.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 5 }}>
              {['Zero-Knowledge Biometrics', 'Tamper-Proof Ledger Proofs', 'Self-Sovereign Identity Control'].map((item) => (
                <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                  <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 500 }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 'auto' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, letterSpacing: 0.3 }}>
                Live Network • Ethereum Sepolia Protocol
              </Typography>
            </Box>
          </Box>

          {/* Right Side - Form */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 4, md: 8 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            {/* Mobile Branding */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
              <LockOutlined sx={{ color: '#3b82f6', fontSize: 28 }} />
              <Typography variant="h4" fontWeight={800} color="#fff">TrueID</Typography>
            </Box>

            {/* MFA Verification Flow */}
            {mfaPending ? (
              <MFAVerification
                onVerify={handleMFAVerify}
                onCancel={handleMFACancel}
                error={mfaError}
                loading={loading}
              />
            ) : (
              <>
                <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                  Welcome back
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  Sign in to access your dashboard
                </Typography>

                {(error || localError) && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#fca5a5',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
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
                    sx={{ mb: 3 }}
                    InputProps={{
                      sx: { color: '#fff' }
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
                    sx={{ mb: 2 }}
                    InputProps={{
                      sx: { color: '#fff' },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff' } }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          size="small"
                          sx={{ 
                            color: 'rgba(255,255,255,0.3)',
                            '&.Mui-checked': { color: '#6366f1' }
                          }}
                        />
                      }
                      label={<Typography variant="body2" color="text.secondary">Remember me</Typography>}
                    />
                    <Link href="#" variant="body2" sx={{ color: '#818cf8', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
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
                      fontWeight: 600,
                      borderRadius: '12px',
                    }}
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </Button>
                </Box>

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Don&apos;t have an account?{' '}
                    <Link component={RouterLink} to="/register" sx={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
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
