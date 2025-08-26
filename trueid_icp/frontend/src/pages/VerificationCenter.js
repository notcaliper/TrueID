import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tab,
  Tabs,
  Alert
} from '@mui/material';
import {
  VerifiedUser as VerifiedIcon,
  Pending as PendingIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Description as DocumentIcon
} from '@mui/icons-material';

const VerificationCenter = () => {
  const [tabValue, setTabValue] = useState(0);
  const [verifications, setVerifications] = useState([
    {
      id: 1,
      type: 'identity',
      title: 'Identity Verification',
      status: 'verified',
      date: '2024-01-15',
      verifier: 'Government Authority'
    },
    {
      id: 2,
      type: 'employment',
      title: 'Employment at Tech Corp',
      status: 'pending',
      date: '2024-01-20',
      verifier: 'HR Department'
    },
    {
      id: 3,
      type: 'document',
      title: 'University Diploma',
      status: 'verified',
      date: '2024-01-10',
      verifier: 'University Registrar'
    }
  ]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckIcon color="success" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'rejected':
        return <CancelIcon color="error" />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'identity':
        return <PersonIcon />;
      case 'employment':
        return <WorkIcon />;
      case 'document':
        return <DocumentIcon />;
      default:
        return <VerifiedIcon />;
    }
  };

  const filteredVerifications = verifications.filter(verification => {
    if (tabValue === 0) return true; // All
    if (tabValue === 1) return verification.status === 'verified';
    if (tabValue === 2) return verification.status === 'pending';
    if (tabValue === 3) return verification.status === 'rejected';
    return true;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Verification Center
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Manage and track your credential verifications
      </Typography>

      {/* Verification Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {verifications.filter(v => v.status === 'verified').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Verified
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {verifications.filter(v => v.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                {verifications.filter(v => v.status === 'rejected').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rejected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary.main">
                {verifications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Request New Verification */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Need to verify a new credential? Contact your organization's verification authority or use our automated verification system.
      </Alert>

      <Card>
        <CardContent>
          {/* Tabs */}
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="All" />
            <Tab label="Verified" />
            <Tab label="Pending" />
            <Tab label="Rejected" />
          </Tabs>

          {/* Verifications List */}
          {filteredVerifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No verifications found for the selected filter.
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredVerifications.map((verification) => (
                <ListItem key={verification.id} divider>
                  <ListItemIcon>
                    {getTypeIcon(verification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={verification.title}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" display="block">
                          Verified by: {verification.verifier}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Date: {verification.date}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(verification.status)}
                      <Chip
                        label={verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                        color={getStatusColor(verification.status)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default VerificationCenter;
