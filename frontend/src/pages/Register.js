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
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowForward, ArrowBack, CheckCircle, PersonAddOutlined } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const steps = ['Personal Info', 'Account Setup', 'Verification'];

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
    0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
    100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
  }
`;

const Register = () => {
  const { register, isAuthenticated, loading, error } = useAuth();
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
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated()) navigate('/');
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({ ...formData, [name]: name === 'agreeTerms' ? checked : value });
    setLocalError('');
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0:
        if (!formData.firstName || !formData.lastName) return 'Please enter your full name';
        if (!formData.governmentId) return 'Government ID is required';
        break;
      case 1:
        if (!formData.username) return 'Username is required';
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) return 'Valid email is required';
        if (!formData.phone) return 'Phone number is required';
        break;
      case 2:
        if (!formData.password || formData.password.length < 8) return 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
        if (!formData.agreeTerms) return 'You must agree to the terms';
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

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Fade in={true}>
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                Personal Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your legal name and government ID for verification
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                <TextField
                  fullWidth
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  InputProps={{ sx: { color: '#fff' } }}
                />
                <TextField
                  fullWidth
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  InputProps={{ sx: { color: '#fff' } }}
                />
              </Box>
              <TextField
                fullWidth
                name="governmentId"
                label="Government ID Number"
                value={formData.governmentId}
                onChange={handleChange}
                placeholder="e.g., SSN, Passport, National ID"
                InputProps={{ sx: { color: '#fff' } }}
                sx={{ mb: 2.5 }}
              />
            </Box>
          </Fade>
        );
      case 1:
        return (
          <Fade in={true}>
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                Account Details
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your login credentials
              </Typography>
              <TextField
                fullWidth
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a unique username"
                InputProps={{ sx: { color: '#fff' } }}
                sx={{ mb: 2.5 }}
              />
              <TextField
                fullWidth
                name="email"
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                InputProps={{ sx: { color: '#fff' } }}
                sx={{ mb: 2.5 }}
              />
              <TextField
                fullWidth
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                InputProps={{ sx: { color: '#fff' } }}
              />
            </Box>
          </Fade>
        );
      case 2:
        return (
          <Fade in={true}>
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                Security Setup
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create a secure password for your account
              </Typography>
              <TextField
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 8 characters"
                sx={{ mb: 2.5 }}
                InputProps={{
                  sx: { color: '#fff' },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={() => setShowPassword(!showPassword)} 
                        edge="end" 
                        size="small"
                        sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff' } }}
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
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                InputProps={{ sx: { color: '#fff' } }}
                sx={{ mb: 2.5 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    size="small"
                    sx={{ 
                      color: 'rgba(255,255,255,0.3)',
                      '&.Mui-checked': { color: '#6366f1' }
                    }}
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    I agree to the <Link sx={{ color: '#818cf8', cursor: 'pointer' }}>Terms of Service</Link> and{' '}
                    <Link sx={{ color: '#818cf8', cursor: 'pointer' }}>Privacy Policy</Link>
                  </Typography>
                }
              />
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
          right: '-10%',
          width: '55vw',
          height: '55vw',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(10,14,23,0) 70%)',
          borderRadius: '50%',
          animation: 'float1 22s infinite ease-in-out',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, rgba(10,14,23,0) 70%)',
          borderRadius: '50%',
          animation: 'float2 28s infinite ease-in-out reverse',
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
              flex: 1,
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
                <PersonAddOutlined sx={{ color: '#fff', fontSize: 26 }} />
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
            
            <Typography variant="h5" fontWeight={600} gutterBottom color="text.primary">
              Join the Network
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 6, lineHeight: 1.7 }}>
              Get started with the world's most trusted digital identity platform. Secure, private, and blockchain-verified.
            </Typography>
            
            {/* Steps indicator for left panel */}
            <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {steps.map((label, index) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 2, opacity: activeStep === index ? 1 : 0.5 }}>
                  <Box sx={{ 
                    width: 32, height: 32, borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: activeStep >= index ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${activeStep >= index ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                    color: activeStep >= index ? '#818cf8' : '#94a3b8'
                  }}>
                    {activeStep > index ? <CheckCircle fontSize="small" sx={{ color: '#10b981' }} /> : index + 1}
                  </Box>
                  <Typography variant="body2" fontWeight={activeStep === index ? 600 : 500} color={activeStep >= index ? '#fff' : 'text.secondary'}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Right Side - Registration Form */}
          <Box
            sx={{
              flex: 1.2,
              p: { xs: 4, md: 7 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            {/* Mobile Branding */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
              <PersonAddOutlined sx={{ color: '#6366f1', fontSize: 28 }} />
              <Typography variant="h4" fontWeight={800} color="#fff">TrueID</Typography>
            </Box>

            <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
              Create Account
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Complete the verification steps below to get started
            </Typography>

            {/* Stepper for mobile only, since desktop has it on the left */}
            <Stepper 
              activeStep={activeStep} 
              sx={{ 
                mb: 4, 
                display: { xs: 'flex', md: 'none' },
                '& .MuiStepLabel-label': { color: 'text.secondary' },
                '& .MuiStepLabel-label.Mui-active': { color: '#818cf8' },
                '& .MuiStepIcon-root': { color: 'rgba(255,255,255,0.1)' },
                '& .MuiStepIcon-root.Mui-active': { color: '#6366f1' },
                '& .MuiStepIcon-root.Mui-completed': { color: '#10b981' },
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
                  background: 'rgba(244, 63, 94, 0.1)',
                  color: '#fda4af',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  '& .MuiAlert-icon': { color: '#f43f5e' }
                }}
              >
                {error || localError}
              </Alert>
            )}

            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBack />}
                sx={{ color: '#94a3b8', '&:hover': { background: 'rgba(255,255,255,0.05)' } }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                endIcon={activeStep === steps.length - 1 ? <CheckCircle /> : <ArrowForward />}
                sx={{ 
                  px: 4,
                  py: 1.4,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  boxShadow: '0 2px 12px rgba(99, 102, 241, 0.35)',
                  '&:hover': { 
                    background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                    boxShadow: '0 4px 18px rgba(99, 102, 241, 0.5)'
                  }
                }}
              >
                {loading ? 'Processing...' : activeStep === steps.length - 1 ? 'Create Account' : 'Continue'}
              </Button>
            </Box>

            <Box sx={{ mt: 5, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" sx={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
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
