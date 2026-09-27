import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  Warning,
  Download,
  ContentCopy,
  Close,
  CheckCircle,
  Print,
  SaveAlt
} from '@mui/icons-material';

/**
 * Recovery Codes Component
 * Displays recovery codes for MFA backup access
 */
const RecoveryCodes = ({ codes, open, onClose, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!codes || codes.length === 0) return null;

  // Copy all codes to clipboard
  const copyAllCodes = () => {
    const codesText = codes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download codes as text file
  const downloadCodes = () => {
    const content = `TrueID - Recovery Codes
Generated: ${new Date().toLocaleString()}

These codes can be used to access your account if you lose access to your authenticator app.
Each code can only be used once.

STORE THESE CODES IN A SAFE PLACE!

${codes.join('\n')}

---
Keep these codes secure. Do not share them with anyone.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trueid-recovery-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  // Print codes
  const printCodes = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>TrueID Recovery Codes</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; background: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { color: #8b5cf6; margin-bottom: 8px; }
            .subtitle { color: #6b7280; margin-bottom: 24px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; color: #92400e; }
            .codes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 24px 0; }
            .code { font-family: monospace; font-size: 18px; font-weight: 600; padding: 12px 16px; background: #f3f4f6; border-radius: 6px; text-align: center; letter-spacing: 2px; }
            .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px; }
            .date { color: #6b7280; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔐 TrueID Recovery Codes</h1>
            <p class="subtitle">Two-Factor Authentication Backup Codes</p>
            <p class="date">Generated: ${new Date().toLocaleString()}</p>
            
            <div class="warning">
              <strong>Important:</strong> Store these codes in a safe place. 
              Each code can only be used once. If you run out of codes, you can regenerate them from your account settings.
            </div>
            
            <div class="codes-grid">
              ${codes.map(code => `<div class="code">${code}</div>`).join('')}
            </div>
            
            <div class="footer">
              Keep these codes secure. Do not share them with anyone.<br>
              TrueID - Decentralized Biometric Identity System
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: '#111928',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning sx={{ color: '#f59e0b' }} />
        Save Your Recovery Codes
        <IconButton
          onClick={onClose}
          sx={{ ml: 'auto', color: '#94a3b8' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Alert 
          severity="warning"
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            background: 'rgba(245, 158, 11, 0.1)',
            color: '#fcd34d',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            These codes will only be shown once!
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Download, print, or copy them now. Each code can only be used once.
          </Typography>
        </Alert>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Grid container spacing={2}>
            {codes.map((code, index) => (
              <Grid item xs={6} key={index}>
                <Box
                  sx={{
                    p: 1.5,
                    background: 'rgba(139,92,246,0.1)',
                    borderRadius: 1,
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#a78bfa',
                    letterSpacing: 2,
                    border: '1px solid rgba(139,92,246,0.2)',
                  }}
                >
                  {code}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<ContentCopy />}
            onClick={copyAllCodes}
            sx={{
              flex: 1,
              borderColor: 'rgba(255,255,255,0.2)',
              color: copied ? '#10b981' : '#fff',
              '&:hover': { borderColor: '#8b5cf6', background: 'rgba(139,92,246,0.1)' },
            }}
          >
            {copied ? 'Copied!' : 'Copy All'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={downloadCodes}
            sx={{
              flex: 1,
              borderColor: 'rgba(255,255,255,0.2)',
              color: downloaded ? '#10b981' : '#fff',
              '&:hover': { borderColor: '#8b5cf6', background: 'rgba(139,92,246,0.1)' },
            }}
          >
            {downloaded ? 'Downloaded!' : 'Download'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={printCodes}
            sx={{
              flex: 1,
              borderColor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              '&:hover': { borderColor: '#8b5cf6', background: 'rgba(139,92,246,0.1)' },
            }}
          >
            Print
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => setShowConfirm(true)}
          startIcon={<CheckCircle />}
          sx={{
            py: 1.5,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
            fontWeight: 600,
            '&:hover': { background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)' },
          }}
        >
          I&apos;ve Saved My Codes
        </Button>
      </DialogActions>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        PaperProps={{
          sx: {
            background: '#111928',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Confirm You Saved the Codes
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you&apos;ve saved your recovery codes in a secure location? 
            You won&apos;t be able to see them again.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setShowConfirm(false)}
            sx={{ color: '#94a3b8' }}
          >
            Go Back
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowConfirm(false);
              onClose();
            }}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)' },
            }}
          >
            Yes, I&apos;m Done
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default RecoveryCodes;
