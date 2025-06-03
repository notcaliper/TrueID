import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';
import BlockchainService from '../services/BlockchainService';
import { FaUserCheck, FaUserTimes, FaUserClock, FaFingerprint, FaHistory, FaCheckCircle, FaTimesCircle, FaTimes, FaEdit, FaLink } from 'react-icons/fa';
import './UserDetailModal.css';

const UserDetailModal = ({ user, onClose, onUserUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userData, setUserData] = useState(user);
  const [activeTab, setActiveTab] = useState('details');
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
    setError(null);
    try {
      const response = await ApiService.getUserById(user.id);
      if (response && response.user) {
        // Normalize biometric hash data to ensure consistency
        const userData = response.user;
        let biometricDataForHistory = null;
        
        // Check if biometric data is available and has facemesh_hash
        if (response.biometricData && response.biometricData.length > 0) {
          const latestBiometricData = response.biometricData[0]; // Get the most recent biometric data
          biometricDataForHistory = latestBiometricData;
          
          // Debug log to verify data structure
          console.log('Raw API biometric data:', response.biometricData);
          
          // Normalize facemesh hash from multiple possible sources
          if (latestBiometricData?.facemesh_hash) {
            userData.facemesh_hash = latestBiometricData.facemesh_hash;
          } else if (latestBiometricData?.biometricHash) {
            userData.facemesh_hash = latestBiometricData.biometricHash;
          } else if (latestBiometricData?.facemeshHash) {
            userData.facemesh_hash = latestBiometricData.facemeshHash;
          }
          
          // If there's a blockchain transaction hash, add it too
          if (latestBiometricData?.blockchain_tx_hash) {
            userData.blockchain_tx_hash = latestBiometricData.blockchain_tx_hash;
          }
          
          console.log('Processed user data with facemesh:', userData);
          
          // Add the facemesh hash to the user data object
          userData.biometricHash = userData.facemesh_hash;
          userData.facemeshHash = userData.facemesh_hash;
        }
        
        // If biometricHash exists but facemesh_hash doesn't, copy it over
        if (userData.biometricHash && !userData.facemesh_hash) {
          userData.facemesh_hash = userData.biometricHash;
        }
        // If facemeshHash exists but facemesh_hash doesn't, copy it over
        if (userData.facemeshHash && !userData.facemesh_hash) {
          userData.facemesh_hash = userData.facemeshHash;
        }
        
        setUserData(userData);
        
        // Handle version history
        if (response.professionalRecords && Array.isArray(response.professionalRecords) && response.professionalRecords.length > 0) {
          // Normalize biometric hash data in professional records
          const normalizedRecords = response.professionalRecords.map(record => {
            if (record.biometricHash && !record.facemesh_hash) {
              record.facemesh_hash = record.biometricHash;
            }
            if (record.facemeshHash && !record.facemesh_hash) {
              record.facemesh_hash = record.facemeshHash;
            }
            return record;
          });
          setVersionHistory(normalizedRecords);
        } else if (biometricDataForHistory && biometricDataForHistory.facemesh_hash) {
          // Create an initial version history entry from biometric data if no professional records exist
          const initialVersion = {
            id: 1,
            facemesh_hash: biometricDataForHistory.facemesh_hash,
            biometricHash: biometricDataForHistory.facemesh_hash,
            facemeshHash: biometricDataForHistory.facemesh_hash,
            updated_by: 'System',
            created_at: biometricDataForHistory.created_at,
            blockchain_tx_hash: biometricDataForHistory.blockchain_tx_hash || null,
            record_type: 'Initial Biometric Registration',
            description: 'Initial biometric data registration'
          };
          setVersionHistory([initialVersion]);
        }
      } else {
        setError('Invalid user data received from the server');
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async () => {
    if (!userData || !userData.id) {
      setError('Cannot verify user: Missing user ID. Please try refreshing the page.');
      return;
    }
    
    setLoading(true);
    setBlockchainError(null);
    setBlockchainSuccess(null);
    
    try {
      let txHash = null;
      
      try {
        if (!BlockchainService.initialized) {
          await BlockchainService.initialize();
        }
        
        const blockchainResult = await BlockchainService.verifyIdentity(userData.id);
        
        if (blockchainResult.success) {
          setBlockchainSuccess('Identity verified successfully.');
          txHash = blockchainResult.txHash;
        } else {
          setBlockchainError('Verification failed: ' + (blockchainResult.error || 'Unknown error'));
        }
      } catch (blockchainErr) {
        console.error('Blockchain verification error:', blockchainErr);
        setBlockchainError('Blockchain error: ' + blockchainErr.message);
      }
      
      const apiResult = await ApiService.verifyIdentity(userData.id);
      
      const updatedUser = {
        ...userData,
        verification_status: 'VERIFIED',
        updated_at: new Date().toISOString()
      };
        
        if (txHash) {
          updatedUser.txHash = txHash;
        }
        
        setUserData(updatedUser);
        
        if (onUserUpdated) {
          onUserUpdated(updatedUser);
        }
        
        setError(null);
        setSuccess('User verified successfully' + (txHash ? ' and recorded on blockchain.' : '.'));
    } catch (error) {
      setError('Failed to verify user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectUser = async () => {
    if (!userData || !userData.id) {
      setError('Cannot reject user: Missing user ID. Please try refreshing the page.');
      return;
    }
    
    setLoading(true);
    try {
      const apiResult = await ApiService.rejectIdentity(userData.id, 'Rejected by admin');
      
      const updatedUser = {
        ...userData,
        verification_status: 'REJECTED',
        updated_at: new Date().toISOString()
      };
        
        setUserData(updatedUser);
        
        if (onUserUpdated) {
          onUserUpdated(updatedUser);
        }
    } catch (err) {
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
    
    if (!userData || !userData.id) {
      setError('Cannot update biometric data: Missing user ID. Please try refreshing the page.');
      return;
    }
    
    setLoading(true);
    setBlockchainLoading(true);
    setBlockchainError(null);
    setBlockchainSuccess(null);
    
    try {
      let txHash = null;
      
      if (userData.wallet_address) {
        try {
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
        }
      } else {
        console.warn('No wallet address provided, skipping blockchain update');
      }
      
      // Update user data with new facemesh hash
      const apiResult = await ApiService.updateBiometricData(userData.id, newFacemeshHash);
      
      const updatedUser = {
        ...userData,
        facemesh_hash: newFacemeshHash,
        biometricHash: newFacemeshHash, // Add both property names for consistency
        facemeshHash: newFacemeshHash,  // Add both property names for consistency
        verification_status: 'PENDING',
        updated_at: new Date().toISOString()
      };
      
      if (txHash) {
        updatedUser.blockchain_tx_hash = txHash;
      }
      
      const newVersion = {
        id: versionHistory.length + 1,
        facemesh_hash: newFacemeshHash,
        biometricHash: newFacemeshHash,
        facemeshHash: newFacemeshHash,
        updated_by: 'Current Admin',
        created_at: new Date().toISOString(),
        blockchain_tx_hash: txHash,
      };
      
      setVersionHistory([newVersion, ...versionHistory]);
        setUserData(updatedUser);
        setNewFacemeshHash('');
        setIsEdit(false);
        
        if (onUserUpdated) {
          onUserUpdated(updatedUser);
        }
    } catch (err) {
      setError('Failed to update facemesh hash. Please try again.');
    } finally {
      setLoading(false);
      setBlockchainLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
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

  const truncateHash = (hash) => {
    if (!hash) return 'N/A';
    // Return the full hash instead of truncating it
    return hash;
  };

  return (
    <div className="user-detail-modal">
      <div className="modal-header">
        <h2>User Details</h2>
        <button onClick={onClose}><FaTimes /></button>
      </div>
      <div className="modal-content">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>{error}</div>
        ) : (
          <div>
            <div className="tab-navigation">
              <button onClick={() => setActiveTab('details')}>Details</button>
              <button onClick={() => setActiveTab('documents')}>Documents</button>
              <button onClick={() => setActiveTab('verification')}>Verification</button>
              <button onClick={() => setActiveTab('history')}>Version History</button>
            </div>
            <div className="tab-content">
              {activeTab === 'details' && (
                <div>
                  <div className="user-info-section">
                    <h3 className="section-title">User Information</h3>
                    <div className="info-list">
                      <div className="info-item">
                        <p className="info-label">User ID</p>
                        <p className="info-value">{userData.id}</p>
                      </div>
                      <div className="info-item">
                        <p className="info-label">Name</p>
                        <p className="info-value">{userData.name || 'N/A'}</p>
                      </div>
                      <div className="info-item">
                        <p className="info-label">Email</p>
                        <p className="info-value">{userData.email || 'N/A'}</p>
                      </div>
                      <div className="info-item">
                        <p className="info-label">Registration Date</p>
                        <p className="info-value">{formatDate(userData.created_at)}</p>
                      </div>
                      <div className="info-item">
                        <p className="info-label">Last Updated</p>
                        <p className="info-value">{formatDate(userData.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="user-info-section">
                    <h3 className="section-title">Biometric Information</h3>
                    <div className="info-list">
                      <div className="info-item">
                        <p className="info-label">Facemesh Hash</p>
                        <p className="info-value">{truncateHash(
                          userData.facemesh_hash ||
                          (userData.biometricData && userData.biometricData.length > 0 && userData.biometricData[0].facemesh_hash) ||
                          'N/A')}
                        </p>
                      </div>
                      {userData.blockchain_tx_hash && (
                        <div className="info-item">
                          <p className="info-label">Blockchain Transaction</p>
                          <p className="info-value">
                            <a 
                              href={`https://testnet.snowtrace.io/tx/${userData.blockchain_tx_hash}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              {truncateHash(userData.blockchain_tx_hash)}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'documents' && (
                <div>Documents Content</div>
              )}
              {activeTab === 'verification' && (
                <div>
                  <div className="verification-status-section">
                    <h3 className="section-title">Verification Status</h3>
                    <div className="info-list">
                      <div className="info-item">
                        <p className="info-label">Verification Status</p>
                        <p className="info-value">
                          {userData.verification_status === 'VERIFIED' && (
                            <span className="status-verified">Verified</span>
                          )}
                          {userData.verification_status === 'REJECTED' && (
                            <span className="status-rejected">Rejected</span>
                          )}
                          {userData.verification_status === 'PENDING' && (
                            <span className="status-pending">Pending</span>
                          )}
                        </p>
                      </div>
                      <div className="info-item">
                        <p className="info-label">Last Updated</p>
                        <p className="info-value">{formatDate(userData.verified_at)}</p>
                      </div>
                      {userData.verified_by_username && (
                        <div className="info-item">
                          <p className="info-label">Verified By</p>
                          <p className="info-value">{userData.verified_by_username}</p>
                        </div>
                      )}
                      {userData.verification_notes && (
                        <div className="info-item">
                          <p className="info-label">Verification Notes</p>
                          <p className="info-value">{userData.verification_notes}</p>
                        </div>
                      )}
                      {userData.verification_status === 'VERIFIED' && (
                        <div className="info-item">
                          <p className="info-label">Verification Method</p>
                          <p className="info-value">Biometric + Document Verification</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'history' && (
                <div>
                  <div className="user-info-section">
                    <h3 className="section-title">Version History</h3>
                    <div className="info-list">
                      {versionHistory.length === 0 ? (
                        <div>No version history available for this user</div>
                      ) : (
                        <div>
                          {versionHistory.map((version, index) => (
                            <div className="version-item" key={index}>
                              <div className="version-header">
                                <p className="version-title">{version.record_type || `Version ${versionHistory.length - index}`}</p>
                                <p className="version-date">{formatDate(version.created_at || version.timestamp)}</p>
                              </div>
                              {version.description && (
                                <div className="version-description">
                                  <p>{version.description}</p>
                                </div>
                              )}
                              <div className="version-details">
                                <p className="version-label">Facemesh Hash:</p>
                                <p className="version-value">{truncateHash(version.facemesh_hash)}</p>
                              </div>
                              {version.blockchain_tx_hash && (
                                <div className="version-details">
                                  <p className="version-label">Blockchain TX:</p>
                                  <p className="version-value">
                                    <a 
                                      href={`https://testnet.snowtrace.io/tx/${version.blockchain_tx_hash}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                    >
                                      {truncateHash(version.blockchain_tx_hash)}
                                    </a>
                                  </p>
                                </div>
                              )}
                              {version.updated_by && (
                                <div className="version-details">
                                  <p className="version-label">Updated By:</p>
                                  <p className="version-value">{version.updated_by}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="modal-footer">
        {isEdit ? (
          <div>
            <input 
              type="text" 
              value={newFacemeshHash} 
              onChange={(e) => setNewFacemeshHash(e.target.value)} 
              placeholder="Enter new facemesh hash..."
            />
            <button onClick={handleUpdateFacemesh}>Update Facemesh</button>
            <button onClick={() => setIsEdit(false)}>Cancel</button>
          </div>
        ) : (
          <div>
            <button 
              onClick={handleVerifyUser} 
              disabled={userData.verification_status === 'VERIFIED'}
              className={userData.verification_status === 'VERIFIED' ? 'button-disabled' : ''}
            >
              {userData.verification_status === 'VERIFIED' ? 'Already Verified' : 'Verify'}
            </button>
            <button 
              onClick={handleRejectUser}
              disabled={userData.verification_status === 'REJECTED'}
              className={userData.verification_status === 'REJECTED' ? 'button-disabled' : ''}
            >
              Reject
            </button>
            <button onClick={() => setIsEdit(true)}>Edit Facemesh</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetailModal;
