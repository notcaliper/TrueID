import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Info as InfoIcon, Warning as WarningIcon } from '@mui/icons-material';

const TestGuide = () => {
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Authentication Testing Guide
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      <Typography variant="body1" paragraph>
        This guide explains how to test the TrueID authentication system. The system integrates with the Avalanche blockchain
        to create a secure identity for users.
      </Typography>
      
      <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1, mb: 2 }}>
        <Typography variant="subtitle2" color="info.contrastText">
          During registration, the system automatically:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <InfoIcon fontSize="small" color="info" />
            </ListItemIcon>
            <ListItemText primary="Creates a user account in the database" />
          </ListItem>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <InfoIcon fontSize="small" color="info" />
            </ListItemIcon>
            <ListItemText primary="Generates an Avalanche C-Chain wallet" />
          </ListItem>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <InfoIcon fontSize="small" color="info" />
            </ListItemIcon>
            <ListItemText primary="Stores the wallet address and encrypted private key" />
          </ListItem>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <InfoIcon fontSize="small" color="info" />
            </ListItemIcon>
            <ListItemText primary="Issues JWT tokens for authentication" />
          </ListItem>
        </List>
      </Box>
      
      <Typography variant="subtitle1" gutterBottom>
        Testing Instructions:
      </Typography>
      
      <List>
        <ListItem>
          <ListItemIcon>
            <InfoIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Test Registration" 
            secondary="Creates a new user with random credentials and an Avalanche wallet" 
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <InfoIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Test Login" 
            secondary="Attempts to log in with test credentials (username: testuser, password: testpassword)" 
          />
        </ListItem>
      </List>
      
      <Box sx={{ bgcolor: 'warning.light', p: 2, borderRadius: 1, mt: 2 }}>
        <Typography variant="subtitle2" color="warning.contrastText" gutterBottom>
          Important Notes:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <WarningIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText primary="The test login will only work if a user with those credentials exists" />
          </ListItem>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <WarningIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText primary="You may need to create a test user first with those credentials" />
          </ListItem>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <WarningIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText primary="Check the console for detailed API responses and errors" />
          </ListItem>
        </List>
      </Box>
    </Paper>
  );
};

export default TestGuide;
