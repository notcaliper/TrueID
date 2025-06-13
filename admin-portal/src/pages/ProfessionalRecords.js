import React, { useState, useEffect, useCallback } from 'react';
import ApiService from '../services/ApiService';
import BlockchainService from '../services/BlockchainService';
import { FaSearch, FaEye, FaCheckCircle, FaTimesCircle, FaSpinner, 
         FaChevronLeft, FaChevronRight, FaLink, FaExclamationTriangle } from 'react-icons/fa';
import '../pages/ProfessionalRecords.css';

const ProfessionalRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(60000); // 60 seconds refresh by default
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false); // Disabled by default
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [blockchainError, setBlockchainError] = useState(null);
  const [blockchainSuccess, setBlockchainSuccess] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const refreshTimerRef = React.useRef(null);
  const recordsPerPage = 10;

  // Fetch professional records
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to use the new admin endpoint for all professional records
      try {
        const response = await ApiService.getAllProfessionalRecords(currentPage, recordsPerPage, searchQuery);
        
        if (response && response.records) {
          // Process records to ensure they have user information
          const processedRecords = response.records.map(record => {
            // If record already has user info, use it; otherwise, create a placeholder
            if (!record.user && record.userId) {
              return {
                ...record,
                user: {
                  id: record.userId,
                  name: record.userName || 'Unknown User',
                  governmentId: record.userGovernmentId || 'Unknown ID'
                }
              };
            }
            return record;
          });
          
          setRecords(processedRecords);
          setTotalRecords(response.total || processedRecords.length);
          setTotalPages(response.totalPages || Math.ceil(processedRecords.length / recordsPerPage));
          setLastRefreshed(new Date());
        } else {
          // Fallback to old method if response format is unexpected
          throw new Error('Invalid response format from admin endpoint');
        }
      } catch (adminError) {
        console.warn('Admin endpoint failed, falling back to user-by-user method:', adminError);
        
        // Fallback: Get all users and then get professional records for each user
        const userData = await ApiService.getUsers(currentPage, recordsPerPage, searchQuery);
        const allRecords = [];
        
        for (const user of userData.users) {
          try {
            const recordsData = await ApiService.getProfessionalRecords(user.id);
            if (recordsData && recordsData.records) {
              // Add user info to each record
              const recordsWithUserInfo = recordsData.records.map(record => ({
                ...record,
                user: {
                  id: user.id,
                  name: user.name,
                  governmentId: user.governmentId
                }
              }));
              allRecords.push(...recordsWithUserInfo);
            }
          } catch (err) {
            console.error(`Error fetching records for user ${user.id}:`, err);
          }
        }
        
        setRecords(allRecords);
        setTotalRecords(allRecords.length);
        setTotalPages(Math.ceil(allRecords.length / recordsPerPage));
        setLastRefreshed(new Date());
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching records:', err);
      setError('Failed to load professional records. Please try again.');
      setLoading(false);
    }
  }, [currentPage, recordsPerPage, searchQuery]);

  // Initial data load
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);
  
  // Set up polling for real-time updates
  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        fetchRecords();
      }, refreshInterval);
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [fetchRecords, refreshInterval, autoRefresh]);

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchRecords();
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Change refresh interval
  const handleRefreshIntervalChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setRefreshInterval(value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchRecords();
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setSelectedUserId(record.user.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    setSelectedUserId(null);
    // Clear any success or error messages
    setBlockchainSuccess(null);
    setBlockchainError(null);
    setSuccess(null);
    setError(null);
  };

  const handleVerifyRecord = async (recordId) => {
    if (!selectedUserId) {
      setError('User ID is missing. Cannot verify record.');
      return;
    }
    
    setBlockchainLoading(true);
    setBlockchainError(null);
    setBlockchainSuccess(null);
    
    try {
      // First verify the record through the API
      await ApiService.verifyProfessionalRecord(selectedUserId, recordId);
      
      // Then record it on the blockchain
      const blockchainResult = await BlockchainService.verifyProfessionalRecord(selectedUserId, recordId);
      
      if (blockchainResult.success) {
        setBlockchainSuccess('Professional record verified and recorded on blockchain successfully!');
        // Refresh records after successful verification
        fetchRecords();
      } else {
        setBlockchainError('Failed to record on blockchain: ' + blockchainResult.error);
      }
    } catch (err) {
      console.error('Error verifying record:', err);
      setBlockchainError('Error: ' + (err.message || 'Failed to verify record'));
    } finally {
      setBlockchainLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusDisplay = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const truncateHash = (hash) => {
    if (!hash) return 'N/A';
    return hash.length > 10 ? `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}` : hash;
  };

  // Get current page records
  const getCurrentPageRecords = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return records.slice(startIndex, endIndex);
  };

  return (
    <div className="professional-records-page">
      <h1 className="page-title">Professional Records Management</h1>
      
      {/* Search and Filters */}
      <div className="search-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search by name, ID, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <FaSearch />
              <span>Search</span>
            </button>
          </div>
        </form>
        
        <div className="refresh-controls">
          <div className="auto-refresh-toggle">
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={toggleAutoRefresh}
              />
              <span>Auto-refresh</span>
            </label>
          </div>
          
          {autoRefresh && (
            <div className="refresh-interval">
              <select
                value={refreshInterval}
                onChange={handleRefreshIntervalChange}
              >
                <option value={15000}>15 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
                <option value={300000}>5 minutes</option>
              </select>
            </div>
          )}
          
          <button onClick={handleManualRefresh} className="refresh-button">
            <FaSpinner className={autoRefresh ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
      
      {/* Error and Success Messages */}
      {error && (
        <div className="error-message">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <FaCheckCircle />
          <span>{success}</span>
        </div>
      )}
      
      {/* Records Table */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <p>Loading professional records...</p>
        </div>
      ) : (
        <div className="records-container">
          <div className="records-header">
            <h2>Professional Records</h2>
            <div className="records-count">
              {totalRecords} {totalRecords === 1 ? 'record' : 'records'} found
            </div>
          </div>
          
          {records.length === 0 ? (
            <div className="no-records-message">
              <p>No professional records found. Try adjusting your search criteria.</p>
            </div>
          ) : (
            <>
              <div className="records-table-container">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Title</th>
                      <th>Organization</th>
                      <th>Date Range</th>
                      <th>Verification Status</th>
                      <th>Blockchain Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentPageRecords().map((record) => (
                      <tr key={record.id}>
                        <td>
                          <div className="user-info">
                            <div className="user-name">{record.user.name}</div>
                            <div className="user-id">{record.user.governmentId}</div>
                          </div>
                        </td>
                        <td>{record.title}</td>
                        <td>{record.organization}</td>
                        <td>
                          {formatDate(record.startDate)} - {record.endDate ? formatDate(record.endDate) : 'Present'}
                        </td>
                        <td>
                          <div className={`status-badge ${record.verificationStatus.toLowerCase()}`}>
                            {record.verificationStatus === 'VERIFIED' ? (
                              <FaCheckCircle className="status-icon" />
                            ) : record.verificationStatus === 'REJECTED' ? (
                              <FaTimesCircle className="status-icon" />
                            ) : (
                              <FaSpinner className="status-icon" />
                            )}
                            <span>{getStatusDisplay(record.verificationStatus)}</span>
                          </div>
                        </td>
                        <td>
                          {record.onBlockchain ? (
                            <div className="blockchain-status on-chain">
                              <FaLink className="blockchain-icon" />
                              <span>On Blockchain</span>
                            </div>
                          ) : (
                            <div className="blockchain-status off-chain">
                              <span>Not on Blockchain</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleViewRecord(record)}
                              className="action-button view"
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="pagination-container">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  <FaChevronLeft />
                  <span>Previous</span>
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  <span>Next</span>
                  <FaChevronRight />
                </button>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Record Detail Modal */}
      {isModalOpen && selectedRecord && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Professional Record Details</h2>
              <button onClick={handleCloseModal} className="close-button">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              {/* User Information */}
              <div className="modal-section">
                <h3>User Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{selectedRecord.user.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Government ID:</span>
                    <span className="info-value">{selectedRecord.user.governmentId}</span>
                  </div>
                </div>
              </div>
              
              {/* Record Information */}
              <div className="modal-section">
                <h3>Record Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Title:</span>
                    <span className="info-value">{selectedRecord.title}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Organization:</span>
                    <span className="info-value">{selectedRecord.organization}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Start Date:</span>
                    <span className="info-value">{formatDate(selectedRecord.startDate)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">End Date:</span>
                    <span className="info-value">
                      {selectedRecord.endDate ? formatDate(selectedRecord.endDate) : 'Present'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Description:</span>
                    <span className="info-value">{selectedRecord.description || 'No description provided'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Created:</span>
                    <span className="info-value">{formatDate(selectedRecord.createdAt)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Updated:</span>
                    <span className="info-value">{formatDate(selectedRecord.updatedAt)}</span>
                  </div>
                </div>
              </div>
              
              {/* Verification Status */}
              <div className="modal-section">
                <h3>Verification Status</h3>
                <div className="status-container">
                  <div className={`status-badge large ${selectedRecord.verificationStatus.toLowerCase()}`}>
                    {selectedRecord.verificationStatus === 'VERIFIED' ? (
                      <FaCheckCircle className="status-icon" />
                    ) : selectedRecord.verificationStatus === 'REJECTED' ? (
                      <FaTimesCircle className="status-icon" />
                    ) : (
                      <FaSpinner className="status-icon" />
                    )}
                    <span>{getStatusDisplay(selectedRecord.verificationStatus)}</span>
                  </div>
                </div>
              </div>
              
              {/* Blockchain Status */}
              <div className="modal-section">
                <h3>Blockchain Status</h3>
                <div className="blockchain-status-container">
                  {selectedRecord.onBlockchain ? (
                    <div className="blockchain-info on-chain">
                      <FaLink className="blockchain-icon" />
                      <span>Record is on the blockchain</span>
                      {selectedRecord.blockchainTxHash && (
                        <div className="blockchain-tx">
                          <span className="tx-label">Transaction Hash:</span>
                          <a 
                            href={`https://testnet.snowtrace.io/tx/${selectedRecord.blockchainTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tx-link"
                          >
                            {truncateHash(selectedRecord.blockchainTxHash)}
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="blockchain-info off-chain">
                      <span>Record is not on the blockchain</span>
                      {selectedRecord.verificationStatus === 'VERIFIED' && (
                        <div className="blockchain-actions">
                          <button 
                            onClick={() => handleVerifyRecord(selectedRecord.id)}
                            className="blockchain-button"
                            disabled={blockchainLoading}
                          >
                            {blockchainLoading ? (
                              <>
                                <FaSpinner className="spinning" />
                                <span>Recording...</span>
                              </>
                            ) : (
                              <>
                                <FaLink />
                                <span>Record on Blockchain</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Blockchain Messages */}
                {blockchainSuccess && (
                  <div className="blockchain-message success">
                    <FaCheckCircle />
                    <span>{blockchainSuccess}</span>
                  </div>
                )}
                
                {blockchainError && (
                  <div className="blockchain-message error">
                    <FaExclamationTriangle />
                    <span>{blockchainError}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={handleCloseModal} className="modal-button cancel">
                Close
              </button>
              
              {!selectedRecord.onBlockchain && selectedRecord.verificationStatus === 'VERIFIED' && (
                <button 
                  onClick={() => handleVerifyRecord(selectedRecord.id)}
                  className="modal-button primary"
                  disabled={blockchainLoading}
                >
                  {blockchainLoading ? 'Processing...' : 'Record on Blockchain'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalRecords;
