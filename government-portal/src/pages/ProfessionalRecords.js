import React, { useState, useEffect, useCallback } from 'react';
import ApiService from '../services/ApiService';
import BlockchainService from '../services/BlockchainService';
import { FaSearch, FaEye, FaCheckCircle, FaTimesCircle, FaSpinner, 
         FaChevronLeft, FaChevronRight, FaLink, FaExclamationTriangle } from 'react-icons/fa';

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
      
      <style jsx="true">{`
        /* Using only 4 colors for the entire page:
         * Primary: #3b82f6 (blue)
         * Success: #10b981 (green)
         * Error: #ef4444 (red)
         * Background: white
         * Text: #1f2937 (dark gray)
         */
        
        body {
          background: white;
          color: #1f2937;
        }
        
        .professional-records-page {
          padding: 24px;
          color: #1f2937;
          background: white;
        }
        
        .page-title {
          margin-bottom: 24px;
          color: #1f2937;
          font-size: 24px;
          font-weight: 600;
        }
        
        .search-container {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 16px;
          border: 1px solid #3b82f6;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .search-form {
          flex: 1;
          min-width: 300px;
        }
        
        .search-input-group {
          display: flex;
          gap: 8px;
        }
        
        .search-input {
          flex: 1;
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid #3b82f6;
          background: white;
          color: #1f2937;
          font-size: 14px;
        }
        
        .search-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .search-button:hover {
          background: #1f2937;
          color: #3b82f6;
          border: 1px solid #3b82f6;
        }
        
        .refresh-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .auto-refresh-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #1f2937;
        }
        
        .auto-refresh-toggle input {
          margin-right: 4px;
        }
        
        .refresh-interval select {
          padding: 8px;
          border-radius: 6px;
          background: white;
          border: 1px solid #3b82f6;
          color: #1f2937;
        }
        
        .refresh-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .refresh-button:hover {
          background: #1f2937;
          color: #3b82f6;
          border: 1px solid #3b82f6;
        }
        
        .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-message, .success-message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .error-message {
          background: white;
          color: #ef4444;
          border: 1px solid #ef4444;
        }
        
        .success-message {
          background: white;
          color: #10b981;
          border: 1px solid #10b981;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          background: white;
          border-radius: 12px;
          border: 1px solid #3b82f6;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #1f2937;
          border-radius: 50%;
          border-top-color: #3b82f6;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        .records-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #3b82f6;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .records-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #3b82f6;
          background: white;
        }
        
        .records-header h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: #1f2937;
        }
        
        .records-count {
          font-size: 14px;
          color: #1f2937;
        }
        
        .no-records-message {
          padding: 32px;
          text-align: center;
          color: #1f2937;
        }
        
        .records-table-container {
          overflow-x: auto;
        }
        
        .records-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }
        
        .records-table th {
          background: #3b82f6;
          color: white;
          font-weight: 600;
          text-align: left;
          padding: 12px 16px;
          border-bottom: 1px solid #3b82f6;
        }
        
        .records-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #3b82f6;
          color: #1f2937;
        }
        
        .records-table tr:hover {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid #3b82f6;
        }
        
        .user-info .user-name {
          font-weight: 500;
        }
        
        .user-info .user-id {
          font-size: 12px;
          opacity: 0.7;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-badge.verified {
          background: white;
          color: #10b981;
          border: 1px solid #10b981;
        }
        
        .status-badge.rejected {
          background: white;
          color: #ef4444;
          border: 1px solid #ef4444;
        }
        
        .status-badge.pending {
          background: white;
          color: #3b82f6;
          border: 1px solid #3b82f6;
        }
        
        .status-badge.large {
          font-size: 14px;
          padding: 8px 12px;
        }
        
        .blockchain-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }
        
        .blockchain-status.on-chain {
          color: #10b981;
        }
        
        .blockchain-status.off-chain {
          color: white;
          opacity: 0.7;
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        
        .action-button {
          background: #3b82f6;
          color: white;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-button:hover {
          background: white;
          color: #3b82f6;
          border: 1px solid #3b82f6;
        }
        
        .pagination-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 16px;
          gap: 8px;
          border-top: 1px solid #3b82f6;
        }
        
        .pagination-button {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .pagination-button:hover:not(:disabled) {
          background: white;
          color: #3b82f6;
          border: 1px solid #3b82f6;
        }
        
        .pagination-button:disabled {
          background: white;
          color: #1f2937;
          border: 1px solid #1f2937;
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .page-numbers {
          display: flex;
          gap: 4px;
        }
        
        .page-number {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          color: #1f2937;
          border: 1px solid #3b82f6;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .page-number.active {
          background: #3b82f6;
          color: white;
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-container {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid #3b82f6;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #3b82f6;
          background: white;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 18px;
          color: #1f2937;
        }
        
        .close-button {
          background: none;
          border: none;
          color: #1f2937;
          font-size: 24px;
          cursor: pointer;
        }
        
        .modal-body {
          padding: 20px;
        }
        
        .modal-section {
          margin-bottom: 24px;
        }
        
        .modal-section h3 {
          font-size: 16px;
          margin-top: 0;
          margin-bottom: 12px;
          color: #3b82f6;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 12px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .info-label {
          font-size: 12px;
          color: #1f2937;
          font-weight: 500;
        }
        
        .info-value {
          font-size: 14px;
          color: #1f2937;
        }
        
        .status-container {
          margin-top: 8px;
        }
        
        .blockchain-status-container {
          background: white;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .blockchain-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .blockchain-info.on-chain {
          color: #10b981;
        }
        
        .blockchain-info.off-chain {
          color: #1f2937;
        }
        
        .blockchain-tx {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 8px;
        }
        
        .tx-label {
          font-size: 12px;
          opacity: 0.7;
        }
        
        .tx-link {
          color: #3b82f6;
          text-decoration: none;
        }
        
        .tx-link:hover {
          text-decoration: underline;
        }
        
        .blockchain-actions {
          margin-top: 16px;
        }
        
        .blockchain-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .blockchain-button:hover {
          background: white;
          color: #3b82f6;
          border: 1px solid #3b82f6;
        }
        
        .blockchain-message {
          margin-top: 16px;
          padding: 12px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .blockchain-message.success {
          background: white;
          color: #10b981;
          border: 1px solid #10b981;
        }
        
        .blockchain-message.error {
          background: white;
          color: #ef4444;
          border: 1px solid #ef4444;
        }
        
        .modal-footer {
          padding: 16px 20px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          border-top: 1px solid #3b82f6;
        }
        
        .modal-button {
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .modal-button.cancel {
          background: white;
          color: #1f2937;
          border: 1px solid #3b82f6;
        }
        
        .modal-button.primary {
          background: #3b82f6;
          color: white;
          border: none;
        }
        
        .modal-button.primary:hover {
          background: white;
          color: #3b82f6;
          border: 1px solid #3b82f6;
        }
        
        .modal-button.cancel:hover {
          background: #3b82f6;
          color: white;
          border: 1px solid #3b82f6;
        }
      `}</style>
      
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
