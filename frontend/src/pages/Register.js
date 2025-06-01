import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton,
  FormHelperText,
  FormControl,
  InputLabel,
  OutlinedInput
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const steps = ['Account Information', 'Biometric Data (Optional)', 'Review'];

const Register = () => {
  const { register, isAuthenticated, loading, error } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    governmentId: '',
    email: '',
    phone: '',
    facemeshData: null
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [facemeshCapturing, setFacemeshCapturing] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Simulate facemesh capture
  const captureFacemesh = async () => {
    setFacemeshCapturing(true);
    setLocalError('');
    
    try {
      // In a real app, this would use a camera and ML model to capture facial biometrics
      // For demo purposes, we'll simulate this with a timeout and mock data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock facemesh data (in a real app, this would be actual biometric data)
      const mockFacemeshData = {
        landmarks: Array.from({ length: 68 }, () => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
          z: Math.random() * 50
        })),
        timestamp: Date.now()
      };
      
      setFormData({
        ...formData,
        facemeshData: mockFacemeshData
      });
      
      return true;
    } catch (err) {
      setLocalError('Failed to capture biometric data. Please try again.');
      return false;
    } finally {
      setFacemeshCapturing(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const validateStep = () => {
    setLocalError('');
    
    if (activeStep === 0) {
      // Validate account information
      if (!formData.name) return 'Full name is required';
      if (!formData.username) return 'Username is required';
      if (!formData.password) return 'Password is required';
      if (formData.password.length < 8) return 'Password must be at least 8 characters';
      if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
      if (!formData.governmentId) return 'Government ID is required';
      if (!formData.email) return 'Email is required';
      if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Email is invalid';
      if (!formData.phone) return 'Phone number is required';
    }
    // Biometric data is now optional, so no validation needed for step 1
    
    return null;
  };

  const handleNext = async () => {
    const error = validateStep();
    if (error) {
      setLocalError(error);
      return;
    }
    
    // Biometric data is now optional, so we don't force capture
    
    if (activeStep === steps.length - 1) {
      // Submit registration
      const result = await register(formData);
      if (result.success) {
        navigate('/');
      }
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl required fullWidth variant="outlined">
                <InputLabel htmlFor="password">Password</InputLabel>
                <OutlinedInput
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Password"
                />
                <FormHelperText>Password must be at least 8 characters</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl required fullWidth variant="outlined">
                <InputLabel htmlFor="confirmPassword">Confirm Password</InputLabel>
                <OutlinedInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowConfirmPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Confirm Password"
                />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="governmentId"
                label="Government ID"
                name="governmentId"
                autoComplete="off"
                value={formData.governmentId}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="phone"
                label="Phone Number"
                name="phone"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body1" gutterBottom>
                Biometric data is optional but recommended for additional security.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This will be used for identity verification purposes only, not for login. You will log in with your username and password. Please ensure you are in a well-lit environment and look directly at the camera.
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                color={formData.facemeshData ? "success" : "primary"}
                onClick={captureFacemesh}
                disabled={facemeshCapturing}
                startIcon={facemeshCapturing ? <CircularProgress size={20} /> : null}
                sx={{ mt: 2 }}
              >
                {formData.facemeshData 
                  ? "Biometric Data Captured ✓" 
                  : facemeshCapturing 
                    ? "Capturing..." 
                    : "Capture Biometric Data (Optional)"}
              </Button>
              {!formData.facemeshData && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  You can skip this step if you don't want to provide biometric data now.
                </Typography>
              )}
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review Your Information
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body1"><strong>Name:</strong> {formData.name}</Typography>
                <Typography variant="body1"><strong>Username:</strong> {formData.username}</Typography>
                <Typography variant="body1"><strong>Government ID:</strong> {formData.governmentId}</Typography>
                <Typography variant="body1"><strong>Email:</strong> {formData.email}</Typography>
                <Typography variant="body1"><strong>Phone:</strong> {formData.phone}</Typography>
                <Typography variant="body1"><strong>Password:</strong> ********</Typography>
                <Typography variant="body1"><strong>Biometric Data:</strong> {formData.facemeshData ? 'Captured ✓' : 'Not Captured (Optional)'}</Typography>
              </Paper>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                By clicking "Register", you agree to our Terms of Service and Privacy Policy.
              </Typography>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Typography component="h1" variant="h5">
            Register for TrueID
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ width: '100%', my: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {(error || localError) && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error || localError}
            </Alert>
          )}
          
          <Box sx={{ mt: 2, width: '100%' }}>
            {renderStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0 || loading}
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : activeStep === steps.length - 1 ? (
                  'Register'
                ) : (
                  'Next'
                )}
              </Button>
            </Box>
          </Box>
          
          <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
