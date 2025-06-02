import React from 'react';
import { Container, Typography, Box, Paper, Divider } from '@mui/material';
import AuthTest from '../components/AuthTest';
import ConnectionTest from '../components/ConnectionTest';
import TestGuide from '../components/TestGuide';

const TestPage = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            TrueID System Test Page
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This page contains testing tools for the TrueID system. Use these tools to verify that 
            different components of the system are working correctly.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="error.main">
            Note: This page is for development and testing purposes only.
          </Typography>
        </Paper>
        
        <TestGuide />
        
        <AuthTest />
        
        <ConnectionTest />
      </Box>
    </Container>
  );
};

export default TestPage;
