import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import DevLogin from './DevLogin';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setSubmitting(true);
    setLoginError('');
    
    try {
      // Call login function from AuthContext
      const result = await login({
        username: formData.username,
        password: formData.password
      });
      
      if (result.success) {
        // Redirect to dashboard after successful login
        navigate('/');
      } else {
        setLoginError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setLoginError(error.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Sign In to TrueID
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Access your secure blockchain identity
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {(loginError || error) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {loginError || error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={formData.username}
            onChange={handleChange}
            error={!!formErrors.username}
            helperText={formErrors.username}
            disabled={submitting}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            error={!!formErrors.password}
            helperText={formErrors.password}
            disabled={submitting}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={submitting || loading}
          >
            {(submitting || loading) ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
          
          <Grid container>
            <Grid item xs>
              <Link to="#" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Forgot password?
                </Typography>
              </Link>
            </Grid>
            <Grid item>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Don't have an account? Sign up
                </Typography>
              </Link>
            </Grid>
          </Grid>
        </Box>
        
        {/* Development mode login button */}
        <Box sx={{ mt: 4 }}>
          <DevLogin />
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
