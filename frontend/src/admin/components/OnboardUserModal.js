import React, { useState } from 'react';
import ApiService from '../services/adminApi.service';
import { useColorMode } from '../../context/ThemeContext';
import { getAdminThemeTokens, getInputStyle } from '../utils/adminTheme';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  MenuItem,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  CloseRounded,
  PersonAddRounded,
  BadgeRounded,
  EmailRounded,
  PhoneRounded,
  SecurityRounded
} from '@mui/icons-material';

const OnboardUserModal = ({ open, onClose, onUserCreated }) => {
  const { isLight } = useColorMode();
  const t = getAdminThemeTokens(isLight);

  const [formData, setFormData] = useState({
    name: '',
    governmentId: '',
    email: '',
    phone: '',
    verificationStatus: 'PENDING',
    initialPassword: 'Password123!'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.governmentId.trim() || !formData.email.trim()) {
      setError('Name, Government ID, and Email are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.onboardUser(formData);
      if (response && response.user) {
        if (onUserCreated) onUserCreated(response.user);
        onClose();
      }
    } catch (err) {
      console.error('Onboard citizen error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to onboard citizen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: t.paper,
          backgroundImage: 'none',
          borderRadius: 3,
          border: `1px solid ${t.border}`,
          boxShadow: isLight ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' : '0 24px 48px rgba(0, 0, 0, 0.7)'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, borderBottom: `1px solid ${t.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: t.primaryBg, color: t.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PersonAddRounded sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: t.textPrimary, fontSize: '1.05rem' }}>
              Onboard New Citizen
            </Typography>
            <Typography variant="caption" sx={{ color: t.textMuted }}>
              Issue decentralised identifier and register dossier in directory
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: t.textMuted }}>
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, bgcolor: t.errorBg, color: t.errorText, border: `1px solid ${t.errorBorder}` }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" sx={{ color: t.textSecondary, fontWeight: 700, mb: 0.5, display: 'block' }}>
                FULL LEGAL CITIZEN NAME *
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="name"
                placeholder="e.g. Ramesh Kumar Sharma"
                value={formData.name}
                onChange={handleChange}
                required
                InputProps={{ sx: getInputStyle(isLight) }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" sx={{ color: t.textSecondary, fontWeight: 700, mb: 0.5, display: 'block' }}>
                GOVERNMENT UNIQUE SERIAL ID *
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="governmentId"
                placeholder="e.g. JIFPM9413P"
                value={formData.governmentId}
                onChange={handleChange}
                required
                InputProps={{
                  sx: {
                    ...getInputStyle(isLight),
                    fontFamily: 'monospace',
                    textTransform: 'uppercase'
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" sx={{ color: t.textSecondary, fontWeight: 700, mb: 0.5, display: 'block' }}>
                OFFICIAL EMAIL ADDRESS *
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="email"
                name="email"
                placeholder="citizen@domain.org"
                value={formData.email}
                onChange={handleChange}
                required
                InputProps={{ sx: getInputStyle(isLight) }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" sx={{ color: t.textSecondary, fontWeight: 700, mb: 0.5, display: 'block' }}>
                TELEPHONE / CONTACT
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="phone"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
                InputProps={{ sx: getInputStyle(isLight) }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" sx={{ color: t.textSecondary, fontWeight: 700, mb: 0.5, display: 'block' }}>
                INITIAL ATTESTATION STATUS
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                name="verificationStatus"
                value={formData.verificationStatus}
                onChange={handleChange}
                InputProps={{ sx: getInputStyle(isLight) }}
              >
                <MenuItem value="PENDING">Pending FaceMesh / Review</MenuItem>
                <MenuItem value="VERIFIED">Pre-Verified & Direct Attestation</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${t.border}`, gap: 1 }}>
          <Button onClick={onClose} sx={{ color: t.textSecondary, textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <PersonAddRounded />}
            sx={{
              bgcolor: t.primary,
              color: '#ffffff',
              fontWeight: 700,
              textTransform: 'none',
              px: 3,
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: t.primaryDark
              }
            }}
          >
            {loading ? 'Registering...' : 'Register Citizen'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default OnboardUserModal;
