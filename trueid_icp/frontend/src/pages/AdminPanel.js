import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Tab,
  Tabs
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  People as UsersIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Block as BlockIcon,
  CheckCircle as ApproveIcon
} from '@mui/icons-material';

const AdminPanel = () => {
  const [tabValue, setTabValue] = useState(0);
  const [pendingVerifications, setPendingVerifications] = useState([
    {
      id: 1,
      user: 'John Doe',
      type: 'Identity Verification',
      submitted: '2024-01-20',
      status: 'pending'
    },
    {
      id: 2,
      user: 'Jane Smith',
      type: 'Employment Record',
      submitted: '2024-01-19',
      status: 'pending'
    }
  ]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleApprove = (id) => {
    setPendingVerifications(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: 'approved' } : item
      )
    );
  };

  const handleReject = (id) => {
    setPendingVerifications(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: 'rejected' } : item
      )
    );
  };

  const renderUserManagement = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Statistics
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Total Users:</Typography>
                <Typography fontWeight="bold">1,247</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Active Users:</Typography>
                <Typography fontWeight="bold" color="success.main">1,156</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Verified Identities:</Typography>
                <Typography fontWeight="bold" color="primary.main">892</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="New user registration"
                  secondary="2 minutes ago"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Identity verification completed"
                  secondary="15 minutes ago"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Document uploaded"
                  secondary="1 hour ago"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderVerifications = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Pending Verifications
        </Typography>
        {pendingVerifications.filter(v => v.status === 'pending').length === 0 ? (
          <Alert severity="info">No pending verifications at this time.</Alert>
        ) : (
          <List>
            {pendingVerifications
              .filter(v => v.status === 'pending')
              .map((verification) => (
                <ListItem key={verification.id} divider>
                  <ListItemText
                    primary={`${verification.user} - ${verification.type}`}
                    secondary={`Submitted: ${verification.submitted}`}
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        color="success"
                        onClick={() => handleApprove(verification.id)}
                        title="Approve"
                      >
                        <ApproveIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleReject(verification.id)}
                        title="Reject"
                      >
                        <BlockIcon />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  const renderSystemSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Configuration
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Auto-verification:</Typography>
                <Chip label="Enabled" color="success" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Maintenance Mode:</Typography>
                <Chip label="Disabled" color="default" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Backup Status:</Typography>
                <Chip label="Up to date" color="success" size="small" />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Network Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Network Health:</Typography>
                <Chip label="Healthy" color="success" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Canister Status:</Typography>
                <Chip label="Running" color="success" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Cycles Balance:</Typography>
                <Typography fontWeight="bold">2.5T cycles</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const tabContent = [
    renderUserManagement(),
    renderVerifications(),
    renderSystemSettings()
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <AdminIcon sx={{ mr: 2, fontSize: 32 }} />
        <Box>
          <Typography variant="h4" component="h1">
            Admin Panel
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            System administration and management
          </Typography>
        </Box>
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }}>
        You have administrative privileges. Use these tools responsibly.
      </Alert>

      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab icon={<UsersIcon />} label="Users" />
            <Tab icon={<SecurityIcon />} label="Verifications" />
            <Tab icon={<SettingsIcon />} label="System" />
          </Tabs>

          {tabContent[tabValue]}
        </CardContent>
      </Card>
    </Container>
  );
};

export default AdminPanel;
