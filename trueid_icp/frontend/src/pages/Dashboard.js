import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Avatar,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Work as WorkIcon,
  Description as DocumentIcon,
  VerifiedUser as VerifiedIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { identity, user } = useAuth();

  const dashboardCards = [
    {
      title: 'Identity Status',
      description: 'Manage your digital identity',
      icon: <PersonIcon />,
      color: 'primary',
      status: identity ? 'Verified' : 'Pending',
      action: 'View Identity',
      path: '/identity'
    },
    {
      title: 'Professional Records',
      description: 'Employment and education history',
      icon: <WorkIcon />,
      color: 'secondary',
      status: 'Active',
      action: 'Manage Records',
      path: '/professional'
    },
    {
      title: 'Document Storage',
      description: 'Secure document management',
      icon: <DocumentIcon />,
      color: 'success',
      status: 'Available',
      action: 'View Documents',
      path: '/documents'
    },
    {
      title: 'Verification Center',
      description: 'Verify credentials and documents',
      icon: <VerifiedIcon />,
      color: 'warning',
      status: 'Ready',
      action: 'Start Verification',
      path: '/verification'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            <DashboardIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome to TrueID
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Your decentralized identity management dashboard
            </Typography>
          </Box>
        </Box>

        {/* Identity Status Bar */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Identity Verification Progress</Typography>
              <Chip 
                label={identity ? 'Verified' : 'In Progress'} 
                color={identity ? 'success' : 'warning'}
                variant="outlined"
              />
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={identity ? 100 : 60} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {identity ? 'Your identity is fully verified and ready to use.' : 'Complete your identity setup to access all features.'}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Dashboard Cards */}
      <Grid container spacing={3}>
        {dashboardCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${card.color}.main`, mr: 2 }}>
                    {card.icon}
                  </Avatar>
                  <Chip 
                    label={card.status} 
                    size="small" 
                    color={card.color}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  color={card.color}
                  onClick={() => {
                    // Navigation will be handled by React Router
                    console.log(`Navigate to ${card.path}`);
                  }}
                >
                  {card.action}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Recent Activity
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary">
              No recent activity to display. Start using TrueID to see your activity here.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Dashboard;
