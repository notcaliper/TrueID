import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import { userAPI } from '../services/api.service';

/**
 * ProfessionUploadForm
 * --------------------
 * Allows a user to upload an image (certificate, license, etc.)
 * as proof of their profession. Shows current verification status
 * and provides preview / remove functionality before submission.
 */
const ProfessionUploadForm = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await userAPI.getProfessionVerificationStatus();
        setStatus(res.data?.status || '');
      } catch (e) {
        console.error('Failed to fetch profession status', e);
      }
    })();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      await userAPI.uploadProfessionImage(formData);
      setSuccess('Image uploaded successfully. Awaiting admin verification.');
      setStatus('pending');
      setSelectedFile(null);
      setPreviewUrl('');
    } catch (err) {
      console.error('Upload failed', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = () => {
    if (!status) return null;
    
    let color = 'default';
    let icon = null;
    let label = status.charAt(0).toUpperCase() + status.slice(1);
    
    if (status === 'approved') {
      color = 'success';
      icon = <CheckCircleIcon fontSize="small" />;
    } else if (status === 'rejected') {
      color = 'error';
      icon = <CancelIcon fontSize="small" />;
    } else if (status === 'pending') {
      color = 'warning';
      icon = <PendingIcon fontSize="small" />;
    }

    return (
      <Chip 
        icon={icon} 
        label={`Status: ${label}`} 
        color={color}
        variant="filled"
        sx={{ fontWeight: 600, px: 1 }}
      />
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f8fafc' }}>
          Profession Verification
        </Typography>
        {getStatusChip()}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2, background: 'rgba(239, 68, 68, 0.1)' }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2, background: 'rgba(16, 185, 129, 0.1)' }}>
          {success}
        </Alert>
      )}

      {previewUrl ? (
        <Box sx={{ mb: 3, position: 'relative', borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          <img
            src={previewUrl}
            alt="Preview"
            style={{ width: '100%', display: 'block', maxHeight: 300, objectFit: 'cover' }}
          />
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button color="error" variant="contained" size="small" onClick={handleRemove} sx={{ borderRadius: 2 }}>
              Remove
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleSubmit}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Submit for Review'}
            </Button>
          </Box>
        </Box>
      ) : (
        <Box 
          component="label"
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            p: 4,
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            borderRadius: 3,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'rgba(255, 255, 255, 0.02)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'primary.main'
            }
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" sx={{ color: '#cbd5e1', fontWeight: 500 }}>
            Click to upload professional document
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            Supports JPG, PNG, PDF (Max 5MB)
          </Typography>
          <input hidden type="file" accept="image/*" onChange={handleFileChange} />
        </Box>
      )}
    </Box>
  );
};

export default ProfessionUploadForm;
