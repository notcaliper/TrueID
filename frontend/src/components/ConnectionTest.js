import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';

/**
 * Component to test the connection between frontend and backend
 */
const ConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    tested: false,
    connected: false,
    message: '',
    loading: false,
    error: null
  });

  const testConnection = async () => {
    setConnectionStatus(prev => ({ ...prev, loading: true, tested: true, error: null }));
    
    try {
      // Test the connection to the backend
      const response = await axios.get('/api/test/ping');
      
      setConnectionStatus({
        tested: true,
        connected: true,
        message: response.data.message,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Connection test failed:', error);
      
      setConnectionStatus({
        tested: true,
        connected: false,
        message: '',
        loading: false,
        error: error.message || 'Failed to connect to the backend'
      });
    }
  };

  useEffect(() => {
    // Automatically test connection when component mounts
    testConnection();
  }, []);

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Backend Connection Status
      </Typography>
      
      {connectionStatus.loading ? (
        <Box display="flex" alignItems="center" my={2}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Testing connection...</Typography>
        </Box>
      ) : connectionStatus.tested ? (
        <Box my={2}>
          {connectionStatus.connected ? (
            <Alert severity="success">
              {connectionStatus.message || 'Successfully connected to the backend!'}
            </Alert>
          ) : (
            <Alert severity="error">
              {connectionStatus.error || 'Failed to connect to the backend. Please check server status.'}
            </Alert>
          )}
        </Box>
      ) : null}
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={testConnection}
        disabled={connectionStatus.loading}
      >
        {connectionStatus.tested ? 'Test Again' : 'Test Connection'}
      </Button>
    </Paper>
  );
};

export default ConnectionTest;
