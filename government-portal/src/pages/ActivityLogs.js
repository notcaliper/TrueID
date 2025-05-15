import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';
import { FaSearch, FaDownload, FaCalendarAlt, FaFilter, 
         FaCheckCircle, FaTimesCircle, FaEdit, FaClock, 
         FaLink, FaChevronLeft, FaChevronRight, FaHistory } from 'react-icons/fa';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [actionFilter, setActionFilter] = useState('all');
  const logsPerPage = 15;

  useEffect(() => {
    fetchActivityLogs();
  }, [currentPage, actionFilter]);

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const filters = {
        action: actionFilter !== 'all' ? actionFilter : undefined,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
        search: searchQuery || undefined
      };
      
      const data = await ApiService.getActivityLogs(currentPage, logsPerPage, filters);
      setLogs(data.logs);
      setTotalPages(Math.ceil(data.total / logsPerPage));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError('Failed to load activity logs. Please try again.');
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchActivityLogs();
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterApply = () => {
    setCurrentPage(1); // Reset to first page on filter change
    fetchActivityLogs();
  };

  const handleExportLogs = async () => {
    try {
      setLoading(true);
      const filters = {
        action: actionFilter !== 'all' ? actionFilter : undefined,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
        search: searchQuery || undefined
      };
      
      const blob = await ApiService.exportActivityLogs(filters);
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
      
      // Append to the document
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setLoading(false);
    } catch (err) {
      console.error('Error exporting logs:', err);
      setError('Failed to export logs. Please try again.');
      setLoading(false);
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

  const getActionIcon = (action) => {
    if (action.includes('Verified')) return <FaCheckCircle className="action-icon verified" />;
    if (action.includes('Rejected')) return <FaTimesCircle className="action-icon rejected" />;
    if (action.includes('Updated')) return <FaEdit className="action-icon updated" />;
    return <FaClock className="action-icon pending" />;
  };

  return (
    <div className="activity-logs">
      <div className="page-header">
        <h1 className="page-title">
          <FaHistory className="page-title-icon" />
          Activity Logs
        </h1>
        <button
          onClick={handleExportLogs}
          className="export-button"
          disabled={loading}
        >
          <FaDownload className="button-icon" />
          Export Logs
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {/* Filters */}
      <div className="filters-section">
        <div className="filters-container">
          <div className="filters-header">
            <FaFilter className="filters-icon" />
            <h3 className="filters-title">Filter Activity Logs</h3>
          </div>
          
          <div className="filters-body">
            <div className="filter-group">
              <label htmlFor="actionFilter" className="filter-label">
                <FaCheckCircle className="filter-label-icon" />
                Action Type
              </label>
              <select
                id="actionFilter"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Actions</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="updated">Updated</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="startDate" className="filter-label">
                <FaCalendarAlt className="filter-label-icon" />
                Start Date
              </label>
              <div className="date-input-container">
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateRangeChange}
                  className="date-input"
                />
                <FaCalendarAlt className="date-icon" />
              </div>
            </div>
            
            <div className="filter-group">
              <label htmlFor="endDate" className="filter-label">
                <FaCalendarAlt className="filter-label-icon" />
                End Date
              </label>
              <div className="date-input-container">
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateRangeChange}
                  className="date-input"
                />
                <FaCalendarAlt className="date-icon" />
              </div>
            </div>
            
            <div className="filter-actions">
              <button
                onClick={handleFilterApply}
                className="filter-button"
              >
                <FaFilter className="filter-button-icon" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
        
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search by user name, ID, or admin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <FaSearch className="search-icon" />
            </div>
            <button
              type="submit"
              className="search-button"
            >
              <FaSearch className="search-button-icon" />
              Search
            </button>
          </form>
        </div>
      </div>
      
      {/* Activity Logs Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>User</th>
                <th>Admin</th>
                <th>Timestamp</th>
                <th>TX Hash</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">
                    No activity logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="data-row">
                    <td>
                      <div className="action-cell">
                        {getActionIcon(log.action)}
                        <span>{log.action}</span>
                      </div>
                    </td>
                    <td>
                      <div className="user-cell">
                        <div className="user-name">{log.userName}</div>
                        <div className="user-id">{log.userId}</div>
                      </div>
                    </td>
                    <td>{log.adminName}</td>
                    <td>{formatDate(log.timestamp)}</td>
                    <td className="hash-cell">{truncateHash(log.txHash)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-button"
              aria-label="Previous page"
            >
              <FaChevronLeft className="pagination-icon" />
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-button"
              aria-label="Next page"
            >
              Next
              <FaChevronRight className="pagination-icon" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
