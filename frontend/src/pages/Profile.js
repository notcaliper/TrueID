import React, { useState, useEffect } from 'react';
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
  Divider
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api.service';
import ProfessionUploadForm from '../components/ProfessionUploadForm';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    governmentId: ''
  });
  const [facemeshCapturing, setFacemeshCapturing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await userAPI.getProfile();
        const { name, email, phone, government_id } = response.data;
        
        setProfileData({
          name,
          email,
          phone,
          governmentId: government_id
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
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

  // Simulate facemesh capture
  const updateFacemesh = async () => {
    setFacemeshCapturing(true);
    setError(null);
    setSuccess(null);
    
    try {
      // In a real app, this would use a camera and ML model to capture facial biometrics
      // For demo purposes, we'll simulate this with a timeout and mock data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock facemesh data (in a real app, this would be actual biometric data)
      const mockFacemeshData = {
        landmarks: Array.from({ length: 68 }, () => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
          z: Math.random() * 50
        })),
        timestamp: Date.now()
      };
      
      // Send updated facemesh to backend
      await userAPI.updateFacemesh(mockFacemeshData);
      
      setSuccess('Biometric data updated successfully');
    } catch (err) {
      console.error('Error updating facemesh:', err);
      setError('Failed to update biometric data. Please try again.');
    } finally {
      setFacemeshCapturing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Your Profile
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
              alt={profileData.name}
              src="/static/images/avatar/1.jpg"
            />
            <Typography variant="h6">{profileData.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Government ID: {profileData.governmentId}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Button
              variant="outlined"
              color="primary"
              onClick={updateFacemesh}
              disabled={facemeshCapturing}
              fullWidth
              sx={{ mt: 1 }}
            >
              {facemeshCapturing ? (
                <CircularProgress size={24} />
              ) : (
                'Update Biometric Data'
              )}
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Government ID"
                    name="governmentId"
                    value={profileData.governmentId}
                    disabled
                    helperText="Government ID cannot be changed"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={updating}
                    sx={{ mt: 1 }}
                  >
                    {updating ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      {/* profession upload section */}
      <ProfessionUploadForm />
    </Box>
  );
};

export default Profile;
