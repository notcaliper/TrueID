import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  Fade,
  Grow,
  InputAdornment,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Fingerprint as FingerprintIcon,
  Save as SaveIcon,
  Security as SecurityIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userAPI, authAPI } from '../services/api.service';
import ProfessionUploadForm from '../components/ProfessionUploadForm';
import MFASettings from '../components/MFASettings';
import BiometricVerification from '../components/BiometricVerification';

// CSS for futuristic styling, holographic glare, spotlight, scan lines, and terminal logs
const cssStyles = `
  @keyframes holoShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes holoGlare {
    0% { transform: translateX(-150%) skewX(-45deg); opacity: 0; }
    50% { opacity: 0.35; }
    100% { transform: translateX(150%) skewX(-45deg); opacity: 0; }
  }

  .holo-profile-card {
    position: relative;
    background: linear-gradient(135deg, rgba(17, 24, 39, 0.85) 0%, rgba(30, 27, 75, 0.35) 40%, rgba(10, 14, 23, 0.95) 100%) !important;
    background-size: 200% 200%;
    animation: holoShift 10s ease infinite;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(99, 102, 241, 0.05) !important;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
  }

  .holo-profile-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
    width: 200%;
    transform: translateX(-150%) skewX(-45deg);
    animation: holoGlare 8s linear infinite;
    pointer-events: none;
    z-index: 5;
  }

  .holo-profile-card:hover {
    transform: translateY(-3px);
    border-color: rgba(99, 102, 241, 0.35) !important;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6), inset 0 0 30px rgba(99, 102, 241, 0.1) !important;
  }

  /* Spotlight mouse tracking */
  .holo-profile-card::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99, 102, 241, 0.1) 0%, transparent 60%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 1;
  }

  .holo-profile-card:hover::after {
    opacity: 1;
  }

  /* Status pulse animations */
  @keyframes statusPulse {
    0%, 100% { opacity: 0.4; transform: scale(0.9); }
    50% { opacity: 1; transform: scale(1.15); }
  }

  .status-pulse-dot-green {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #10b981;
    display: inline-block;
    animation: statusPulse 2s infinite ease-in-out;
    box-shadow: 0 0 8px #10b981;
  }

  .status-pulse-dot-red {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #ef4444;
    display: inline-block;
    animation: statusPulse 2s infinite ease-in-out;
    box-shadow: 0 0 8px #ef4444;
  }

  /* Monospace cyber terminal styles */
  .terminal-log-box {
    background: rgba(5, 8, 16, 0.9);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 8px;
    padding: 12px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.72rem;
    color: #10b981;
    width: 100%;
    height: 110px;
    overflow-y: auto;
    text-align: left;
    box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.95);
    margin-top: 16px;
    scrollbar-width: thin;
    scrollbar-color: rgba(16, 185, 129, 0.3) rgba(0,0,0,0.5);
  }

  .terminal-log-box::-webkit-scrollbar {
    width: 4px;
  }

  .terminal-log-box::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.5);
  }

  .terminal-log-box::-webkit-scrollbar-thumb {
    background: rgba(16, 185, 129, 0.3);
    border-radius: 2px;
  }

  .terminal-log-line {
    margin-bottom: 4px;
    line-height: 1.35;
    animation: terminalLineIn 0.25s ease forwards;
  }

  @keyframes terminalLineIn {
    from { opacity: 0; transform: translateY(3px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// Dynamic HTML5 Canvas Biometric Face Mesh Scanner overlay
const FaceMeshCanvas = ({ active, name }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed internal coordinates
    canvas.width = 140;
    canvas.height = 140;

    if (!active) {
      ctx.clearRect(0, 0, 140, 140);
      return;
    }

    const centerX = 70;
    const centerY = 70;
    const points = [];

    // Face boundary (oval)
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const rx = 42;
      const ry = 52;
      points.push({
        x: centerX + Math.cos(angle) * rx,
        y: centerY + Math.sin(angle) * ry,
        origX: centerX + Math.cos(angle) * rx,
        origY: centerY + Math.sin(angle) * ry,
      });
    }

    // Nose bridge and tip
    for (let i = 0; i < 4; i++) {
      points.push({
        x: centerX,
        y: centerY - 22 + i * 11,
        origX: centerX,
        origY: centerY - 22 + i * 11,
      });
    }

    // Eyes
    points.push({ x: centerX - 16, y: centerY - 14, origX: centerX - 16, origY: centerY - 14 });
    points.push({ x: centerX - 10, y: centerY - 14, origX: centerX - 10, origY: centerY - 14 });
    points.push({ x: centerX + 16, y: centerY - 14, origX: centerX + 16, origY: centerY - 14 });
    points.push({ x: centerX + 10, y: centerY - 14, origX: centerX + 10, origY: centerY - 14 });

    // Mouth Arc
    for (let i = 0; i < 5; i++) {
      const angle = Math.PI * (0.22 + (i / 4) * 0.56);
      points.push({
        x: centerX + Math.cos(angle) * 18,
        y: centerY + 16 + Math.sin(angle) * 8,
        origX: centerX + Math.cos(angle) * 18,
        origY: centerY + 16 + Math.sin(angle) * 8,
      });
    }

    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, 140, 140);

      // Jitter nodes to simulate dynamic landmark calculation
      points.forEach(p => {
        p.x = p.origX + Math.sin(frame * 0.12 + p.origY) * 1.2;
        p.y = p.origY + Math.cos(frame * 0.12 + p.origX) * 1.2;
      });

      // Draw mesh connection lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      // Outer border
      for (let i = 0; i < 16; i++) {
        const next = (i + 1) % 16;
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[next].x, points[next].y);
      }
      // Nose
      ctx.moveTo(points[16].x, points[16].y);
      for (let i = 17; i < 20; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      // Mouth
      for (let i = 24; i < 28; i++) {
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i+1].x, points[i+1].y);
      }
      // cross lines for structural wireframe visualization
      for (let i = 0; i < 16; i += 2) {
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(centerX, centerY);
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[20].x, points[20].y); // connect to eyes/nose area
      }
      ctx.stroke();

      // Draw node points
      points.forEach((p, idx) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, idx % 4 === 0 ? 2.2 : 1.2, 0, Math.PI * 2);
        ctx.fillStyle = idx % 4 === 0 ? '#10b981' : '#34d399';
        ctx.fill();

        // Print telemetry coordinates for a few nodes
        if (idx === 4 && frame % 12 < 6) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
          ctx.font = '7px monospace';
          ctx.fillText(`P:${p.x.toFixed(0)},${p.y.toFixed(0)}`, p.x + 5, p.y - 2);
        }
      });

      // Draw neon sweeping laser line
      const laserPos = 12 + (Math.sin(frame * 0.04) * 0.5 + 0.5) * 116;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(12, laserPos);
      ctx.lineTo(128, laserPos);
      ctx.stroke();
      ctx.shadowBlur = 0; // turn off shadow blur for other items

      // Draw radar target rings
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
      ctx.stroke();

      // Draw corner crop target lines
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      const size = 10;
      // top-left
      ctx.beginPath(); ctx.moveTo(6, 6 + size); ctx.lineTo(6, 6); ctx.lineTo(6 + size, 6); ctx.stroke();
      // top-right
      ctx.beginPath(); ctx.moveTo(134 - size, 6); ctx.lineTo(134, 6); ctx.lineTo(134, 6 + size); ctx.stroke();
      // bottom-left
      ctx.beginPath(); ctx.moveTo(6, 134 - size); ctx.lineTo(6, 134); ctx.lineTo(6 + size, 134); ctx.stroke();
      // bottom-right
      ctx.beginPath(); ctx.moveTo(134 - size, 134); ctx.lineTo(134, 134); ctx.lineTo(134, 134 - size); ctx.stroke();

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active]);

  return (
    <Box sx={{ position: 'relative', width: 140, height: 140 }}>
      <Avatar
        alt={name}
        src="/static/images/avatar/1.jpg"
        sx={{ 
          width: 140, 
          height: 140, 
          border: '4px solid #070b14',
          boxShadow: '0 0 25px rgba(59, 130, 246, 0.6)',
          filter: active ? 'brightness(0.25) contrast(1.4)' : 'none',
          transition: 'all 0.3s ease'
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 140,
          height: 140,
          pointerEvents: 'none',
          zIndex: 10
        }}
      />
    </Box>
  );
};

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    governmentId: ''
  });
  
  const cardRef = useRef(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userAPI.getProfile();
      // Handle mock or backend variations in response structure
      const userData = response.data.user || response.data;
      const { name, email, phone, government_id } = userData;
      
      setProfileData({
        name: name || '',
        email: email || '',
        phone: phone || '',
        governmentId: government_id || ''
      });

      if (userData && setUser) {
        setUser(prev => ({
          ...prev,
          ...userData,
          hasFacemesh: !!userData.facemesh_hash || !!userData.has_facemesh,
          isVerified: userData.verification_status === 'VERIFIED'
        }));
      }

      // Query status of MFA
      const mfaResp = await authAPI.getMFAStatus();
      setMfaEnabled(mfaResp.data?.enabled || false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMfaStatusChange = (isEnabled) => {
    setMfaEnabled(isEnabled);
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
      
      // Update user in auth context
      setUser({
        ...user,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone
      });
      
      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone
        }));
      }
      
      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const [biometricModalOpen, setBiometricModalOpen] = useState(false);

  const handleOpenBiometricModal = () => {
    setBiometricModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseBiometricModal = () => {
    setBiometricModalOpen(false);
  };

  const handleBiometricComplete = async (result) => {
    setSuccess('Biometric data successfully synchronized with decentralized registry');
    await fetchProfile();
    setTimeout(() => {
      setBiometricModalOpen(false);
    }, 1500);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <>
      <Fade in={true} timeout={800}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 4 }}>
        <style>{cssStyles}</style>

        {/* Hero Banner */}
        <Box
          sx={{
            height: 200,
            borderRadius: '24px 24px 0 0',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
            position: 'relative',
            mb: 8,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderBottom: 'none',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'#ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              opacity: 0.8,
              zIndex: 1
            }
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(to top, rgba(7, 11, 20, 1) 0%, transparent 100%)',
              zIndex: 2
            }}
          />
        </Box>

        <Grid container spacing={4} sx={{ px: { xs: 2, md: 4 }, mt: -14, position: 'relative', zIndex: 3 }}>
          {/* Left Column: Futuristic ID Card */}
          <Grid item xs={12} md={4}>
            <Grow in={true} timeout={1000}>
              <Paper 
                ref={cardRef}
                onMouseMove={handleMouseMove}
                className="holo-profile-card"
                sx={{ 
                  p: 4, 
                  textAlign: 'center', 
                  borderRadius: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                {/* Gold Smartcard Contact Pad Grid Graphic */}
                <Box sx={{
                  position: 'absolute',
                  top: 24,
                  right: 24,
                  width: 42,
                  height: 32,
                  borderRadius: 1,
                  background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                  border: '1.5px solid rgba(0, 0, 0, 0.4)',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  p: 0.6,
                  zIndex: 2,
                  opacity: 0.85,
                  '&::after': {
                    content: '""',
                    border: '1.5px solid rgba(0,0,0,0.3)',
                    borderLeft: 'none',
                    borderRight: 'none',
                    width: '100%',
                    height: '25%'
                  }
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', height: '100%' }}>
                    <Box sx={{ width: '25%', borderRight: '1px solid rgba(0,0,0,0.3)' }} />
                    <Box sx={{ width: '40%', borderRight: '1px solid rgba(0,0,0,0.3)' }} />
                    <Box sx={{ width: '25%' }} />
                  </Box>
                </Box>

                {/* Avatar Area with scanning overlay */}
                <Box sx={{ position: 'relative', mb: 3, mt: -8, zIndex: 6 }}>
                  <FaceMeshCanvas active={biometricModalOpen} name={profileData.name} />
                  
                  {/* Verified Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      background: '#10b981',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '3px solid #070b14',
                      boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
                      zIndex: 11
                    }}
                  >
                    <CheckCircleIcon sx={{ color: '#fff', fontSize: 18 }} />
                  </Box>
                </Box>

                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#f8fafc', zIndex: 6 }}>
                  {profileData.name || 'Unknown User'}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: 'text.secondary', zIndex: 6 }}>
                  <BadgeIcon fontSize="small" />
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', letterSpacing: 1 }}>
                    {profileData.governmentId || 'ID-XXXXXX'}
                  </Typography>
                </Box>

                <Divider sx={{ width: '100%', my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />

                <Box sx={{ width: '100%', textAlign: 'left', mb: 3, zIndex: 6 }}>
                  <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Security Shield Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
                    <Typography variant="body2" sx={{ color: '#cbd5e1' }}>Biometric Sync</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span className="status-pulse-dot-green" />
                      <Typography variant="body2" sx={{ color: '#34d399', fontWeight: 600 }}>
                        Active
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
                    <Typography variant="body2" sx={{ color: '#cbd5e1' }}>Two-Factor (MFA)</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span className={mfaEnabled ? "status-pulse-dot-green" : "status-pulse-dot-red"} />
                      <Typography variant="body2" sx={{ color: mfaEnabled ? '#34d399' : '#f87171', fontWeight: 600 }}>
                        {mfaEnabled ? 'Enabled' : 'Disabled'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleOpenBiometricModal}
                  fullWidth
                  startIcon={<FingerprintIcon />}
                  sx={{ 
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    zIndex: 6,
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(139, 92, 246, 1) 100%)',
                    }
                  }}
                >
                  Update Biometric Data
                </Button>
              </Paper>
            </Grow>
          </Grid>
          
          {/* Right Column: Tabbed Interface */}
          <Grid item xs={12} md={8}>
            <Grow in={true} timeout={1200}>
              <Box>
                {error && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2, background: 'rgba(239, 68, 68, 0.1)' }}>
                    {error}
                  </Alert>
                )}
                
                {success && (
                  <Alert severity="success" sx={{ mb: 3, borderRadius: 2, background: 'rgba(16, 185, 129, 0.1)' }}>
                    {success}
                  </Alert>
                )}

                {/* Tabs Indicator Navigation */}
                <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }}>
                  <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange} 
                    variant="fullWidth"
                    textColor="primary"
                    indicatorColor="primary"
                    sx={{
                      '& .MuiTab-root': {
                        color: '#94a3b8',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        py: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          color: '#fff',
                          background: 'rgba(255, 255, 255, 0.02)'
                        },
                        '&.Mui-selected': {
                          color: '#3b82f6',
                          textShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
                        }
                      }
                    }}
                  >
                    <Tab icon={<PersonIcon />} iconPosition="start" label="Personal Details" />
                    <Tab icon={<WorkIcon />} iconPosition="start" label="Credentials" />
                    <Tab icon={<SecurityIcon />} iconPosition="start" label="Security (MFA)" />
                  </Tabs>
                </Box>

                {/* Tab content 1: Personal Details */}
                {activeTab === 0 && (
                  <Paper sx={{ p: 4, borderRadius: 4, mb: 4, position: 'relative', overflow: 'hidden' }}>
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)' }} />
                    
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: '#f8fafc' }}>
                      <PersonIcon color="primary" /> Personal Information
                    </Typography>
                    
                    <Box component="form" onSubmit={handleSubmit}>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Full Name"
                            name="name"
                            value={profileData.name}
                            onChange={handleChange}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PersonIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Government ID"
                            name="governmentId"
                            value={profileData.governmentId}
                            disabled
                            helperText="Government ID is verified and cannot be changed directly."
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <BadgeIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Email Address"
                            name="email"
                            type="email"
                            value={profileData.email}
                            onChange={handleChange}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <EmailIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Phone Number"
                            name="phone"
                            value={profileData.phone}
                            onChange={handleChange}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PhoneIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={updating}
                            startIcon={updating ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            sx={{ 
                              px: 4, 
                              py: 1.5,
                              borderRadius: 2,
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#fff',
                              '&:hover': {
                                background: 'rgba(255,255,255,0.1)',
                              }
                            }}
                          >
                            {updating ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  </Paper>
                )}

                {/* Tab content 2: Professional Upload Credentials */}
                {activeTab === 1 && (
                  <Paper sx={{ p: 4, borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'linear-gradient(to bottom, #10b981, #0ea5e9)' }} />
                    <ProfessionUploadForm />
                  </Paper>
                )}

                {/* Tab content 3: Account Security (MFA) */}
                {activeTab === 2 && (
                  <Paper sx={{ p: 0, borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'linear-gradient(to bottom, #f59e0b, #ef4444)', zIndex: 5 }} />
                    <MFASettings onStatusChange={handleMfaStatusChange} />
                  </Paper>
                )}
              </Box>
            </Grow>
          </Grid>
        </Grid>
      </Box>
      </Fade>

      {/* Biometric Camera Capture Modal */}
      <Dialog
        open={biometricModalOpen}
        onClose={handleCloseBiometricModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #0b1120 0%, #050811 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(99, 102, 241, 0.15)',
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FingerprintIcon sx={{ color: '#6366f1', fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700} color="#fff">
              Decentralized Biometric FaceMesh Enrollment
            </Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={handleCloseBiometricModal}
            sx={{ color: '#94a3b8', '&:hover': { color: '#fff' } }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1, sm: 2 } }}>
          <BiometricVerification
            mode="update"
            userId={user?.id}
            autoStart={true}
            onComplete={handleBiometricComplete}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Profile;
