import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Box, Typography } from '@mui/material';

const DevLogin = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleDevLogin = () => {
    // Mock user data
    const mockUser = {
      id: 'mock-user-id',
      username: 'testuser',
      email: 'test@example.com',
      name: 'Test User',
      walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      verified: true,
      createdAt: new Date().toISOString()
    };

    // Mock tokens
    const mockTokens = {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXVzZXItaWQiLCJuYW1lIjoiVGVzdCBVc2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjE2MTQ4MzY1LCJleHAiOjE5MzE3MDgzNjV9.mY8JjsGFnzFv-sqZRX3hJoZhBdnbYW_MnFJyHLxvVwE',
      refreshToken: 'mock-refresh-token'
    };

    // Store in localStorage
    localStorage.setItem('accessToken', mockTokens.accessToken);
    localStorage.setItem('refreshToken', mockTokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(mockUser));

    // Update auth context
    setUser(mockUser);

    // Redirect to dashboard
    navigate('/');

    console.log('Dev login successful! Redirecting to dashboard...');
  };

  return (
    <Box sx={{ mt: 2, textAlign: 'center' }}>
      <Typography variant="h6" color="error" gutterBottom>
        Development Mode
      </Typography>
      <Button 
        variant="contained" 
        color="error" 
        onClick={handleDevLogin}
        sx={{ mt: 1 }}
      >
        Bypass Login (Dev Only)
      </Button>
    </Box>
  );
};

export default DevLogin;
