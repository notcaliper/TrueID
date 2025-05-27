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
    if (action.includes('Verified')) return <FaCheckCircle className="action-icon verified" style={{ color: '#10b981' }} />;
    if (action.includes('Rejected')) return <FaTimesCircle className="action-icon rejected" style={{ color: '#ef4444' }} />;
    if (action.includes('Updated')) return <FaEdit className="action-icon updated" style={{ color: '#3b82f6' }} />;
    return <FaClock className="action-icon pending" style={{ color: '#f59e0b' }} />;
  };

  return (
    <div className="activity-logs" style={{
      padding: '24px',
      backgroundColor: '#1a1a1a',
      minHeight: '100vh',
      color: '#e0e0e0',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div className="page-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '0 0 16px 0',
        borderBottom: '1px solid #333'
      }}>
        <h1 className="page-title" style={{
          fontSize: '28px',
          fontWeight: '600',
          margin: '0',
          display: 'flex',
          alignItems: 'center',
          color: '#fff',
          letterSpacing: '-0.5px'
        }}>
          <FaHistory style={{
            marginRight: '12px',
            color: '#6366f1'
          }} />
          Activity Logs
        </h1>
        <button
          onClick={handleExportLogs}
          className="export-button"
          disabled={loading}
          style={{
            backgroundColor: '#2d2d2d',
            color: '#fff',
            border: '1px solid #404040',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? '0.7' : '1',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            ':hover': {
              backgroundColor: '#404040'
            }
          }}
        >
          <FaDownload style={{ marginRight: '8px' }} />
          Export Logs
        </button>
      </div>
      
      {error && (
        <div className="error-message" style={{
          backgroundColor: '#2c1519',
          color: '#f87171',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #451a1a',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <FaTimesCircle style={{ marginRight: '8px' }} />
          {error}
        </div>
      )}
      
      {/* Filters */}
      <div className="filters-section" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '24px',
        backgroundColor: '#2d2d2d',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div className="filters-container" style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%'
        }}>
          <div className="filters-header" style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid #404040'
          }}>
            <FaFilter style={{
              color: '#6366f1',
              marginRight: '10px',
              fontSize: '16px'
            }} />
            <h3 className="filters-title" style={{
              margin: '0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#fff',
              letterSpacing: '-0.3px'
            }}>Filter Activity Logs</h3>
          </div>
          
          <div className="filters-body" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div className="filter-group" style={{
              flex: '1',
              minWidth: '200px'
            }}>
              <label htmlFor="actionFilter" className="filter-label" style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#a3a3a3'
              }}>
                <FaCheckCircle style={{
                  marginRight: '8px',
                  color: '#6366f1',
                  fontSize: '14px'
                }} />
                Action Type
              </label>
              <select
                id="actionFilter"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="filter-select"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #404040',
                  backgroundColor: '#1a1a1a',
                  fontSize: '14px',
                  color: '#e0e0e0',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23e0e0e0\' d=\'M6 8.825L1.175 4 2.05 3.125 6 7.075 9.95 3.125 10.825 4 6 8.825z\' /%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '32px',
                  transition: 'border-color 0.2s ease',
                  outline: 'none'
                }}
              >
                <option value="all">All Actions</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="updated">Updated</option>
              </select>
            </div>
            
            <div className="filter-group" style={{
              flex: '1',
              minWidth: '200px'
            }}>
              <label htmlFor="startDate" className="filter-label" style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#a3a3a3'
              }}>
                <FaCalendarAlt style={{
                  marginRight: '8px',
                  color: '#6366f1',
                  fontSize: '14px'
                }} />
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #404040',
                  backgroundColor: '#1a1a1a',
                  color: '#e0e0e0',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            
            <div className="filter-group" style={{
              flex: '1',
              minWidth: '200px'
            }}>
              <label htmlFor="endDate" className="filter-label" style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#a3a3a3'
              }}>
                <FaCalendarAlt style={{
                  marginRight: '8px',
                  color: '#6366f1',
                  fontSize: '14px'
                }} />
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #404040',
                  backgroundColor: '#1a1a1a',
                  color: '#e0e0e0',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            
            <div className="filter-actions" style={{
              display: 'flex',
              alignItems: 'flex-end',
              flex: '1',
              minWidth: '200px'
            }}>
              <button
                onClick={handleFilterApply}
                className="filter-button"
                style={{
                  backgroundColor: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(99,102,241,0.2)'
                }}
              >
                <FaFilter style={{ marginRight: '8px' }} />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
        
        <div className="search-container" style={{
          marginTop: '16px',
          borderTop: '1px solid #404040',
          paddingTop: '16px'
        }}>
          <form onSubmit={handleSearch} className="search-form" style={{
            display: 'flex',
            gap: '12px'
          }}>
            <div className="search-input-container" style={{
              position: 'relative',
              flex: '1'
            }}>
              <input
                type="text"
                placeholder="Search by user name, ID, or admin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  borderRadius: '8px',
                  border: '1px solid #404040',
                  fontSize: '14px',
                  color: '#e0e0e0',
                  backgroundColor: '#1a1a1a',
                  transition: 'border-color 0.2s ease',
                  outline: 'none'
                }}
              />
              <FaSearch style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }} />
            </div>
            <button
              type="submit"
              className="search-button"
              style={{
                backgroundColor: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(99,102,241,0.2)'
              }}
            >
              <FaSearch style={{ marginRight: '8px' }} />
              Search
            </button>
          </form>
        </div>
      </div>
      
      {/* Activity Logs Table */}
      <div className="table-container" style={{
        backgroundColor: '#2d2d2d',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        <table className="data-table" style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#262626',
              borderBottom: '2px solid #404040'
            }}>
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#e0e0e0'
              }}>Action</th>
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#e0e0e0'
              }}>User</th>
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#e0e0e0'
              }}>Admin</th>
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#e0e0e0'
              }}>Timestamp</th>
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#e0e0e0'
              }}>TX Hash</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{
                  padding: '40px',
                  textAlign: 'center'
                }}>
                  <div className="loading-spinner" style={{
                    display: 'inline-block',
                    width: '40px',
                    height: '40px',
                    border: '4px solid rgba(99,102,241,0.1)',
                    borderLeftColor: '#6366f1',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#a3a3a3'
                }}>
                  No activity logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{
                  borderBottom: '1px solid #404040',
                  transition: 'background-color 0.2s ease',
                  ':hover': {
                    backgroundColor: '#333333'
                  }
                }}>
                  <td style={{ padding: '16px', color: '#e0e0e0' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {getActionIcon(log.action)}
                      <span>{log.action}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#e0e0e0' }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <span style={{ fontWeight: '500' }}>{log.userName}</span>
                      <span style={{ color: '#a3a3a3', fontSize: '12px' }}>{log.userId}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#e0e0e0' }}>{log.adminName}</td>
                  <td style={{ padding: '16px', color: '#e0e0e0' }}>{formatDate(log.timestamp)}</td>
                  <td style={{
                    padding: '16px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: '#6366f1'
                  }}>{truncateHash(log.txHash)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          backgroundColor: '#2d2d2d',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div className="pagination-info" style={{
            fontSize: '14px',
            color: '#a3a3a3'
          }}>
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="pagination-controls" style={{
            display: 'flex',
            gap: '12px'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #404040',
                backgroundColor: currentPage === 1 ? '#262626' : '#2d2d2d',
                color: currentPage === 1 ? '#6b7280' : '#6366f1',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <FaChevronLeft style={{ marginRight: '8px' }} />
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #404040',
                backgroundColor: currentPage === totalPages ? '#262626' : '#2d2d2d',
                color: currentPage === totalPages ? '#6b7280' : '#6366f1',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Next
              <FaChevronRight style={{ marginLeft: '8px' }} />
            </button>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ActivityLogs;
