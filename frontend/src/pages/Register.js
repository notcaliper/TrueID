import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Stepper,
  Step,
  StepLabel,
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
  ArrowBack,
  CheckCircle,
  ShieldRounded,
  LightModeRounded,
  DarkModeRounded,
  LanRounded,
  BadgeRounded,
  AccountCircleRounded,
  LockRounded,
  AccountBalanceWalletRounded,
  ElectricBoltRounded,
  ContentCopyRounded,
  CheckRounded,
  CheckCircleRounded,
  WarningAmberRounded
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext';
import walletService from '../services/wallet.service';

const steps = ['Personal Info', 'Account Details', 'Web3 Wallet', 'Security & Terms'];

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

const Register = () => {
  const { register, isAuthenticated, loading, error } = useAuth();
  const { isLight, toggleTheme } = useColorMode();
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    governmentId: '',
    walletAddress: '',
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated()) navigate('/');
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({ ...formData, [name]: name === 'agreeTerms' ? checked : value });
    setLocalError('');
  };

  const handleCopyAddress = (addr) => {
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleConnectMetaMask = async () => {
    setConnectingWallet(true);
    setLocalError('');
    try {
      const info = await walletService.connectWallet();
      setConnectedWallet(info);
      setFormData(prev => ({ ...prev, walletAddress: info.address }));
    } catch (err) {
      console.error('MetaMask connection error:', err);
      setLocalError(err.message || 'Failed to connect MetaMask. You can also paste your Ethereum address manually.');
    } finally {
      setConnectingWallet(false);
    }
  };

  const handleDisconnectWallet = () => {
    walletService.disconnect();
    setConnectedWallet(null);
    setFormData(prev => ({ ...prev, walletAddress: '' }));
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0:
        if (!formData.firstName?.trim() || !formData.lastName?.trim()) return 'Please enter your full legal name';
        if (!formData.governmentId?.trim()) return 'National Citizen Identifier (Gov ID) is required';
        break;
      case 1:
        if (!formData.username?.trim()) return 'Username is required';
        if (!formData.email?.trim() || !/\S+@\S+\.\S+/.test(formData.email)) return 'Valid email address is required';
        if (!formData.phone?.trim()) return 'Phone number is required';
        break;
      case 2:
        if (!formData.walletAddress?.trim()) {
          return 'An external Web3 Ethereum address (e.g. MetaMask) is required to receive your Soulbound identity pass';
        }
        if (!/^0x[a-fA-F0-9]{40}$/.test(formData.walletAddress.trim())) {
          return 'Invalid Ethereum wallet address format. Must be a 42-character hex address starting with 0x';
        }
        break;
      case 3:
        if (!formData.password || formData.password.length < 8) return 'Password must be at least 8 characters long';
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
        if (!formData.agreeTerms) return 'You must accept the terms of service';
        break;
      default:
        return null;
    }
    return null;
  };

  const handleNext = async () => {
    const err = validateStep();
    if (err) {
      setLocalError(err);
      return;
    }

    if (activeStep === steps.length - 1) {
      const result = await register(formData);
      if (result.success) navigate('/');
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  // Common input styling to match theme perfectly
  const inputStyle = {
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
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Fade in={true}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.text.primary, mb: 0.5, letterSpacing: '-0.01em' }}>
                Legal Citizen Identity
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                Enter your legal name and national citizen identifier for cryptographic attestation
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g. John"
                  sx={inputStyle}
                />
                <TextField
                  fullWidth
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Doe"
                  sx={inputStyle}
                />
              </Box>

              <TextField
                fullWidth
                name="governmentId"
                label="National Citizen Identifier (Gov ID)"
                value={formData.governmentId}
                onChange={handleChange}
                placeholder="e.g. GOV-894132"
                helperText="Used to generate your unique decentralized identifier (DID)"
                sx={{
                  ...inputStyle,
                  '& .MuiFormHelperText-root': {
                    color: theme.palette.text.secondary,
                    fontSize: '0.74rem'
                  }
                }}
              />
            </Box>
          </Fade>
        );

      case 1:
        return (
          <Fade in={true}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.text.primary, mb: 0.5, letterSpacing: '-0.01em' }}>
                Account Setup
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                Configure your decentralized wallet username and contact information
              </Typography>

              <TextField
                fullWidth
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                placeholder="e.g. citizen_user"
                sx={inputStyle}
              />

              <TextField
                fullWidth
                name="email"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. citizen@domain.org"
                sx={inputStyle}
              />

              <TextField
                fullWidth
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +1 555 019 2834"
                sx={inputStyle}
              />
            </Box>
          </Fade>
        );

      case 2:
        const hasValidAddress = Boolean(formData.walletAddress && /^0x[a-fA-F0-9]{40}$/.test(formData.walletAddress.trim()));
        return (
          <Fade in={true}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <AccountBalanceWalletRounded sx={{ color: '#2563eb', fontSize: 26 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.text.primary, letterSpacing: '-0.01em' }}>
                  Web3 Wallet Linkage
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2.5 }}>
                Connect your personal Ethereum wallet (MetaMask) to anchor your decentralized identity.
              </Typography>

              {/* Non-Custodial Self-Custody Guarantee Notice */}
              <Box
                sx={{
                  p: 2,
                  mb: 2.5,
                  borderRadius: 2.5,
                  bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.1)',
                  border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(34, 197, 94, 0.25)'}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5
                }}
              >
                <ShieldRounded sx={{ color: '#16a34a', fontSize: 22, mt: 0.2, flexShrink: 0 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isLight ? '#15803d' : '#4ade80', fontSize: '0.84rem' }}>
                    100% Non-Custodial • You Own Your Private Keys
                  </Typography>
                  <Typography variant="caption" sx={{ color: isLight ? '#166534' : '#86efac', fontSize: '0.76rem', lineHeight: 1.4, display: 'block', mt: 0.2 }}>
                    TrueID never generates disposable custodial wallets or holds your private keys. Your permanent Soulbound token will be minted directly to your personal address on Ethereum Sepolia.
                  </Typography>
                </Box>
              </Box>

              {connectedWallet ? (
                /* Connected Web3 Card */
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    bgcolor: isLight ? '#f8fafc' : '#141618',
                    border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(34, 197, 94, 0.3)'}`,
                    mb: 2.5
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#16a34a', boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.2)' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.88rem' }}>
                        MetaMask Connected
                      </Typography>
                    </Box>
                    <Chip
                      label={connectedWallet.network || 'Ethereum Sepolia'}
                      size="small"
                      sx={{
                        bgcolor: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)',
                        color: '#2563eb',
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        height: 22
                      }}
                    />
                  </Box>

                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isLight ? '#ffffff' : '#1e2124', border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`, mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, display: 'block', mb: 0.3 }}>
                      PUBLIC RECIPIENT ADDRESS (NON-CUSTODIAL)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                        {connectedWallet.address}
                      </Typography>
                      <Tooltip title={copiedAddress ? 'Copied!' : 'Copy Address'}>
                        <IconButton size="small" onClick={() => handleCopyAddress(connectedWallet.address)} sx={{ color: isLight ? '#64748b' : '#9ca3af' }}>
                          {copiedAddress ? <CheckRounded sx={{ fontSize: 16, color: '#16a34a' }} /> : <ContentCopyRounded sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5 }}>
                    <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 600 }}>
                      Testnet Balance: <strong style={{ color: isLight ? '#0f172a' : '#ffffff' }}>{connectedWallet.balance} ETH</strong>
                    </Typography>
                    <Button
                      size="small"
                      onClick={handleDisconnectWallet}
                      sx={{ textTransform: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, p: 0.5 }}
                    >
                      Disconnect / Change
                    </Button>
                  </Box>
                </Box>
              ) : (
                /* Connect or Manual Input Mode */
                <Box sx={{ mb: 2.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<ElectricBoltRounded />}
                    onClick={handleConnectMetaMask}
                    disabled={connectingWallet}
                    sx={{
                      py: 1.4,
                      borderRadius: 2.5,
                      bgcolor: '#2563eb',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                      mb: 2,
                      '&:hover': { bgcolor: '#1d4ed8' }
                    }}
                  >
                    {connectingWallet ? 'Waiting for MetaMask approval...' : 'Connect MetaMask / Web3 Extension'}
                  </Button>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 2 }}>
                    <Box sx={{ flex: 1, height: '1px', bgcolor: isLight ? '#e2e8f0' : '#282a2d' }} />
                    <Typography variant="caption" sx={{ color: isLight ? '#94a3b8' : '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>
                      OR ENTER ADDRESS MANUALLY
                    </Typography>
                    <Box sx={{ flex: 1, height: '1px', bgcolor: isLight ? '#e2e8f0' : '#282a2d' }} />
                  </Box>

                  <TextField
                    fullWidth
                    name="walletAddress"
                    label="External Ethereum Address (0x...)"
                    value={formData.walletAddress}
                    onChange={handleChange}
                    placeholder="0x71C...4982"
                    helperText={
                      hasValidAddress
                        ? '✓ Valid 42-character Ethereum address format'
                        : 'Enter your 42-character Ethereum address from MetaMask, Rabby, or Coinbase'
                    }
                    InputProps={{
                      endAdornment: formData.walletAddress ? (
                        <InputAdornment position="end">
                          {hasValidAddress ? (
                            <CheckCircleRounded sx={{ color: '#16a34a', fontSize: 20 }} />
                          ) : (
                            <WarningAmberRounded sx={{ color: '#d97706', fontSize: 20 }} />
                          )}
                        </InputAdornment>
                      ) : null
                    }}
                    sx={{
                      ...inputStyle,
                      '& .MuiFormHelperText-root': {
                        color: hasValidAddress ? '#16a34a' : theme.palette.text.secondary,
                        fontWeight: hasValidAddress ? 700 : 500,
                        fontSize: '0.74rem'
                      }
                    }}
                  />
                </Box>
              )}

              {/* Informative DID preview */}
              <Box
                sx={{
                  p: 1.8,
                  borderRadius: 2,
                  bgcolor: isLight ? '#f8fafc' : '#141618',
                  border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}
              >
                <LanRounded sx={{ color: '#2563eb', fontSize: 20, flexShrink: 0 }} />
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, display: 'block' }}>
                    YOUR W3C DECENTRALIZED IDENTIFIER (DID) PREVIEW
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: hasValidAddress ? '#2563eb' : (isLight ? '#94a3b8' : '#64748b'), fontWeight: 700, wordBreak: 'break-all' }}>
                    {hasValidAddress ? `did:trueid:${formData.walletAddress.trim()}` : 'did:trueid:<awaiting-wallet-connection>'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Fade>
        );

      case 3:
        return (
          <Fade in={true}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.text.primary, mb: 0.5, letterSpacing: '-0.01em' }}>
                Security & Verification
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                Establish your cryptographic master key and agree to trust guidelines
              </Typography>

              <TextField
                fullWidth
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Master Password"
                value={formData.password}
                onChange={handleChange}
                sx={inputStyle}
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

              <TextField
                fullWidth
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                label="Confirm Master Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                sx={inputStyle}
              />

              <Box sx={{ mt: 1, mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      size="small"
                      sx={{ 
                        color: isLight ? '#94a3b8' : 'rgba(255, 255, 255, 0.3)',
                        '&.Mui-checked': { color: '#2563eb' }
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.84rem' }}>
                      I agree to the TrueID Identity Trust Framework and W3C DID Specification.
                    </Typography>
                  }
                />
              </Box>
            </Box>
          </Fade>
        );

      default:
        return null;
    }
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
          {/* Left Side - Step Progress & Identity System Details */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 3.5, sm: 5, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              bgcolor: isLight ? '#f8fafc' : 'rgba(17, 18, 20, 0.75)',
              borderRight: { md: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}` },
              borderBottom: { xs: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}`, md: 'none' },
            }}
          >
            <Box>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Chip
                  icon={<LanRounded sx={{ fontSize: '14px !important', color: '#2563eb !important' }} />}
                  label="NEW CITIZEN REGISTRATION"
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
                variant="h4" 
                sx={{ 
                  fontWeight: 900, 
                  letterSpacing: '-0.03em', 
                  color: theme.palette.text.primary,
                  lineHeight: 1.2,
                  mb: 1.5,
                  fontSize: { xs: '1.6rem', md: '2rem' }
                }}
              >
                Create Your Digital Citizen Pass
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary, 
                  lineHeight: 1.6, 
                  mb: 4.5,
                  fontSize: '0.92rem'
                }}
              >
                Join the verified Ethereum Sepolia decentralized registry in four quick steps.
              </Typography>

              {/* Step Progression Indicators */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  {
                    icon: <BadgeRounded sx={{ fontSize: 18 }} />,
                    label: 'Personal Information',
                    desc: 'Legal identity and national citizen identifier'
                  },
                  {
                    icon: <AccountCircleRounded sx={{ fontSize: 18 }} />,
                    label: 'Account Credentials',
                    desc: 'Username, verified email, and contact info'
                  },
                  {
                    icon: <AccountBalanceWalletRounded sx={{ fontSize: 18 }} />,
                    label: 'Web3 Wallet Linkage',
                    desc: 'External MetaMask connection for self-custody'
                  },
                  {
                    icon: <LockRounded sx={{ fontSize: 18 }} />,
                    label: 'Security & Terms',
                    desc: 'Cryptographic master key & terms agreement'
                  }
                ].map((item, index) => {
                  const isDone = activeStep > index;
                  const isCurrent = activeStep === index;
                  return (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2,
                        p: 1.8,
                        borderRadius: 2.5,
                        bgcolor: isCurrent 
                          ? (isLight ? '#ffffff' : 'rgba(37, 99, 235, 0.12)')
                          : (isLight ? 'rgba(255, 255, 255, 0.6)' : 'transparent'),
                        border: `1px solid ${
                          isCurrent 
                            ? '#2563eb' 
                            : (isDone ? (isLight ? '#bbf7d0' : 'rgba(34, 197, 94, 0.3)') : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.05)'))
                        }`,
                        boxShadow: isCurrent 
                          ? (isLight ? '0 4px 14px rgba(37, 99, 235, 0.1)' : '0 4px 14px rgba(0, 0, 0, 0.3)')
                          : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isDone 
                            ? '#22c55e' 
                            : (isCurrent ? '#2563eb' : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)')),
                          color: (isDone || isCurrent) ? '#ffffff' : theme.palette.text.secondary,
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          flexShrink: 0,
                          mt: 0.2
                        }}
                      >
                        {isDone ? <CheckCircle sx={{ fontSize: 18 }} /> : index + 1}
                      </Box>
                      <Box>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: isCurrent ? 800 : 600, 
                            color: isCurrent ? (isLight ? '#2563eb' : '#60a5fa') : theme.palette.text.primary,
                            lineHeight: 1.2
                          }}
                        >
                          {item.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.74rem' }}>
                          {item.desc}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Bottom Security Note */}
            <Box 
              sx={{ 
                mt: 4, 
                p: 2, 
                borderRadius: 2, 
                bgcolor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.06)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1.2
              }}
            >
              <ShieldRounded sx={{ color: '#2563eb', fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.74rem', fontWeight: 600 }}>
                End-to-end encrypted • Biometrics never leave your local device unhashed
              </Typography>
            </Box>
          </Box>

          {/* Right Side - Step Form */}
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
            {/* Mobile Horizontal Stepper */}
            <Stepper 
              activeStep={activeStep} 
              sx={{ 
                mb: 3, 
                display: { xs: 'flex', md: 'none' },
                '& .MuiStepLabel-label': { color: theme.palette.text.secondary, fontSize: '0.75rem' },
                '& .MuiStepLabel-label.Mui-active': { color: '#2563eb', fontWeight: 700 },
                '& .MuiStepIcon-root': { color: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)' },
                '& .MuiStepIcon-root.Mui-active': { color: '#2563eb' },
                '& .MuiStepIcon-root.Mui-completed': { color: '#22c55e' },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

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

            {renderStepContent(activeStep)}

            {/* Step Controls: Back / Continue */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, pt: 2, borderTop: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}` }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBack />}
                sx={{ 
                  color: theme.palette.text.secondary, 
                  textTransform: 'none', 
                  fontWeight: 600,
                  '&:hover': { bgcolor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)' } 
                }}
              >
                Back
              </Button>

              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                endIcon={activeStep === steps.length - 1 ? <CheckCircle /> : <ArrowForward />}
                sx={{ 
                  px: 3.5,
                  py: 1.4,
                  borderRadius: '12px',
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                  '&:hover': { 
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.45)',
                  }
                }}
              >
                {loading ? 'Processing...' : activeStep === steps.length - 1 ? 'Create Account' : 'Continue'}
              </Button>
            </Box>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Already have an account?{' '}
                <Link 
                  component={RouterLink} 
                  to="/login" 
                  sx={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};

export default Register;
