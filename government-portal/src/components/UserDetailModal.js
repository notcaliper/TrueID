import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';
import BlockchainService from '../services/BlockchainService';
import { FaUserCheck, FaUserTimes, FaUserClock, FaFingerprint, FaHistory, 
         FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaTimes, 
         FaEdit, FaExchangeAlt, FaLink } from 'react-icons/fa';

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
  }, [user.id]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      // Fetch detailed user data from API
      const userDetails = await ApiService.getUserById(user.id);
      setUserData(userDetails);
      
      // Fetch version history
      const history = await ApiService.getProfessionalRecords(user.id);
      setVersionHistory(history);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details. Please try again.');
      setLoading(false);
    }
  };

  const handleVerifyUser = async () => {
    setLoading(true);
    setBlockchainLoading(true);
    setBlockchainError(null);
    setBlockchainSuccess(null);
    
    try {
      // First update on the blockchain
      const blockchainResult = await BlockchainService.verifyIdentity(userData.walletAddress);
      
      if (blockchainResult.success) {
        setBlockchainSuccess('Identity verified on blockchain successfully.');
        
        // Then update in the database
        const apiResult = await ApiService.verifyIdentity(userData.id);
        
        const updatedUser = {
          ...userData,
          status: 'verified',
          lastUpdated: new Date().toISOString(),
          txHash: blockchainResult.txHash
        };
        
        setUserData(updatedUser);
        if (onUserUpdated) onUserUpdated(updatedUser);
      } else {
        setBlockchainError('Blockchain verification failed: ' + blockchainResult.error);
      }
    } catch (err) {
      console.error('Error verifying user:', err);
      setError('Failed to verify user. Please try again.');
    } finally {
      setLoading(false);
      setBlockchainLoading(false);
    }
  };

  const handleRejectUser = async () => {
    setLoading(true);
    try {
      // Update in the database
      const apiResult = await ApiService.rejectIdentity(userData.id, 'Rejected by admin');
      
      const updatedUser = {
        ...userData,
        status: 'rejected',
        lastUpdated: new Date().toISOString()
      };
      
      setUserData(updatedUser);
      if (onUserUpdated) onUserUpdated(updatedUser);
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
    
    setLoading(true);
    setBlockchainLoading(true);
    setBlockchainError(null);
    setBlockchainSuccess(null);
    
    try {
      // First update on the blockchain
      const blockchainResult = await BlockchainService.updateBiometricHash(
        userData.walletAddress, 
        newFacemeshHash
      );
      
      if (blockchainResult.success) {
        setBlockchainSuccess('Biometric hash updated on blockchain successfully.');
        
        // Then update in the database
        const apiResult = await ApiService.updateBiometricData(userData.id, newFacemeshHash);
        
        const updatedUser = {
          ...userData,
          biometricHash: newFacemeshHash,
          status: 'pending', // Reset to pending after update
          lastUpdated: new Date().toISOString(),
          txHash: blockchainResult.txHash
        };
        
        // Add to version history
        const newVersion = {
          id: versionHistory.length + 1,
          biometricHash: newFacemeshHash,
          updatedBy: 'Current Admin',
          timestamp: new Date().toISOString(),
          txHash: blockchainResult.txHash,
        };
        
        setVersionHistory([newVersion, ...versionHistory]);
        setUserData(updatedUser);
        setNewFacemeshHash('');
        setIsEdit(false);
        if (onUserUpdated) onUserUpdated(updatedUser);
      } else {
        setBlockchainError('Blockchain update failed: ' + blockchainResult.error);
      }
    } catch (err) {
      console.error('Error updating facemesh:', err);
      setError('Failed to update facemesh hash. Please try again.');
    } finally {
      setLoading(false);
      setBlockchainLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Truncate hash for display
  const truncateHash = (hash) => {
    if (!hash) return '';
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <FaCheckCircle className="status-icon verified" />;
      case 'rejected':
        return <FaTimesCircle className="status-icon rejected" />;
      default:
        return <FaExclamationTriangle className="status-icon pending" />;
    }
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
                      {userData.status === 'verified' && (
                        <span className="status-badge verified">
                          <FaUserCheck className="status-icon" />
                          Verified Identity
                        </span>
                      )}
                      {userData.status === 'rejected' && (
                        <span className="status-badge rejected">
                          <FaUserTimes className="status-icon" />
                          Rejected Identity
                        </span>
                      )}
                      {userData.status === 'pending' && (
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
                      <div className="info-value highlight">{userData.uniqueId}</div>
                    </div>
                    <div className="info-item full-width">
                      <div className="info-label">Wallet Address</div>
                      <div className="info-value hash-value">
                        <code>{userData.walletAddress}</code>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Registration Date</div>
                      <div className="info-value">{formatDate(userData.createdAt)}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Last Updated</div>
                      <div className="info-value">{formatDate(userData.lastUpdated)}</div>
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
                          <code>{userData.biometricHash}</code>
                          <div className="hash-note">SHA-256 hash of the user's facial biometric data</div>
                        </div>
                      </div>
                      
                      {userData.txHash && (
                        <div className="info-item full-width">
                          <div className="info-label">
                            <FaLink className="info-icon" />
                            Blockchain Transaction
                          </div>
                          <div className="info-value hash-value">
                            <code>{userData.txHash}</code>
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
                <div className="version-history-container">
                  {versionHistory.length === 0 ? (
                    <div className="no-history">
                      <p>No version history available for this user</p>
                    </div>
                  ) : (
                    <div className="history-timeline">
                      {versionHistory.slice(0, 5).map((version, index) => (
                        <div key={version.id} className="history-item">
                          <div className="history-marker">
                            <div className="history-marker-dot"></div>
                            <div className="history-marker-line"></div>
                          </div>
                          <div className="history-content">
                            <div className="history-header">
                              <span className="history-version">Version {versionHistory.length - index}</span>
                              <span className="history-date">{formatDate(version.timestamp)}</span>
                            </div>
                            <div className="history-details">
                              <div className="history-detail">
                                <span className="detail-label">Facemesh Hash:</span>
                                <code className="detail-value">{truncateHash(version.biometricHash)}</code>
                              </div>
                              <div className="history-detail">
                                <span className="detail-label">Updated By:</span>
                                <span className="detail-value">{version.updatedBy || 'System'}</span>
                              </div>
                              {version.txHash && (
                                <div className="history-detail">
                                  <span className="detail-label">Transaction:</span>
                                  <code className="detail-value">{truncateHash(version.txHash)}</code>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {versionHistory.length > 5 && (
                        <div className="history-more">
                          <button className="history-more-button">
                            View {versionHistory.length - 5} more entries...
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                disabled={loading || userData.status === 'rejected'}
              >
                {loading ? 'Processing...' : 'Reject Identity'}
              </button>
              <button
                onClick={handleVerifyUser}
                className="button success"
                disabled={loading || userData.status === 'verified'}
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
