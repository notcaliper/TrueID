import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import ApiService from '../services/ApiService';
import { FaUser, FaBell, FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaSave } from 'react-icons/fa';

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
    <div className="settings-page" style={{
      padding: '24px',
      backgroundColor: '#1a1a1a',
      minHeight: '100vh',
      color: '#e0e0e0',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <h1 style={{
        fontSize: '28px',
        fontWeight: '600',
        margin: '0 0 24px 0',
        color: '#fff',
        letterSpacing: '-0.5px'
      }}>Settings</h1>
      
      {error && (
        <div style={{
          backgroundColor: '#2c1519',
          color: '#f87171',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          border: '1px solid #451a1a'
        }}>
          <FaExclamationTriangle />
          {error}
        </div>
      )}
      
      {success && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#34d399',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <FaCheckCircle />
          Settings updated successfully!
        </div>
      )}
      
      <div style={{
        backgroundColor: '#2d2d2d',
        borderRadius: '12px',
        border: '1px solid #404040',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #404040'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: '0',
            color: '#fff'
          }}>Account Settings</h2>
        </div>
        
        <form onSubmit={handleSubmit} style={{
          padding: '24px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            {/* Profile Section */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <FaUser style={{ color: '#6366f1', fontSize: '20px' }} />
                <h3 style={{
                  margin: '0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#fff'
                }}>Profile Information</h3>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div>
                  <label htmlFor="name" style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#a3a3a3',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #404040',
                      borderRadius: '8px',
                      color: '#e0e0e0',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#a3a3a3',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #404040',
                      borderRadius: '8px',
                      color: '#e0e0e0',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
              
              <div style={{
                marginTop: '32px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  <FaBell style={{ color: '#6366f1', fontSize: '20px' }} />
                  <h3 style={{
                    margin: '0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#fff'
                  }}>Notification Preferences</h3>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      id="notifyVerification"
                      name="notifyVerification"
                      checked={formData.notifyVerification}
                      onChange={handleChange}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#6366f1'
                      }}
                    />
                    <span style={{ color: '#e0e0e0', fontSize: '14px' }}>
                      Notify when a user is verified
                    </span>
                  </label>
                  
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      id="notifyRejection"
                      name="notifyRejection"
                      checked={formData.notifyRejection}
                      onChange={handleChange}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#6366f1'
                      }}
                    />
                    <span style={{ color: '#e0e0e0', fontSize: '14px' }}>
                      Notify when a user is rejected
                    </span>
                  </label>
                  
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      id="notifyUpdate"
                      name="notifyUpdate"
                      checked={formData.notifyUpdate}
                      onChange={handleChange}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#6366f1'
                      }}
                    />
                    <span style={{ color: '#e0e0e0', fontSize: '14px' }}>
                      Notify when facemesh data is updated
                    </span>
                  </label>
                  
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      id="notifyNewUser"
                      name="notifyNewUser"
                      checked={formData.notifyNewUser}
                      onChange={handleChange}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#6366f1'
                      }}
                    />
                    <span style={{ color: '#e0e0e0', fontSize: '14px' }}>
                      Notify when a new user is registered
                    </span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Security Section */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <FaShieldAlt style={{ color: '#6366f1', fontSize: '20px' }} />
                <h3 style={{
                  margin: '0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#fff'
                }}>Security</h3>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div>
                  <label htmlFor="currentPassword" style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#a3a3a3',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #404040',
                      borderRadius: '8px',
                      color: '#e0e0e0',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#a3a3a3',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #404040',
                      borderRadius: '8px',
                      color: '#e0e0e0',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#a3a3a3',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #404040',
                      borderRadius: '8px',
                      color: '#e0e0e0',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
              
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#262626',
                borderRadius: '8px',
                border: '1px solid #404040'
              }}>
                <p style={{
                  margin: '0 0 12px 0',
                  color: '#a3a3a3',
                  fontSize: '14px'
                }}>Password must be at least 8 characters long and include:</p>
                <ul style={{
                  margin: '0',
                  paddingLeft: '20px',
                  color: '#a3a3a3',
                  fontSize: '14px'
                }}>
                  <li>At least one uppercase letter</li>
                  <li>At least one lowercase letter</li>
                  <li>At least one number</li>
                  <li>At least one special character</li>
                </ul>
              </div>
              
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#262626',
                borderRadius: '8px',
                border: '1px solid #404040'
              }}>
                <p style={{
                  margin: '0 0 12px 0',
                  color: '#a3a3a3',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>Account Security Tips:</p>
                <ul style={{
                  margin: '0',
                  paddingLeft: '20px',
                  color: '#a3a3a3',
                  fontSize: '14px'
                }}>
                  <li>Change your password regularly</li>
                  <li>Don't share your login credentials</li>
                  <li>Always log out when using shared computers</li>
                  <li>Report suspicious activities to the system administrator</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div style={{
            marginTop: '32px',
            padding: '24px',
            borderTop: '1px solid #404040',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? '0.7' : '1'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaSave />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Settings;
