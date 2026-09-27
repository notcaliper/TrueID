import React from 'react';
import { Box, Typography, Avatar, Card, Chip, Button } from '@mui/material';
import {
  VerifiedUser as VerifiedUserIcon,
  Security as BlockchainIcon,
  Fingerprint as BiometricIcon,
  AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';

const nexusStyles = `
  @keyframes scanline {
    0% { transform: translateY(-100%); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(100%); opacity: 0; }
  }

  @keyframes pulse-ring {
    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.6); }
    70% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; box-shadow: 0 0 0 20px rgba(99, 102, 241, 0); }
    100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
  }

  @keyframes dash-flow {
    to {
      stroke-dashoffset: -100;
    }
  }

  @keyframes rotate-slow {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }

  @keyframes rotate-fast {
    from { transform: translate(-50%, -50%) rotate(360deg); }
    to { transform: translate(-50%, -50%) rotate(0deg); }
  }

  @keyframes text-glow {
    0%, 100% { text-shadow: 0 0 10px rgba(99,102,241,0.5); }
    50% { text-shadow: 0 0 20px rgba(99,102,241,0.9), 0 0 30px rgba(99,102,241,0.7); }
  }

  .nexus-node {
    position: absolute;
    transform: translate(-50%, -50%);
    background: rgba(15, 23, 42, 0.88) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 16px !important;
    width: 180px;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 10;
    backdrop-filter: blur(14px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .nexus-node:hover {
    transform: translate(-50%, -50%) scale(1.06);
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(255,255,255,0.05);
    border-color: rgba(99, 102, 241, 0.35) !important;
    z-index: 30;
  }

  .nexus-node:hover .nexus-icon-circle {
    transform: scale(1.08);
    box-shadow: 0 0 20px currentColor;
  }

  .nexus-icon-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    position: relative;
    transition: all 0.3s ease;
  }

  .nexus-icon-circle::before {
    content: '';
    position: absolute;
    top: -5px; left: -5px; right: -5px; bottom: -5px;
    border-radius: 50%;
    border: 1px solid currentColor;
    opacity: 0.5;
    animation: rotate-slow 10s linear infinite;
  }

  .nexus-icon-circle::after {
    content: '';
    position: absolute;
    top: -10px; left: -10px; right: -10px; bottom: -10px;
    border-radius: 50%;
    border: 1px dashed currentColor;
    opacity: 0.3;
    animation: rotate-fast 15s linear infinite;
  }

  .nexus-line {
    stroke-dasharray: 10, 15;
    animation: dash-flow 2s linear infinite;
    stroke-linecap: round;
  }

  .nexus-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 150px;
    height: 150px;
    border-radius: 50%;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nexus-center-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 2px solid #6366f1;
    box-shadow: 0 0 30px rgba(99, 102, 241, 0.5), inset 0 0 20px rgba(99, 102, 241, 0.3);
    z-index: 2;
    background: #0f172a;
    transition: all 0.3s ease;
  }
  
  .nexus-center:hover .nexus-center-avatar {
    box-shadow: 0 0 50px rgba(99, 102, 241, 0.8), inset 0 0 30px rgba(99, 102, 241, 0.5);
    transform: scale(1.05);
  }

  .nexus-scanner-overlay {
    position: absolute;
    top: 15px; left: 15px; right: 15px; bottom: 15px;
    border-radius: 50%;
    overflow: hidden;
    z-index: 3;
    pointer-events: none;
    background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(0,0,0,0) 70%);
  }

  .nexus-scan-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 3px;
    background: #10b981;
    box-shadow: 0 0 15px #10b981, 0 0 5px #fff;
    animation: scanline 2.5s ease-in-out infinite;
  }

  .nexus-corner {
    position: absolute;
    width: 25px;
    height: 25px;
    border: 2px solid #6366f1;
    z-index: 4;
    transition: all 0.3s ease;
  }
  
  .nexus-center:hover .nexus-corner {
    width: 35px; height: 35px;
    border-color: #818cf8;
  }
  
  .corner-tl { top: 0px; left: 0px; border-right: none; border-bottom: none; }
  .corner-tr { top: 0px; right: 0px; border-left: none; border-bottom: none; }
  .corner-bl { bottom: 0px; left: 0px; border-right: none; border-top: none; }
  .corner-br { bottom: 0px; right: 0px; border-left: none; border-top: none; }

  .nexus-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    border-radius: 50%;
    border: 2px dashed rgba(99, 102, 241, 0.35);
    z-index: 1;
    pointer-events: none;
  }
  
  .nexus-pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: transparent;
    z-index: 0;
    animation: pulse-ring 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
  }
`;

const NodeStatus = ({ title, status, icon: Icon, color, top, left, statusColor }) => {
  return (
    <Card className="nexus-node" style={{ top, left }}>
      <Box className="nexus-icon-circle" sx={{ color: color, bgcolor: `${color}10` }}>
        <Icon sx={{ fontSize: 28 }} />
      </Box>
      <Typography variant="caption" fontWeight={800} color="#f8fafc" sx={{ mb: 1, letterSpacing: 1 }}>
        {title}
      </Typography>
      <Typography variant="caption" fontWeight={700} sx={{ color: statusColor || color }}>
        {status}
      </Typography>
    </Card>
  );
};

const BiometricNexus = ({ dashboardData, user }) => {
  const getKycColor = (status) => {
    if (status === 'VERIFIED') return '#10b981'; // Emerald
    if (status === 'PENDING') return '#fbbf24'; // Amber
    return '#ef4444'; // Red
  };

  const getLedgerColor = (status) => {
    return status ? '#34d399' : '#64748b'; // Emerald or Slate
  };

  const getFacemeshColor = (status) => {
    return status ? '#a855f7' : '#64748b'; // Purple or Slate
  };

  return (
    <Box sx={{ width: '100%', mb: 5 }}>
      <style>{nexusStyles}</style>
      

      <Box sx={{ 
        position: 'relative', 
        height: 500, 
        width: '100%', 
        bgcolor: 'rgba(17, 24, 39, 0.75)', 
        backdropFilter: 'blur(16px)',
        borderRadius: '20px', 
        overflow: 'hidden', 
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        
        {/* Background Grid */}
        <Box sx={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          zIndex: 0
        }} />

        {/* Connecting Lines SVG */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}>
          <defs>
            <linearGradient id="grad-tl" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="grad-tr" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="grad-bl" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="grad-br" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            
            {/* Glow filters */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Lines */}
          <line x1="25%" y1="30%" x2="50%" y2="50%" stroke="url(#grad-tl)" strokeWidth="2" className="nexus-line" filter="url(#glow)" />
          <line x1="75%" y1="30%" x2="50%" y2="50%" stroke="url(#grad-tr)" strokeWidth="2" className="nexus-line" filter="url(#glow)" />
          <line x1="25%" y1="70%" x2="50%" y2="50%" stroke="url(#grad-bl)" strokeWidth="2" className="nexus-line" filter="url(#glow)" />
          <line x1="75%" y1="70%" x2="50%" y2="50%" stroke="url(#grad-br)" strokeWidth="2" className="nexus-line" filter="url(#glow)" />
        </svg>

        {/* Orbit Rings */}
        <Box className="nexus-ring" sx={{ width: 250, height: 250, animation: 'rotate-slow 25s linear infinite' }} />
        <Box className="nexus-ring" sx={{ width: 350, height: 350, borderStyle: 'solid', opacity: 0.15, animation: 'rotate-fast 40s linear infinite' }} />
        <Box className="nexus-ring" sx={{ width: 450, height: 450, opacity: 0.2, animation: 'rotate-slow 60s linear infinite' }} />
        
        {/* Decorative background circle */}
        <Box sx={{
          position: 'absolute',
          top: '20%',
          left: '30%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          border: '1px dashed rgba(139, 92, 246, 0.3)',
          zIndex: 1,
          pointerEvents: 'none'
        }}>
          <Box sx={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: 240,
            height: 240,
            borderRadius: '50%',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }} />
        </Box>

        {/* Center Profile */}
        <Box className="nexus-center">
          <Box className="nexus-pulse" />
          <Avatar 
            src={user?.profileImage} 
            className="nexus-center-avatar"
          >
            {user?.firstName?.[0] || 'U'}
          </Avatar>
          
          <Box className="nexus-scanner-overlay">
            <Box className="nexus-scan-line" />
          </Box>
          
          {/* Corner targets */}
          <Box className="nexus-corner corner-tl" />
          <Box className="nexus-corner corner-tr" />
          <Box className="nexus-corner corner-bl" />
          <Box className="nexus-corner corner-br" />
        </Box>

        {/* Nodes */}
        <NodeStatus 
          top="30%" left="25%" 
          title="NETWORK KYC" 
          status={dashboardData.verificationStatus} 
          icon={VerifiedUserIcon}
          color="#fbbf24"
          statusColor={getKycColor(dashboardData.verificationStatus)}
        />
        
        <NodeStatus 
          top="30%" left="75%" 
          title="LEDGER STATE" 
          status={dashboardData.blockchainStatus ? "SYNCED" : "NOT SYNCED"} 
          icon={BlockchainIcon}
          color={dashboardData.blockchainStatus ? "#34d399" : "#64748b"}
        />

        <NodeStatus 
          top="70%" left="25%" 
          title="FACEMESH" 
          status={dashboardData.biometricStatus?.facemeshExists ? "ACTIVE" : "INACTIVE"} 
          icon={BiometricIcon}
          color={dashboardData.biometricStatus?.facemeshExists ? "#a855f7" : "#475569"}
          statusColor={getFacemeshColor(dashboardData.biometricStatus?.facemeshExists)}
        />

        <NodeStatus 
          top="70%" left="75%" 
          title="AVAX LEDGER" 
          status={`${parseFloat(dashboardData.walletBalance || '0').toFixed(2)} AVAX`} 
          icon={WalletIcon}
          color="#3b82f6"
        />
      </Box>
    </Box>
  );
};

export default BiometricNexus;
