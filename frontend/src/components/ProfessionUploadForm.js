import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
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

  // Fetch current verification status on mount
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

  const getAlertSeverity = () => {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'error';
    if (status === 'pending') return 'warning';
    return 'info';
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Profession Verification
      </Typography>

      {status && (
        <Alert severity={getAlertSeverity()} sx={{ mb: 2 }}>
          Current status: {status.charAt(0).toUpperCase() + status.slice(1)}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {previewUrl && (
        <Box sx={{ mb: 2 }}>
          <img
            src={previewUrl}
            alt="Preview"
            style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button variant="outlined" component="label">
          {selectedFile ? 'Change Image' : 'Choose Image'}
          <input hidden type="file" accept="image/*" onChange={handleFileChange} />
        </Button>
        {selectedFile && (
          <>
            <Button color="error" variant="text" onClick={handleRemove}>
              Remove
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Submit'}
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ProfessionUploadForm;
