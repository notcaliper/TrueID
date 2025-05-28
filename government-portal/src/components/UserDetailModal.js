import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';
import BlockchainService from '../services/BlockchainService';
import { FaUserCheck, FaUserTimes, FaUserClock, FaFingerprint, FaHistory, 
         FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaTimes, 
         FaEdit, FaLink } from 'react-icons/fa';

const UserDetailModal = ({ user, onClose, onUserUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(user);
  const [newFacemeshHash, setNewFacemeshHash] = useState('');
  const [versionHistory, setVersionHistory] = useState([]);
  const [isEdit, setIsEdit] = useState(user.isEdit || false);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [blockchainError, setBlockchainError] = useState(null);
  const [blockchainSuccess, setBlockchainSuccess] = useState(null);

  useEffect(() => {
    fetchUserDetails();
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching details for user ID:', user.id);
      
      // Fetch detailed user data from API
      const response = await ApiService.getUserById(user.id);
      console.log('API response:', response);
      
      // The API returns an object with user, biometricData, professionalRecords, and recentActivity
      // Extract the user data from the response
      if (response && response.user) {
        setUserData(response.user);
        console.log('User data set:', response.user);
        
        // Set version history from the professional records in the response
        if (response.professionalRecords && Array.isArray(response.professionalRecords)) {
          setVersionHistory(response.professionalRecords);
          console.log('Version history set:', response.professionalRecords);
        }
      } else {
        console.error('Invalid API response format:', response);
        setError('Invalid user data received from the server');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details. Please try again.');
      setLoading(false);
    }
  };

  const handleVerifyUser = async () => {
    // Validate user data before proceeding
    if (!userData || !userData.id) {
      console.error('Verification error: Missing user ID', { userData });
      setError('Cannot verify user: Missing user ID. Please try refreshing the page.');
      return;
    }
    
    setLoading(true);
    setBlockchainError(null);
    setBlockchainSuccess(null);
    
    try {
      console.log('Verifying user with ID:', userData.id);
      
      // Skip blockchain verification if no wallet address (for development/testing)
      let blockchainSuccess = true;
      let txHash = null;
      
      // If wallet address exists, attempt blockchain verification
      if (userData.wallet_address) {
        setBlockchainLoading(true);
        try {
          // Initialize blockchain service if needed
          if (!BlockchainService.initialized) {
            await BlockchainService.initialize();
          }
          
          const blockchainResult = await BlockchainService.verifyIdentity(userData.wallet_address);
          
          if (blockchainResult.success) {
            setBlockchainSuccess('Identity verified on blockchain successfully.');
            txHash = blockchainResult.txHash;
          } else {
            setBlockchainError('Blockchain verification failed: ' + (blockchainResult.error || 'Unknown error'));
            blockchainSuccess = false;
          }
        } catch (blockchainErr) {
          console.error('Blockchain verification error:', blockchainErr);
          setBlockchainError('Blockchain error: ' + blockchainErr.message);
          // Continue with API verification even if blockchain fails
        } finally {
          setBlockchainLoading(false);
        }
      } else {
        console.warn('No wallet address provided, skipping blockchain verification');
      }
      
      // Proceed with API verification regardless of blockchain result
      // This allows verification to work even in development environments
      try {
        console.log('Calling API to verify user:', userData.id);
        const apiResult = await ApiService.verifyIdentity(userData.id);
        console.log('API verification result:', apiResult);
        
        // Create updated user object with new verification status
        const updatedUser = {
          ...userData,
          verification_status: 'VERIFIED',
          updated_at: new Date().toISOString()
        };
        
        if (txHash) {
          updatedUser.txHash = txHash;
        }
        
        // Update UI and notify parent component
        setUserData(updatedUser);
        if (onUserUpdated) {
          console.log('Notifying parent of user update:', updatedUser);
          onUserUpdated(updatedUser);
        }
      } catch (apiErr) {
        console.error('API verification error:', apiErr);
        setError('API error: ' + apiErr.message);
        throw apiErr; // Re-throw to be caught by outer catch
      }
    } catch (err) {
      console.error('Error in verification process:', err);
      setError('Failed to verify user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectUser = async () => {
    // Validate user data before proceeding
    if (!userData || !userData.id) {
      console.error('Rejection error: Missing user ID', { userData });
      setError('Cannot reject user: Missing user ID. Please try refreshing the page.');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Rejecting user with ID:', userData.id);
      
      // Update in the database
      try {
        const apiResult = await ApiService.rejectIdentity(userData.id, 'Rejected by admin');
        console.log('API rejection result:', apiResult);
        
        // Create updated user object with new verification status
        const updatedUser = {
          ...userData,
          verification_status: 'REJECTED',
          updated_at: new Date().toISOString()
        };
        
        // Update UI and notify parent component
        setUserData(updatedUser);
        if (onUserUpdated) {
          console.log('Notifying parent of user update:', updatedUser);
          onUserUpdated(updatedUser);
        }
      } catch (apiErr) {
        console.error('API rejection error:', apiErr);
        setError('API error: ' + apiErr.message);
        throw apiErr; // Re-throw to be caught by outer catch
      }
    } catch (err) {
      console.error('Error rejecting user:', err);
      setError('Failed to reject user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFacemesh = async () => {
    if (!newFacemeshHash.trim()) {
      setError('Facemesh hash cannot be empty');
      return;
    }
    
    // Validate user data before proceeding
    if (!userData || !userData.id) {
      console.error('Update facemesh error: Missing user ID', { userData });
      setError('Cannot update biometric data: Missing user ID. Please try refreshing the page.');
      return;
    }
    
    setLoading(true);
    setBlockchainLoading(true);
    setBlockchainError(null);
    setBlockchainSuccess(null);
    
    try {
      console.log('Updating biometric hash for user ID:', userData.id);
      
      let txHash = null;
      
      // If wallet address exists, attempt blockchain update
      if (userData.wallet_address) {
        try {
          // Initialize blockchain service if needed
          if (!BlockchainService.initialized) {
            await BlockchainService.initialize();
          }
          
          const blockchainResult = await BlockchainService.updateBiometricHash(
            userData.wallet_address, 
            newFacemeshHash
          );
          
          if (blockchainResult.success) {
            setBlockchainSuccess('Biometric hash updated on blockchain successfully.');
            txHash = blockchainResult.txHash;
          } else {
            setBlockchainError('Blockchain update failed: ' + (blockchainResult.error || 'Unknown error'));
          }
        } catch (blockchainErr) {
          console.error('Blockchain update error:', blockchainErr);
          setBlockchainError('Blockchain error: ' + blockchainErr.message);
          // Continue with API update even if blockchain fails
        }
      } else {
        console.warn('No wallet address provided, skipping blockchain update');
      }
      
      // Update in the database
      try {
        console.log('Calling API to update biometric data:', userData.id);
        const apiResult = await ApiService.updateBiometricData(userData.id, newFacemeshHash);
        console.log('API update result:', apiResult);
        
        // Create updated user object
        const updatedUser = {
          ...userData,
          verification_status: 'PENDING', // Reset to pending after update
          updated_at: new Date().toISOString()
        };
        
        if (txHash) {
          updatedUser.blockchain_tx_hash = txHash;
        }
        
        // Add to version history
        const newVersion = {
          id: versionHistory.length + 1,
          facemesh_hash: newFacemeshHash,
          updated_by: 'Current Admin',
          created_at: new Date().toISOString(),
          blockchain_tx_hash: txHash,
        };
        
        setVersionHistory([newVersion, ...versionHistory]);
        setUserData(updatedUser);
        setNewFacemeshHash('');
        setIsEdit(false);
        
        if (onUserUpdated) {
          console.log('Notifying parent of user update:', updatedUser);
          onUserUpdated(updatedUser);
        }
      } catch (apiErr) {
        console.error('API update error:', apiErr);
        setError('API error: ' + apiErr.message);
        throw apiErr; // Re-throw to be caught by outer catch
      }
    } catch (err) {
      console.error('Error updating facemesh:', err);
      setError('Failed to update facemesh hash. Please try again.');
    } finally {
      setLoading(false);
      setBlockchainLoading(false);
    }
  };

  // Helper function to format dates safely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return 'N/A';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'N/A';
    }
  };

  // Truncate hash for display
  const truncateHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? (
              <>
                <FaEdit className="modal-title-icon" /> 
                Update User Details
              </>
            ) : (
              <>
                <FaFingerprint className="modal-title-icon" /> 
                User Identity Details
              </>
            )}
          </h2>
          <button onClick={onClose} className="modal-close-button" aria-label="Close">
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
            </div>
          ) : error ? (
            <div className="error-message">
              <i className="icon-alert-triangle"></i>
              {error}
            </div>
          ) : (
            <>
              {/* User Information */}
              <div className="user-info-grid">
                <div className="user-info-section">
                  <div className="user-info-header">
                    <h3 className="section-title">Basic Information</h3>
                    <div className="user-status-badge">
                      {userData.verification_status === 'VERIFIED' && (
                        <span className="status-badge verified">
                          <FaUserCheck className="status-icon" />
                          Verified Identity
                        </span>
                      )}
                      {userData.verification_status === 'REJECTED' && (
                        <span className="status-badge rejected">
                          <FaUserTimes className="status-icon" />
                          Rejected Identity
                        </span>
                      )}
                      {(userData.verification_status === 'PENDING' || !userData.verification_status) && (
                        <span className="status-badge pending">
                          <FaUserClock className="status-icon" />
                          Pending Verification
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Full Name</div>
                      <div className="info-value">{userData.name}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Unique ID</div>
                      <div className="info-value highlight">{userData.government_id || 'N/A'}</div>
                    </div>
                    <div className="info-item full-width">
                      <div className="info-label">Wallet Address</div>
                      <div className="info-value hash-value">
                        <code>{userData.wallet_address || 'N/A'}</code>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Registration Date</div>
                      <div className="info-value">{formatDate(userData.created_at)}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Last Updated</div>
                      <div className="info-value">{formatDate(userData.updated_at)}</div>
                    </div>
                  </div>
                </div>

                <div className="user-info-section">
                  <div className="biometric-section">
                    <h3 className="section-title">
                      <FaFingerprint className="section-icon" />
                      Biometric Data
                    </h3>
                    <div className="biometric-data-container">
                      <div className="info-item full-width">
                        <div className="info-label">Facemesh Hash</div>
                        <div className="info-value hash-value">
                          <code>
                            {userData.biometricData && userData.biometricData[0] ? 
                              userData.biometricData[0].facemesh_hash || 'No hash available' : 
                              'No biometric data available'}
                          </code>
                          <div className="hash-note">SHA-256 hash of the user's facial biometric data</div>
                        </div>
                      </div>
                      
                      {userData.biometricData && userData.biometricData[0] && userData.biometricData[0].blockchain_tx_hash && (
                        <div className="info-item full-width">
                          <div className="info-label">
                            <FaLink className="info-icon" />
                            Blockchain Transaction
                          </div>
                          <div className="info-value hash-value">
                            <code>{userData.biometricData[0].blockchain_tx_hash}</code>
                            <div className="hash-note">Transaction hash on the blockchain network</div>
                          </div>
                        </div>
                      )}
                      
                      {blockchainSuccess && (
                        <div className="blockchain-status success">
                          <FaCheckCircle className="blockchain-icon" />
                          <span>{blockchainSuccess}</span>
                        </div>
                      )}
                      
                      {blockchainError && (
                        <div className="blockchain-status error">
                          <FaTimesCircle className="blockchain-icon" />
                          <span>{blockchainError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="user-info-section">
                  <h3 className="section-title">Verification Status</h3>
                  <div className="info-list">
                    <div className="info-item">
                      <p className="info-label">Verification Status</p>
                      <div className="info-value">
                        {userData.status === 'verified' && (
                          <span className="status-badge verified">
                            <i className="icon-check"></i>
                            Verified
                          </span>
                        )}
                        {userData.status === 'rejected' && (
                          <span className="status-badge rejected">
                            <i className="icon-x"></i>
                            Rejected
                          </span>
                        )}
                        {userData.status === 'pending' && (
                          <span className="status-badge pending">
                            <i className="icon-clock"></i>
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="info-item">
                      <p className="info-label">Last Updated</p>
                      <p className="info-value">{formatDate(userData.lastUpdated)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blockchain Status Messages */}
              {blockchainLoading && (
                <div className="blockchain-status loading">
                  <div className="loading-spinner small"></div>
                  <span>Processing blockchain transaction...</span>
                </div>
              )}
              
              {blockchainError && (
                <div className="blockchain-status error">
                  <i className="icon-alert-triangle"></i>
                  <span>{blockchainError}</span>
                </div>
              )}
              
              {blockchainSuccess && (
                <div className="blockchain-status success">
                  <i className="icon-check-circle"></i>
                  <span>{blockchainSuccess}</span>
                </div>
              )}

              {/* Update Facemesh Section */}
              {isEdit && (
                <div className="edit-section">
                  <h3 className="section-title">Update Facemesh Data</h3>
                  <div className="form-group">
                    <label htmlFor="newFacemeshHash">New Facemesh Hash</label>
                    <input
                      type="text"
                      id="newFacemeshHash"
                      value={newFacemeshHash}
                      onChange={(e) => setNewFacemeshHash(e.target.value)}
                      placeholder="Enter new facemesh hash..."
                      className="form-input hash-input"
                    />
                    <p className="form-help">
                      Enter the new facemesh hash generated from the biometric system
                    </p>
                  </div>
                  <div className="form-actions">
                    <button
                      onClick={() => setIsEdit(false)}
                      className="button secondary"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateFacemesh}
                      className="button primary"
                      disabled={loading || !newFacemeshHash.trim()}
                    >
                      {loading ? 'Updating...' : 'Update Facemesh'}
                    </button>
                  </div>
                </div>
              )}

              {/* Version History */}
              <div className="history-section">
                <h3 className="section-title">
                  <FaHistory className="section-icon" />
                  Version History
                </h3>
                
                {versionHistory.length === 0 ? (
                  <div className="no-history-message">
                    No version history available for this user
                  </div>
                ) : (
                  <div className="version-history-list">
                    {versionHistory.map((version, index) => (
                      <div key={index} className="version-item">
                        <div className="version-header">
                          <span className="version-number">Version {versionHistory.length - index}</span>
                          <span className="version-date">{formatDate(version.created_at || version.timestamp)}</span>
                        </div>
                        <div className="version-details">
                          <div className="version-detail-item">
                            <span className="detail-label">Biometric Hash:</span>
                            <code className="detail-value">{truncateHash(version.facemesh_hash || version.biometricHash || 'N/A')}</code>
                          </div>
                          <div className="version-detail-item">
                            <span className="detail-label">Updated By:</span>
                            <span className="detail-value">{version.updated_by || version.updatedBy || 'System'}</span>
                          </div>
                          {(version.blockchain_tx_hash || version.txHash) && (
                            <div className="version-detail-item">
                              <span className="detail-label">Blockchain TX:</span>
                              <a 
                                href={`https://etherscan.io/tx/${version.blockchain_tx_hash || version.txHash}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="blockchain-link"
                              >
                                <FaLink className="link-icon" />
                                {truncateHash(version.blockchain_tx_hash || version.txHash)}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!isEdit && (
          <div className="modal-footer">
            <div>
              <button
                onClick={() => setIsEdit(true)}
                className="button secondary"
                disabled={loading}
              >
                Edit Facemesh
              </button>
            </div>
            <div className="action-buttons">
              <button
                onClick={handleRejectUser}
                className="button danger"
                disabled={loading || userData.verification_status === 'REJECTED'}
              >
                {loading ? 'Processing...' : 'Reject Identity'}
              </button>
              <button
                onClick={handleVerifyUser}
                className="button success"
                disabled={loading || userData.verification_status === 'VERIFIED'}
              >
                {loading ? 'Processing...' : 'Verify Identity'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetailModal;
