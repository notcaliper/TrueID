import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import ApiService from '../services/ApiService';

const Settings = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifyVerification: true,
    notifyRejection: true,
    notifyUpdate: true,
    notifyNewUser: false
  });

  useEffect(() => {
    if (currentUser) {
      setFormData(prevState => ({
        ...prevState,
        name: currentUser.name || '',
        email: currentUser.email || ''
      }));
    }
    
    fetchAdminProfile();
  }, [currentUser]);

  const fetchAdminProfile = async () => {
    try {
      const profile = await ApiService.getAdminProfile();
      setFormData(prevState => ({
        ...prevState,
        ...profile,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      console.error('Error fetching admin profile:', err);
      setError('Failed to load profile data. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    // Validate passwords if trying to change
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError('Current password is required to set a new password');
        setLoading(false);
        return;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        setLoading(false);
        return;
      }
      
      if (formData.newPassword.length < 8) {
        setError('Password must be at least 8 characters long');
        setLoading(false);
        return;
      }
    }
    
    try {
      // Update profile information
      const profileData = {
        name: formData.name,
        email: formData.email,
        notifyVerification: formData.notifyVerification,
        notifyRejection: formData.notifyRejection,
        notifyUpdate: formData.notifyUpdate,
        notifyNewUser: formData.notifyNewUser
      };
      
      await ApiService.updateAdminProfile(profileData);
      
      // Change password if provided
      if (formData.newPassword) {
        await ApiService.changePassword(formData.currentPassword, formData.newPassword);
      }
      
      setSuccess(true);
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <h1 className="page-title">Settings</h1>
      
      {error && (
        <div className="error-message">
          <i className="icon-alert-triangle"></i>
          {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <i className="icon-check-circle"></i>
          Settings updated successfully!
        </div>
      )}
      
      <div className="settings-card">
        <div className="card-header">
          <h2 className="card-title">Account Settings</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-grid">
            {/* Profile Section */}
            <div className="form-section">
              <div className="section-header">
                <i className="icon-user"></i>
                <h3>Profile Information</h3>
              </div>
              
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              
              <div className="section-header">
                <i className="icon-bell"></i>
                <h3>Notification Preferences</h3>
              </div>
              
              <div className="checkbox-group">
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="notifyVerification"
                    name="notifyVerification"
                    checked={formData.notifyVerification}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  <label htmlFor="notifyVerification">
                    Notify when a user is verified
                  </label>
                </div>
                
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="notifyRejection"
                    name="notifyRejection"
                    checked={formData.notifyRejection}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  <label htmlFor="notifyRejection">
                    Notify when a user is rejected
                  </label>
                </div>
                
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="notifyUpdate"
                    name="notifyUpdate"
                    checked={formData.notifyUpdate}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  <label htmlFor="notifyUpdate">
                    Notify when facemesh data is updated
                  </label>
                </div>
                
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="notifyNewUser"
                    name="notifyNewUser"
                    checked={formData.notifyNewUser}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  <label htmlFor="notifyNewUser">
                    Notify when a new user is registered
                  </label>
                </div>
              </div>
            </div>
            
            {/* Security Section */}
            <div className="form-section">
              <div className="section-header">
                <i className="icon-shield"></i>
                <h3>Security</h3>
              </div>
              
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              
              <div className="password-requirements">
                <p>Password must be at least 8 characters long and include:</p>
                <ul>
                  <li>At least one uppercase letter</li>
                  <li>At least one lowercase letter</li>
                  <li>At least one number</li>
                  <li>At least one special character</li>
                </ul>
              </div>
              
              <div className="security-tips">
                <p className="tips-header">Account Security Tips:</p>
                <ul>
                  <li>Change your password regularly</li>
                  <li>Don't share your login credentials</li>
                  <li>Always log out when using shared computers</li>
                  <li>Report suspicious activities to the system administrator</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="save-button"
            >
              {loading ? (
                <>
                  <div className="button-spinner"></div>
                  Saving...
                </>
              ) : (
                <>
                  <i className="icon-save"></i>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
