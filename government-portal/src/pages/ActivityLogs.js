import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';
import { FaSearch, FaDownload, FaCalendarAlt, FaFilter, 
         FaCheckCircle, FaTimesCircle, FaEdit, FaClock, 
         FaLink, FaChevronLeft, FaChevronRight, FaHistory } from 'react-icons/fa';
import '../styles/activity-logs.css';

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
      
      const response = await ApiService.getActivityLogs(currentPage, logsPerPage, filters);
      
      // Handle different response formats
      if (response.logs) {
        // Direct logs array
        setLogs(response.logs);
        setTotalPages(Math.ceil(response.pagination?.total || 0) / logsPerPage);
      } else if (response.data && response.data.logs) {
        // Nested in data property
        setLogs(response.data.logs);
        setTotalPages(Math.ceil(response.data.pagination?.total || 0) / logsPerPage);
      } else if (Array.isArray(response)) {
        // Response is the array itself
        setLogs(response);
        setTotalPages(1); // Can't determine total pages
      } else {
        // Fallback - empty array
        setLogs([]);
        setTotalPages(1);
        console.error('Unexpected response format:', response);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError('Failed to load activity logs. Please try again.');
      setLoading(false);
      setLogs([]);
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
        <div className="logs-table-body">
        {loading ? (
          <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading activity logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="no-logs-message">
              <p>No activity logs found matching your criteria.</p>
          </div>
        ) : (
            logs.map((log) => (
              <div key={log.id} className="log-row">
                <div className="log-cell log-action">
                  <div className="action-icon-container">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="action-details">
                    <span className="action-name">{log.action.replace(/_/g, ' ')}</span>
                    <span className="entity-type">
                      {log.entity_type ? log.entity_type.replace(/_/g, ' ') : 'Unknown Entity'}
                    </span>
                  </div>
                </div>
                
                <div className="log-cell log-user">
                  {log.user_name || log.admin_username || 'System'}
                  {log.government_id && (
                    <span className="government-id">{log.government_id}</span>
                  )}
                </div>
                
                <div className="log-cell log-details">
                  {log.details && typeof log.details === 'object' ? (
                    <div className="details-list">
                      {Object.entries(log.details).map(([key, value]) => (
                        <div key={key} className="details-item">
                          <span className="details-key">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}:</span>
                          <span className="details-value">
                            {typeof value === 'object' 
                              ? JSON.stringify(value) 
                              : String(value).length > 30 
                                ? `${String(value).substring(0, 30)}...` 
                                : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : log.details ? (
                    String(log.details)
                  ) : (
                    <em>No details</em>
                  )}
                </div>
                
                <div className="log-cell log-date">
                  {log.created_at ? formatDate(log.created_at) : 'Unknown date'}
                      </div>
                      </div>
                ))
              )}
        </div>
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
