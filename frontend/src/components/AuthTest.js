import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const AuthTest = () => {
  const { login, register, user, loading, error, logout } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);
  const [testInProgress, setTestInProgress] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiError, setApiError] = useState(null);
  
  // Clear API response and error when component unmounts
  useEffect(() => {
    return () => {
      setApiResponse(null);
      setApiError(null);
    };
  }, []);

  // Test user registration
  const testRegistration = async () => {
    setTestInProgress(true);
    setTestResult(null);
    setTestError(null);
    
    try {
      // Generate random values for testing
      const randomId = Math.floor(Math.random() * 1000000);
      
      const userData = {
        name: `Test User ${randomId}`,
        username: `testuser${randomId}`,
        password: 'Password123!',
        governmentId: `GOV-${randomId}`,
        email: `testuser${randomId}@example.com`,
        phone: `555-${randomId}`
      };
      
      console.log('Sending registration data:', userData);
      
      const result = await register(userData);
      console.log('Registration result:', result);
      
      if (result.success) {
        setTestResult({
          type: 'registration',
          message: 'Registration successful!',
          data: result.user
        });
      } else {
        setTestError(`Registration failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Registration error details:', error);
      setTestError(`Registration error: ${error.message || 'Unknown error'}`);
    } finally {
      setTestInProgress(false);
    }
  };

  // Test user login
  const testLogin = async () => {
    setTestInProgress(true);
    setTestResult(null);
    setTestError(null);
    
    try {
      // Use fixed test credentials
      const credentials = {
        username: 'testuser',
        password: 'testpassword'
      };
      
      console.log('Sending login credentials:', credentials);
      
      const result = await login(credentials);
      console.log('Login result:', result);
      
      if (result.success) {
        setTestResult({
          type: 'login',
          message: 'Login successful!',
          data: result.user
        });
      } else {
        setTestError(`Login failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Login error details:', error);
      setTestError(`Login error: ${error.message || 'Unknown error'}`);
    } finally {
      setTestInProgress(false);
    }
  };

  // Direct API test for registration
  const testDirectRegistration = async () => {
    setApiResponse(null);
    setApiError(null);
    setTestInProgress(true);
    
    try {
      // Generate random values for testing
      const randomId = Math.floor(Math.random() * 1000000);
      
      const userData = {
        name: `Test User ${randomId}`,
        username: `testuser${randomId}`,
        password: 'Password123!',
        governmentId: `GOV-${randomId}`,
        email: `testuser${randomId}@example.com`,
        phone: `555-${randomId}`
      };
      
      console.log('Sending direct API registration data:', userData);
      
      // Make direct API call
      const response = await axios.post('/api/user/register', userData);
      console.log('Direct API registration response:', response.data);
      setApiResponse(response.data);
    } catch (error) {
      console.error('Direct API registration error:', error.response?.data || error);
      setApiError(error.response?.data || { message: error.message });
    } finally {
      setTestInProgress(false);
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Authentication Test Panel
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      {testError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {testError}
        </Alert>
      )}
      
      {testResult && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            {testResult.message}
          </Typography>
          <Typography variant="body2" component="pre" sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1, overflow: 'auto' }}>
            {JSON.stringify(testResult.data, null, 2)}
          </Typography>
        </Alert>
      )}
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={testRegistration}
            disabled={testInProgress || loading}
          >
            {testInProgress && testResult?.type === 'registration' ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Test Registration'
            )}
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            onClick={testLogin}
            disabled={testInProgress || loading}
          >
            {testInProgress && testResult?.type === 'login' ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Test Login'
            )}
          </Button>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          color="info"
          fullWidth
          onClick={testDirectRegistration}
          disabled={testInProgress}
          sx={{ mt: 2 }}
        >
          Test Direct API Registration
        </Button>
      </Box>
      
      {/* API Response Section */}
      {(apiResponse || apiError) && (
        <Accordion sx={{ mt: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>
              {apiResponse ? 'API Response Details' : 'API Error Details'}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Typography variant="body2" component="pre" sx={{ overflow: 'auto' }}>
                {JSON.stringify(apiResponse || apiError, null, 2)}
              </Typography>
            </Paper>
          </AccordionDetails>
        </Accordion>
      )}
      
      {user && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Current User:
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="body2" component="pre" sx={{ overflow: 'auto' }}>
              {JSON.stringify(user, null, 2)}
            </Typography>
          </Paper>
          <Button 
            variant="outlined" 
            color="error" 
            sx={{ mt: 2 }}
            onClick={logout}
          >
            Logout
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default AuthTest;
