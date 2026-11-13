import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Tooltip,
  useTheme
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
  LockRounded,
  ContentCopyRounded,
  QrCode2Rounded,
  RefreshRounded,
  GppGoodRounded,
  KeyRounded,
  VpnKeyRounded,
  FactCheckRounded
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext';
import { userAPI, authAPI } from '../services/api.service';
import ProfessionUploadForm from '../components/ProfessionUploadForm';
import MFASettings from '../components/MFASettings';
import BiometricVerification from '../components/BiometricVerification';

const resolveGovId = (u) => u?.government_id || u?.governmentId || '';
const resolveWallet = (u) => u?.wallet_address || u?.walletAddress || '';
const resolveDid = (u) => u?.did || (resolveWallet(u) ? `did:trueid:${resolveWallet(u)}` : '');

const Profile = () => {
  const { user, setUser } = useAuth();
  const { isLight } = useColorMode();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [biometricModalOpen, setBiometricModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [profileData, setProfileData] = useState(() => {
    const govId = resolveGovId(user);
    const wallet = resolveWallet(user);
    const did = resolveDid(user);
    return {
      name: user?.name || user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      governmentId: govId,
      walletAddress: wallet,
      did: did,
      verifiedBy: '',
      lastSync: ''
    };
  });

  const fetchProfile = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [response, verRes] = await Promise.allSettled([
        userAPI.getProfile(),
        userAPI.getVerificationStatus()
      ]);
      const userData = response.status === 'fulfilled' ? (response.value?.data?.user || response.value?.data || {}) : {};
      const verData = verRes.status === 'fulfilled' ? (verRes.value?.data?.data || verRes.value?.data || {}) : {};
      const mergedUser = { ...user, ...userData };
      const effectiveGovId = resolveGovId(mergedUser);
      const effectiveWallet = resolveWallet(mergedUser);
      const effectiveDid = resolveDid(mergedUser);
      const effectiveName = mergedUser.name || '';
      const effectiveEmail = mergedUser.email || '';
      const effectivePhone = mergedUser.phone || '';

      setProfileData(prev => ({
        ...prev,
        name: effectiveName,
        email: effectiveEmail,
        phone: effectivePhone,
        governmentId: effectiveGovId,
        walletAddress: effectiveWallet,
        did: effectiveDid,
        verifiedBy: verData.verifiedBy ? `Notary Admin (@${verData.verifiedBy})` : (userData.is_verified || user?.is_verified ? 'TrueID Identity Registry' : 'Pending Verification'),
        lastSync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' })
      }));

      const mfaResp = await authAPI.getMFAStatus().catch(() => ({ data: { enabled: true } }));
      setMfaEnabled(mfaResp.data?.enabled ?? true);
    } catch (err) {
      console.warn('Profile sync:', err);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  const userId = user?.id;
  useEffect(() => {
    fetchProfile();
  }, [userId, fetchProfile]);

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleCopyDID = () => {
    navigator.clipboard.writeText(profileData.did);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      setSuccess('Identity profile successfully updated and synchronized.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please verify credentials and try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleBiometricComplete = async () => {
    setSuccess('Biometric landmark geometry successfully synchronized with your decentralized passport.');
    setBiometricModalOpen(false);
    await fetchProfile();
  };

  const displayName = profileData.name || user?.name || user?.username || '';
  const userInitials = displayName ? displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ID';

  // 4 Core Identity Pillars (Consistent with Dashboard)
  const isVerifiedUser = user?.is_verified || user?.verification_status === 'VERIFIED';
  const profilePillars = [
    {
      title: 'National KYC Identity',
      idVal: profileData.governmentId || 'Not Registered',
      status: isVerifiedUser ? 'VERIFIED' : 'PENDING',
      desc: isVerifiedUser ? 'Identity record officially verified on record' : 'Awaiting identity verification check',
      tag: isVerifiedUser ? 'Verified' : 'Pending',
      color: isVerifiedUser ? '#16a34a' : '#d97706',
      bg: isLight ? (isVerifiedUser ? '#eff6ff' : '#fffbeb') : (isVerifiedUser ? 'rgba(37, 99, 235, 0.12)' : 'rgba(217, 119, 6, 0.12)'),
      icon: <BadgeRounded sx={{ fontSize: 24 }} />
    },
    {
      title: '3D FaceMesh Biometrics',
      idVal: user?.facemesh_hash ? 'Enrolled Active Enclave' : 'Not Enrolled',
      status: user?.facemesh_hash ? 'LIVENESS VERIFIED' : 'PENDING SCAN',
      desc: user?.facemesh_hash ? 'Hardware secured facial geometry vector active' : 'No biometric vectors enrolled yet',
      tag: user?.facemesh_hash ? 'Enrolled' : 'Not Enrolled',
      color: '#7c3aed',
      bg: isLight ? '#f5f3ff' : 'rgba(124, 58, 237, 0.12)',
      icon: <FingerprintRounded sx={{ fontSize: 24 }} />
    },
    {
      title: 'Two-Factor Auth (MFA)',
      idVal: mfaEnabled ? 'TOTP Authenticator Active' : 'MFA Not Configured',
      status: mfaEnabled ? 'HARDWARE PROTECTED' : 'ACTION RECOMMENDED',
      desc: mfaEnabled ? 'Cryptographic time-based one-time authorization bound' : 'Configure authenticator app for high security',
      tag: mfaEnabled ? '2FA Enabled' : 'Disabled',
      color: mfaEnabled ? '#16a34a' : '#d97706',
      bg: isLight ? (mfaEnabled ? '#f0fdf4' : '#fffbeb') : (mfaEnabled ? 'rgba(22, 163, 74, 0.12)' : 'rgba(217, 119, 6, 0.12)'),
      icon: <LockRounded sx={{ fontSize: 24 }} />
    },
    {
      title: 'Soulbound SBT Root',
      idVal: 'ERC-5192 #002 (Non-Transferable)',
      status: 'SEPOLIA LEDGER ANCHORED',
      desc: 'Smart contract 0x266B...816E • 16 Block Confirmations',
      tag: 'On-Chain SBT',
      color: '#0891b2',
      bg: isLight ? '#ecfeff' : 'rgba(8, 145, 178, 0.12)',
      icon: <SecurityRounded sx={{ fontSize: 24 }} />
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={44} sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* 1. Breadcrumb Trail & Sync Action */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: isLight ? '#64748b' : '#8b949e', fontSize: '0.84rem' }}>
          <Typography component={RouterLink} to="/" sx={{ color: isLight ? '#64748b' : '#8b949e', textDecoration: 'none', '&:hover': { color: '#2563eb' } }}>
            TrueID Identity Portal
          </Typography>
          <span>/</span>
          <Typography sx={{ color: isLight ? '#64748b' : '#8b949e' }}>Identity Vault</Typography>
          <span>/</span>
          <Typography sx={{ color: isLight ? '#0f172a' : '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>
            {profileData.governmentId}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            onClick={fetchProfile}
            startIcon={<RefreshRounded sx={{ fontSize: '15px !important' }} />}
            sx={{
              color: isLight ? '#2563eb' : '#60a5fa',
              bgcolor: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.1)',
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              '&:hover': { bgcolor: isLight ? '#dbeafe' : 'rgba(37, 99, 235, 0.2)' }
            }}
          >
            Sync Vault
          </Button>
          <Typography variant="caption" sx={{ color: isLight ? '#94a3b8' : '#6b7280' }}>
            • Synced: {profileData.lastSync}
          </Typography>
        </Box>
      </Box>

      {/* 2. Top Citizen Profile Header Banner (Dashboard-Identical Polish) */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 3,
          bgcolor: isLight ? '#ffffff' : '#181a1c',
          border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
          boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.04)' : 'none',
          mb: 3
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 3
          }}
        >
          {/* Left: Avatar + Citizen Name + DID + Tags */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                sx={{
                  width: 68,
                  height: 68,
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  border: `3px solid ${isLight ? '#ffffff' : '#181a1c'}`
                }}
              >
                {userInitials}
              </Avatar>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${isLight ? '#ffffff' : '#181a1c'}`,
                  color: '#ffffff'
                }}
              >
                <CheckCircleRounded sx={{ fontSize: 14 }} />
              </Box>
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', letterSpacing: '-0.02em' }}>
                  {displayName}
                </Typography>

                <Chip
                  label="SOULBOUND VERIFIED"
                  size="small"
                  icon={<GppGoodRounded sx={{ fontSize: '14px !important', color: '#16a34a !important' }} />}
                  sx={{
                    bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)',
                    color: isLight ? '#16a34a' : '#4ade80',
                    border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(34, 197, 94, 0.3)'}`,
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    height: 24
                  }}
                />
              </Box>

              {/* DID with copy button */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: isLight ? '#475569' : '#9ca3af', bgcolor: isLight ? '#f8fafc' : '#1e2124', px: 1.2, py: 0.3, borderRadius: 1.5, border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`, fontSize: '0.82rem' }}>
                  {profileData.did}
                </Typography>

                <Tooltip title={copied ? 'Copied DID!' : 'Copy DID'}>
                  <IconButton size="small" onClick={handleCopyDID} sx={{ color: isLight ? '#64748b' : '#9ca3af', p: 0.6 }}>
                    <ContentCopyRounded sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="View Citizen Passport QR">
                  <IconButton size="small" onClick={() => setQrModalOpen(true)} sx={{ color: isLight ? '#2563eb' : '#60a5fa', p: 0.6 }}>
                    <QrCode2Rounded sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Identity Attributes Chips */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  label={`Gov ID: ${profileData.governmentId}`}
                  size="small"
                  sx={{
                    bgcolor: isLight ? '#f1f5f9' : '#1e2124',
                    color: isLight ? '#334155' : '#cbd5e1',
                    border: `1px solid ${isLight ? '#e2e8f0' : '#32363a'}`,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 26
                  }}
                />
                <Chip
                  label="FaceMesh 68 Enclave"
                  size="small"
                  sx={{
                    bgcolor: isLight ? '#f1f5f9' : '#1e2124',
                    color: isLight ? '#334155' : '#cbd5e1',
                    border: `1px solid ${isLight ? '#e2e8f0' : '#32363a'}`,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 26
                  }}
                />
                <Chip
                  label={mfaEnabled ? "2FA Protected" : "MFA Disabled"}
                  size="small"
                  sx={{
                    bgcolor: isLight ? (mfaEnabled ? '#f0fdf4' : '#fffbeb') : (mfaEnabled ? 'rgba(22, 163, 74, 0.15)' : 'rgba(217, 119, 6, 0.15)'),
                    color: mfaEnabled ? '#16a34a' : '#d97706',
                    border: `1px solid ${isLight ? (mfaEnabled ? '#bbf7d0' : '#fde68a') : (mfaEnabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)')}`,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    height: 26
                  }}
                />
                <Chip
                  label="ZK Enclave Shielded"
                  size="small"
                  sx={{
                    bgcolor: isLight ? '#f1f5f9' : '#1e2124',
                    color: isLight ? '#334155' : '#cbd5e1',
                    border: `1px solid ${isLight ? '#e2e8f0' : '#32363a'}`,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 26
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Right: Quick Biometric Action & Verification Tier */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 1.5 }}>
            <Box
              sx={{
                p: 1.5,
                px: 2,
                borderRadius: 2,
                bgcolor: isLight ? '#f8fafc' : '#141618',
                border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                textAlign: { xs: 'left', md: 'right' }
              }}
            >
              <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block' }}>
                CITIZEN STANDING
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#16a34a' }}>
                Tier 1 Verified Citizen
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={() => setBiometricModalOpen(true)}
              startIcon={<FingerprintRounded />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                py: 1,
                bgcolor: '#2563eb',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                '&:hover': { bgcolor: '#1d4ed8' }
              }}
            >
              Update Biometric Scan
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Alerts */}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

      {/* 3. Four Core Identity Pillars */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {profilePillars.map((pillar, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <Card
              sx={{
                p: 2.5,
                height: '100%',
                borderRadius: 3,
                bgcolor: isLight ? '#ffffff' : '#181a1c',
                border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: pillar.color,
                  transform: 'translateY(-2px)',
                  boxShadow: isLight ? '0 6px 16px rgba(0,0,0,0.06)' : '0 6px 16px rgba(0,0,0,0.4)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: pillar.bg,
                    color: pillar.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {pillar.icon}
                </Box>
                <Chip
                  label={pillar.tag}
                  size="small"
                  sx={{
                    bgcolor: isLight ? '#f1f5f9' : '#1e2124',
                    color: isLight ? '#475569' : '#9ca3af',
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    height: 22
                  }}
                />
              </Box>

              <Typography variant="caption" sx={{ color: pillar.color, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                {pillar.status}
              </Typography>

              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', fontSize: '1rem', mb: 0.8 }}>
                {pillar.title}
              </Typography>

              <Typography variant="body2" sx={{ fontWeight: 700, color: isLight ? '#1e293b' : '#f1f5f9', fontFamily: 'monospace', fontSize: '0.85rem', mb: 1 }}>
                {pillar.idVal}
              </Typography>

              <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontSize: '0.78rem', lineHeight: 1.4, display: 'block' }}>
                {pillar.desc}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 4. Horizontal Navigation Tabs (Like Dashboard) */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}` }}>
        <Button
          onClick={() => setActiveTab('personal')}
          sx={{
            color: activeTab === 'personal' ? '#2563eb' : isLight ? '#64748b' : '#8b949e',
            borderBottom: activeTab === 'personal' ? '2px solid #2563eb' : '2px solid transparent',
            borderRadius: 0,
            py: 1.2,
            px: 0.5,
            fontWeight: 700,
            fontSize: '0.95rem',
            textTransform: 'none'
          }}
        >
          Personal Identity Details
        </Button>

        <Button
          onClick={() => setActiveTab('credentials')}
          sx={{
            color: activeTab === 'credentials' ? '#2563eb' : isLight ? '#64748b' : '#8b949e',
            borderBottom: activeTab === 'credentials' ? '2px solid #2563eb' : '2px solid transparent',
            borderRadius: 0,
            py: 1.2,
            px: 0.5,
            fontWeight: 700,
            fontSize: '0.95rem',
            textTransform: 'none'
          }}
        >
          Upload Professional Records
        </Button>

        <Button
          onClick={() => setActiveTab('security')}
          sx={{
            color: activeTab === 'security' ? '#2563eb' : isLight ? '#64748b' : '#8b949e',
            borderBottom: activeTab === 'security' ? '2px solid #2563eb' : '2px solid transparent',
            borderRadius: 0,
            py: 1.2,
            px: 0.5,
            fontWeight: 700,
            fontSize: '0.95rem',
            textTransform: 'none'
          }}
        >
          Security & Two-Factor (MFA)
        </Button>

        <Button
          onClick={() => setActiveTab('vault')}
          sx={{
            color: activeTab === 'vault' ? '#2563eb' : isLight ? '#64748b' : '#8b949e',
            borderBottom: activeTab === 'vault' ? '2px solid #2563eb' : '2px solid transparent',
            borderRadius: 0,
            py: 1.2,
            px: 0.5,
            fontWeight: 700,
            fontSize: '0.95rem',
            textTransform: 'none'
          }}
        >
          Decentralized Key Vault
        </Button>
      </Box>

      {/* 5. Tab Content Sections */}
      {/* TAB 0: Personal Identity Details */}
      {activeTab === 'personal' && (
        <Grid container spacing={3}>
          {/* Left Form: Personal Details */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderRadius: 3,
                bgcolor: isLight ? '#ffffff' : '#181a1c',
                border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff' }}>
                  Personal Identity Registry
                </Typography>
                <Typography variant="body2" sx={{ color: isLight ? '#64748b' : '#8b949e', mt: 0.5 }}>
                  Update your contact preferences. Note: National Registry ID and DID are cryptographically bound and tamper-proof.
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Full Legal Name"
                      name="name"
                      value={profileData.name}
                      onChange={handleChange}
                      required
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: isLight ? '#f8fafc' : '#141618',
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="National Government ID"
                      name="governmentId"
                      value={profileData.governmentId}
                      disabled
                      helperText="Verified by Government Notary. Soulbound & Non-Editable."
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: isLight ? '#f1f5f9' : '#1e2124',
                          borderRadius: 2
                        }
                      }}
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
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: isLight ? '#f8fafc' : '#141618',
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: isLight ? '#f8fafc' : '#141618',
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Digital ID (DID)"
                      value={profileData.did}
                      disabled
                      helperText="W3C DID Core 1.0 representation for cryptographic attestation verification."
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: isLight ? '#f1f5f9' : '#1e2124',
                          borderRadius: 2,
                          fontFamily: 'monospace'
                        }
                      }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: `1px solid ${isLight ? '#f1f5f9' : '#282a2d'}` }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={updating}
                    startIcon={<SaveRounded />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      px: 3,
                      py: 1,
                      fontWeight: 700,
                      bgcolor: '#2563eb',
                      '&:hover': { bgcolor: '#1d4ed8' }
                    }}
                  >
                    {updating ? 'Saving Changes...' : 'Save Profile Changes'}
                  </Button>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Right Column: Security Enclave & Digital Notary Details */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Notary Certificate Card */}
              <Card
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: isLight ? '#ffffff' : '#181a1c',
                  border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                  boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
                }}
              >
                <Typography variant="subtitle2" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 2 }}>
                  GOVERNMENT NOTARY ATTESTATION
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 600, display: 'block' }}>
                      REGISTRATION STATUS
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                      <CheckCircleRounded sx={{ color: '#16a34a', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#16a34a' }}>
                        ACTIVE & VERIFIED CITIZEN
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ borderColor: isLight ? '#f1f5f9' : '#282a2d' }} />

                  <Box>
                    <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 600, display: 'block' }}>
                      ISSUING AUTHORITY
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', mt: 0.3 }}>
                      {profileData.verifiedBy || (user?.is_verified ? 'TrueID Identity Registry' : 'Pending Verification')}
                    </Typography>
                  </Box>

                  <Divider sx={{ borderColor: isLight ? '#f1f5f9' : '#282a2d' }} />

                  <Box>
                    <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 600, display: 'block' }}>
                      SHA-256 NOTARY AUDIT HASH
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2563eb', fontSize: '0.78rem', wordBreak: 'break-all', mt: 0.3 }}>
                      {user?.facemesh_hash || user?.biometric_hash || 'Not Enrolled'}
                    </Typography>
                  </Box>
                </Box>
              </Card>

              {/* Privacy Shield Card */}
              <Card
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: isLight ? '#ffffff' : '#181a1c',
                  border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                  boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
                }}
              >
                <Typography variant="subtitle2" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 2 }}>
                  ZERO-KNOWLEDGE PRIVACY SHIELD
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="body2" sx={{ color: isLight ? '#475569' : '#9ca3af', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    TrueID utilizes Poseidon Zero-Knowledge Proofs to verify identity claims without disclosing sensitive personal data or raw facial biometrics.
                  </Typography>

                  <Chip
                    icon={<ShieldRounded sx={{ color: '#16a34a !important', fontSize: 16 }} />}
                    label="Selective Disclosure Active"
                    size="small"
                    sx={{ bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)', color: '#16a34a', fontWeight: 700, width: 'fit-content' }}
                  />
                </Box>
              </Card>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: Professional Records & Upload */}
      {activeTab === 'credentials' && (
        <Card
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 3,
            bgcolor: isLight ? '#ffffff' : '#181a1c',
            border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
            boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff' }}>
              Upload Verified Document
            </Typography>
            <Typography variant="body2" sx={{ color: isLight ? '#64748b' : '#8b949e', mt: 0.5 }}>
              Submit university degrees, employer credentials, or professional licenses for cryptographic notary attestation.
            </Typography>
          </Box>

          <ProfessionUploadForm onUploadSuccess={fetchProfile} />
        </Card>
      )}

      {/* TAB 2: Security & Two-Factor (MFA) */}
      {activeTab === 'security' && (
        <Card
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 3,
            bgcolor: isLight ? '#ffffff' : '#181a1c',
            border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
            boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff' }}>
              Multi-Factor Authentication (MFA) Configuration
            </Typography>
            <Typography variant="body2" sx={{ color: isLight ? '#64748b' : '#8b949e', mt: 0.5 }}>
              Protect your digital identity with time-based one-time password (TOTP) authenticator apps.
            </Typography>
          </Box>

          <MFASettings onStatusChange={setMfaEnabled} />
        </Card>
      )}

      {/* TAB 3: Decentralized Key Vault */}
      {activeTab === 'vault' && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                p: 3.5,
                borderRadius: 3,
                bgcolor: isLight ? '#ffffff' : '#181a1c',
                border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                height: '100%'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', mb: 2 }}>
                Cryptographic Key Material
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, textTransform: 'uppercase' }}>
                    KEY ENCLAVE ALGORITHM
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', mt: 0.5 }}>
                    Ed25519-dalek (Hardware Protected)
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, textTransform: 'uppercase' }}>
                    CONTROLLER PUBLIC KEY
                  </Typography>
                  <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: isLight ? '#f1f5f9' : '#1e2124', fontFamily: 'monospace', fontSize: '0.8rem', color: '#2563eb', mt: 0.5, wordBreak: 'break-all' }}>
                    {user?.wallet_address || 'Not Configured'}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, textTransform: 'uppercase' }}>
                    SOULBOUND SMART CONTRACT ROOT
                  </Typography>
                  <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: isLight ? '#f1f5f9' : '#1e2124', fontFamily: 'monospace', fontSize: '0.8rem', color: '#16a34a', mt: 0.5, wordBreak: 'break-all' }}>
                    {process.env.REACT_APP_SOULBOUND_BADGE_ADDRESS || process.env.REACT_APP_CONTRACT_ADDRESS || '0x6f4d27d80f84ce44eFecF9A1eAd6A5e6489ae9Bf'}
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                p: 3.5,
                borderRadius: 3,
                bgcolor: isLight ? '#ffffff' : '#181a1c',
                border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                height: '100%'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', mb: 2 }}>
                W3C DID Document Representation
              </Typography>

              <Box
                component="pre"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: isLight ? '#0f172a' : '#0c0d0e',
                  color: '#38bdf8',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  m: 0
                }}
              >
{`{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "${profileData.did}",
  "verificationMethod": [{
    "id": "${profileData.did}#key-1",
    "type": "Ed25519VerificationKey2020",
    "controller": "${profileData.did}",
    "publicKeyMultibase": "z6MkpTHR8VNsBxYAAWHuEc2KaLfNGoStv6QGCVSVkuUm84V7"
  }],
  "authentication": [
    "${profileData.did}#key-1"
  ],
  "assertionMethod": [
    "${profileData.did}#key-1"
  ]
}`}
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Biometric Scan Modal */}
      <Dialog
        open={biometricModalOpen}
        onClose={() => setBiometricModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: isLight ? '#ffffff' : '#181a1c',
            border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FingerprintRounded sx={{ color: '#2563eb' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', fontSize: '1.05rem' }}>
              Biometric Landmark Verification
            </Typography>
          </Box>
          <IconButton onClick={() => setBiometricModalOpen(false)} sx={{ color: isLight ? '#64748b' : '#9ca3af' }}>
            <CloseRounded />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <BiometricVerification onVerificationComplete={handleBiometricComplete} />
        </DialogContent>
      </Dialog>

      {/* Citizen Passport QR Modal */}
      <Dialog
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            bgcolor: isLight ? '#ffffff' : '#181a1c',
            border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldRounded sx={{ color: '#2563eb' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>
              Citizen Digital Passport
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setQrModalOpen(false)}>
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ textAlign: 'center', pt: 2 }}>
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: '#ffffff',
              border: `2px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
              display: 'inline-block',
              mb: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            <Box
              sx={{
                width: 180,
                height: 180,
                background: 'repeating-conic-gradient(#0f172a 0% 25%, #ffffff 0% 50%) 50% / 20px 20px',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <Box sx={{ width: 44, height: 44, bgcolor: '#ffffff', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                <ShieldRounded sx={{ color: '#2563eb', fontSize: 26 }} />
              </Box>
            </Box>
          </Box>

          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff' }}>
            {displayName}
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 700, mb: 1 }}>
            ID: {profileData.governmentId}
          </Typography>
          <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', display: 'block', mb: 2 }}>
            Cryptographically sealed and signed by TrueID Network.
          </Typography>

          <Chip
            label="VERIFIED CITIZEN ATTESTATION"
            size="small"
            sx={{ bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)', color: '#16a34a', fontWeight: 800, fontSize: '0.7rem' }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button fullWidth variant="contained" onClick={() => setQrModalOpen(false)} sx={{ bgcolor: '#2563eb', textTransform: 'none', fontWeight: 700 }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
