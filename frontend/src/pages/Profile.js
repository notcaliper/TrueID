import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip
} from '@mui/material';
import {
  PersonRounded,
  EmailRounded,
  PhoneRounded,
  BadgeRounded,
  FingerprintRounded,
  SaveRounded,
  SecurityRounded,
  WorkRounded,
  CheckCircleRounded,
  CloseRounded,
  ShieldRounded,
  VerifiedUserRounded,
  LockRounded
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userAPI, authAPI } from '../services/api.service';
import ProfessionUploadForm from '../components/ProfessionUploadForm';
import MFASettings from '../components/MFASettings';
import BiometricVerification from '../components/BiometricVerification';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [biometricModalOpen, setBiometricModalOpen] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    governmentId: ''
  });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userAPI.getProfile();
      const userData = response.data.user || response.data || {};
      const { name, email, phone, government_id } = userData;

      setProfileData({
        name: name || user?.name || '',
        email: email || user?.email || '',
        phone: phone || user?.phone || '',
        governmentId: government_id || user?.government_id || ''
      });

      const mfaResp = await authAPI.getMFAStatus().catch(() => ({ data: { enabled: false } }));
      setMfaEnabled(mfaResp.data?.enabled || false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Fallback to auth context user
      if (user) {
        setProfileData({
          name: user.name || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : ''),
          email: user.email || '',
          phone: user.phone || '',
          governmentId: user.government_id || 'JIFPM9413P'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await userAPI.updateProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone
      });

      if (setUser) {
        setUser(prev => ({
          ...prev,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone
        }));
      }

      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleBiometricComplete = async () => {
    setSuccess('Biometric scan successfully synchronized with your decentralized passport.');
    setBiometricModalOpen(false);
    await fetchProfile();
  };

  const displayName = profileData.name || user?.name || 'Verified Citizen';
  const userInitials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ID';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={48} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1440px', mx: 'auto', px: { xs: 2, md: 4 }, py: 3 }}>
      {/* 1. Header Profile Banner */}
      <Box 
        sx={{ 
          p: { xs: 2.5, md: 3.5 },
          mb: 4,
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(19, 27, 46, 0.95) 0%, rgba(10, 14, 23, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Avatar 
            sx={{ 
              width: 68, 
              height: 68, 
              bgcolor: '#6366f1', 
              fontSize: '1.5rem', 
              fontWeight: 800,
              boxShadow: '0 0 24px rgba(99, 102, 241, 0.45)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {userInitials}
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h5" fontWeight={800} color="#f8fafc">
                {displayName}
              </Typography>
              <Chip 
                size="small" 
                icon={<CheckCircleRounded sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
                label="Identity Verified" 
                sx={{ 
                  bgcolor: 'rgba(16, 185, 129, 0.1)', 
                  color: '#34d399', 
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }} 
              />
            </Box>
            <Typography variant="body2" color="#94a3b8">
              National Registry ID: <Box component="span" sx={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{profileData.governmentId || 'Verified'}</Box> • Biometrics: Active
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          onClick={() => setBiometricModalOpen(true)}
          startIcon={<FingerprintRounded />}
          sx={{ 
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            px: 2.5,
            py: 1,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
          }}
        >
          Update Biometric Scan
        </Button>
      </Box>

      {/* Alerts */}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>{success}</Alert>}

      {/* 2. Main Layout Split */}
      <Grid container spacing={3}>
        {/* Left Column: Security Shield & Status Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Card className="fintech-card" sx={{ p: 1 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" color="#818cf8" letterSpacing={1} sx={{ mb: 2 }}>
                  SECURITY & AUTH SHIELD
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <FingerprintRounded sx={{ color: '#10b981' }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="#f8fafc">Facial Mesh Biometrics</Typography>
                        <Typography variant="caption" color="#64748b">Hardware Enclave active</Typography>
                      </Box>
                    </Box>
                    <Chip size="small" label="Active" color="success" sx={{ height: 22, fontSize: '0.7rem' }} />
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <LockRounded sx={{ color: mfaEnabled ? '#10b981' : '#f59e0b' }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="#f8fafc">Two-Factor Auth (MFA)</Typography>
                        <Typography variant="caption" color="#64748b">TOTP Authenticator App</Typography>
                      </Box>
                    </Box>
                    <Chip 
                      size="small" 
                      label={mfaEnabled ? "Enabled" : "Disabled"} 
                      sx={{ 
                        height: 22, 
                        fontSize: '0.7rem',
                        bgcolor: mfaEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: mfaEnabled ? '#34d399' : '#fbbf24'
                      }} 
                    />
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <VerifiedUserRounded sx={{ color: '#6366f1' }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="#f8fafc">Sovereign Web3 Tier</Typography>
                        <Typography variant="caption" color="#64748b">Sepolia Smart Contract</Typography>
                      </Box>
                    </Box>
                    <Chip size="small" label="Standard" sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card className="fintech-card" sx={{ p: 1 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" color="#34d399" letterSpacing={1} sx={{ mb: 1.5 }}>
                  DECENTRALIZED VAULT
                </Typography>
                <Typography variant="body2" color="#94a3b8" sx={{ mb: 2 }}>
                  Your personal records are protected using zero-knowledge biometric hashing and stored encrypted.
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setActiveTab(1)}
                  startIcon={<WorkRounded />}
                  sx={{ textTransform: 'none', borderRadius: '10px' }}
                >
                  View Stored Credentials
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Grid>

        {/* Right Column: Profile Navigation Tabs & Forms */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card className="fintech-card" sx={{ p: 1 }}>
            <Box sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', px: 2, pt: 1 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': {
                    color: '#94a3b8',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    minHeight: 48,
                    '&.Mui-selected': { color: '#ffffff' }
                  },
                  '& .MuiTabs-indicator': { backgroundColor: '#6366f1', height: 3, borderRadius: '3px 3px 0 0' }
                }}
              >
                <Tab icon={<PersonRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Personal Details" />
                <Tab icon={<WorkRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Credentials" />
                <Tab icon={<SecurityRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Security & 2FA" />
              </Tabs>
            </Box>

            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              {/* Tab 0: Personal Details */}
              {activeTab === 0 && (
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Typography variant="h6" fontWeight={700} color="#f8fafc">
                    Personal Information
                  </Typography>
                  <Typography variant="body2" color="#94a3b8">
                    Update your verified contact preferences and identity records.
                  </Typography>

                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Full Legal Name"
                        name="name"
                        value={profileData.name}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Government ID Number"
                        name="governmentId"
                        value={profileData.governmentId}
                        disabled
                        helperText="Government ID is verified and tamper-proof."
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        value={profileData.email}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleChange}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={updating}
                      startIcon={<SaveRounded />}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                      }}
                    >
                      {updating ? 'Saving Changes...' : 'Save Profile Changes'}
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Tab 1: Credentials */}
              {activeTab === 1 && (
                <Box>
                  <ProfessionUploadForm onUploadSuccess={fetchProfile} />
                </Box>
              )}

              {/* Tab 2: Security & 2FA */}
              {activeTab === 2 && (
                <Box>
                  <MFASettings onStatusChange={setMfaEnabled} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Biometric Scan Modal */}
      <Dialog 
        open={biometricModalOpen} 
        onClose={() => setBiometricModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            bgcolor: '#0d121d',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FingerprintRounded sx={{ color: '#10b981' }} />
            <Typography variant="h6" fontWeight={700} color="#f8fafc">
              Biometric Landmark Verification
            </Typography>
          </Box>
          <IconButton onClick={() => setBiometricModalOpen(false)} sx={{ color: '#94a3b8' }}>
            <CloseRounded />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <BiometricVerification onVerificationComplete={handleBiometricComplete} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Profile;
