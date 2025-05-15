import React, { useState } from 'react';
import { 
  Avatar, 
  Button, 
  TextField, 
  Paper, 
  Box, 
  Typography, 
  Container,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';
import { useAuth } from '../utils/AuthContext';

// Development mode flag - should match the one in AuthContext.js
const DEV_MODE = true;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };
  
  const handleDevLogin = async () => {
    await login('dev', 'dev');
  };

  return (
    <Container component="main" maxWidth="xs" className="auth-container">
      <Paper elevation={3} className="auth-paper">
        <Avatar className="auth-avatar">
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Government Portal Login
        </Typography>
        
        {error && (
          <Box mt={2} width="100%">
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
        
        <Box component="form" onSubmit={handleSubmit} className="auth-form">
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          
          {DEV_MODE && (
            <Box mt={3}>
              <Divider>
                <Chip label="DEVELOPMENT MODE" color="warning" size="small" />
              </Divider>
              <Button
                fullWidth
                variant="outlined"
                color="warning"
                onClick={handleDevLogin}
                disabled={loading}
                startIcon={<DeveloperModeIcon />}
                sx={{ mt: 2 }}
              >
                Quick Dev Login
              </Button>
              <Typography variant="caption" color="text.secondary" align="center" display="block" mt={1}>
                Bypasses authentication for development purposes
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
