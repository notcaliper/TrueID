import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ShieldRounded } from '@mui/icons-material';

const LoadingScreen = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0e17',
        color: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background glow */}
      <Box
        sx={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <CircularProgress
          size={72}
          thickness={3}
          sx={{
            color: '#6366f1',
            animationDuration: '1.2s',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8',
          }}
        >
          <ShieldRounded sx={{ fontSize: 32 }} />
        </Box>
      </Box>

      <Typography
        variant="h6"
        fontWeight={700}
        sx={{
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        TrueID Enclave
      </Typography>
      <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, fontWeight: 500, letterSpacing: '0.04em' }}>
        Authenticating cryptographic session...
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
