import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Alert,
  CircularProgress,
} from '@mui/material';
import { LoginOutlined, Security, Speed, AccountBalance } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { login, loading, error } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const features = [
    {
      icon: <Security color="primary" sx={{ fontSize: 40 }} />,
      title: 'Secure Identity',
      description: 'Biometric authentication with threshold cryptography on Internet Computer',
    },
    {
      icon: <Speed color="primary" sx={{ fontSize: 40 }} />,
      title: 'Zero Gas Fees',
      description: 'No transaction costs for users - all operations are free',
    },
    {
      icon: <AccountBalance color="primary" sx={{ fontSize: 40 }} />,
      title: 'Fully Decentralized',
      description: 'No servers, no databases - everything runs on-chain',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1200 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              TrueID
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
              Decentralized Biometric Identity System on Internet Computer
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Secure, private, and verifiable digital identity powered by ICP's revolutionary blockchain technology.
              No gas fees, web-speed performance, and true decentralization.
            </Typography>
          </Box>

          {/* Features Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4, mb: 6 }}>
            {features.map((feature, index) => (
              <Card key={index} sx={{ textAlign: 'center', p: 3 }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Login Card */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Card sx={{ maxWidth: 400, width: '100%' }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  Sign In with Internet Identity
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Use your Internet Identity to securely access TrueID.
                  New users will be guided through identity setup.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleLogin}
                  disabled={loading || isLoggingIn}
                  startIcon={
                    loading || isLoggingIn ? (
                      <CircularProgress size={20} />
                    ) : (
                      <LoginOutlined />
                    )
                  }
                  sx={{ py: 1.5 }}
                >
                  {loading || isLoggingIn ? 'Connecting...' : 'Sign In with Internet Identity'}
                </Button>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
                  By signing in, you agree to use TrueID's decentralized identity services.
                  Your data is encrypted and stored on the Internet Computer blockchain.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Additional Info */}
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an Internet Identity?{' '}
              <Button
                variant="text"
                size="small"
                href="https://identity.ic0.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Create one here
              </Button>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
