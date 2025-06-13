import React, { useState, useEffect, useCallback, useRef } from 'react';
import ApiService from '../services/ApiService';
import UserDetailModal from '../components/UserDetailModal';
import { FaSearch, FaEye, FaUserCheck, FaUserTimes, FaUserClock, FaChevronLeft, FaChevronRight, FaDatabase, FaExclamationCircle, FaEdit } from 'react-icons/fa';

const RecordManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('name'); // 'name', 'id', or 'facehash'
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState(60000); // 60 seconds refresh by default
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false); // Disabled by default
  const refreshTimerRef = useRef(null);
  const usersPerPage = 10;

  // Memoize fetchUsers to avoid recreation on each render
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiService.getUsers(currentPage, usersPerPage, searchQuery, searchType);
      setUsers(data.users);
      setTotalPages(Math.ceil(data.total / usersPerPage));
      setTotalUsers(data.total);
      setLastRefreshed(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      setLoading(false);
    }
  }, [currentPage, usersPerPage, searchQuery, searchType]);

  // Initial data load
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Set up polling for real-time updates
  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        fetchUsers();
      }, refreshInterval);
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [fetchUsers, refreshInterval, autoRefresh]);

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchUsers();
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
    fetchUsers();
  };

  const handleViewUser = (user) => {
    // Ensure the user object has the correct ID property
    // The API returns 'id' but the modal expects 'id'
    const userWithProperID = {
      ...user,
      // Make sure id is defined and properly set
      id: user.id
    };
    
    setSelectedUser(userWithProperID);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserUpdated = (updatedUser) => {
    // Update the user in the list
    setUsers(users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    setIsModalOpen(false);
    setSelectedUser(null);
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

  const getStatusDisplay = (status) => {
    if (!status) return 'Unknown';
    
    // API returns status in uppercase (e.g., 'PENDING', 'VERIFIED', 'REJECTED')
    // Convert to title case for display (e.g., 'Pending', 'Verified', 'Rejected')
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Animation styles are defined in the CSS injected below

  // Add animation styles to head
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      
      @media (max-width: 1024px) {
        .record-management {
          padding: 16px;
        }
        
        .page-header {
          margin-bottom: 24px;
        }
      }
      
      @media (max-width: 768px) {
        .record-management form {
          flex-direction: column;
        }
        
        .record-management .form-group {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="record-management" style={{
      padding: '32px',
      backgroundColor: 'white',
      minHeight: '100vh',
      color: '#1f2937',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div className="page-header" style={{
        marginBottom: '32px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #3b82f6',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            <FaDatabase style={{ color: '#3b82f6', fontSize: '20px' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '600',
              margin: '0 0 4px 0',
              color: '#1f2937',
              letterSpacing: '-0.5px'
            }}>User Records</h1>
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              margin: '0'
            }}>Manage and monitor user identities in the system</p>
          </div>
        </div>
        
        <form onSubmit={handleSearch} style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #3b82f6',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              flex: '0 0 200px'
            }}>
              <select 
                value={searchType} 
                onChange={(e) => setSearchType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  border: '1px solid #3b82f6',
                  borderRadius: '12px',
                  color: '#1f2937',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%236b7280\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '20px',
                  transition: 'all 0.2s ease'
                }}
              >
                <option value="name">Search by Name</option>
                <option value="id">Search by ID</option>
                <option value="facehash">Search by Facemesh Hash</option>
              </select>
            </div>
            
            <div style={{
              flex: '1',
              position: 'relative'
            }}>
              <input
                type="text"
                placeholder={`Search by ${searchType}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  backgroundColor: 'white',
                  border: '1px solid #3b82f6',
                  borderRadius: '12px',
                  color: '#1f2937',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s ease'
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
              style={{
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <FaSearch />
              Search Records
            </button>
          </div>
          
          {!loading && (
            <div style={{
              color: '#a3a3a3',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#34d399'
              }}></span>
              Showing {users.length} of {totalUsers} total users
            </div>
          )}
        </form>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'white',
          color: '#ef4444',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          fontSize: '14px',
          border: '1px solid #ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'shake 0.5s',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <FaExclamationCircle />
          {error}
        </div>
      )}

      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #3b82f6',
        marginBottom: '24px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          overflowX: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#3b82f6'
              }}>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: 'white',
                  borderBottom: '2px solid white',
                  whiteSpace: 'nowrap'
                }}>Serial No.</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: 'white',
                  borderBottom: '2px solid white',
                  whiteSpace: 'nowrap'
                }}>Name</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: 'white',
                  borderBottom: '2px solid white',
                  whiteSpace: 'nowrap'
                }}>Unique ID</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: 'white',
                  borderBottom: '2px solid white',
                  whiteSpace: 'nowrap'
                }}>Status</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: 'white',
                  borderBottom: '2px solid white',
                  whiteSpace: 'nowrap'
                }}>Last Updated</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: 'white',
                  borderBottom: '2px solid white',
                  whiteSpace: 'nowrap'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{
                    padding: '48px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid rgba(99,102,241,0.1)',
                        borderTopColor: '#6366f1',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <span style={{ color: '#a3a3a3' }}>Loading records...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{
                    padding: '48px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px',
                      color: '#a3a3a3'
                    }}>
                      <FaDatabase style={{ fontSize: '32px', opacity: '0.5' }} />
                      <span>No records found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user?.id || index} style={{
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                    transition: 'background-color 0.2s ease'
                  }}>
                    <td style={{
                      padding: '16px',
                      color: '#1f2937',
                      whiteSpace: 'nowrap'
                    }}>{(currentPage - 1) * usersPerPage + index + 1}</td>
                    <td style={{
                      padding: '16px',
                      color: '#1f2937',
                      whiteSpace: 'nowrap'
                    }}>{user?.name || 'N/A'}</td>
                    <td style={{
                      padding: '16px',
                      color: '#1f2937',
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap'
                    }}>{user?.government_id || 'N/A'}</td>
                    <td style={{
                      padding: '16px',
                      whiteSpace: 'nowrap'
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '500',
                        backgroundColor: 'white',
                        color: user?.verification_status === 'VERIFIED' ? '#10b981' :
                               user?.verification_status === 'REJECTED' ? '#ef4444' :
                               '#f59e0b',
                        border: `1px solid ${user?.verification_status === 'VERIFIED' ? '#10b981' :
                                           user?.verification_status === 'REJECTED' ? '#ef4444' :
                                           '#f59e0b'}`,
                        transition: 'all 0.2s ease'
                      }}>
                        {user?.verification_status === 'VERIFIED' && <FaUserCheck />}
                        {user?.verification_status === 'REJECTED' && <FaUserTimes />}
                        {(!user?.verification_status || user.verification_status === 'PENDING') && <FaUserClock />}
                        <span>{getStatusDisplay(user?.verification_status || 'PENDING')}</span>
                      </div>
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#6b7280',
                      whiteSpace: 'nowrap'
                    }}>{user?.updated_at ? formatDate(user.updated_at) : 'N/A'}</td>
                    <td style={{
                      padding: '16px',
                      whiteSpace: 'nowrap'
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '8px'
                      }}>
                        <button
                          onClick={() => handleViewUser(user)}
                          style={{
                            backgroundColor: 'white',
                            color: '#3b82f6',
                            border: '1px solid #3b82f6',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleViewUser({...user, isEdit: true})}
                          style={{
                            backgroundColor: 'white',
                            color: '#3b82f6',
                            border: '1px solid #3b82f6',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          title="Edit User"
                        >
                          <FaEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#262626',
          borderRadius: '12px',
          border: '1px solid #404040'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              color: '#6b7280',
              fontSize: '14px'
            }}>
              Page {currentPage} of {totalPages}
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <button
                onClick={handleManualRefresh}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  backgroundColor: 'white',
                  border: '1px solid #3b82f6',
                  borderRadius: '12px',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Refresh data"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{
                  animation: loading ? 'spin 1s linear infinite' : 'none'
                }}>
                  <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                  <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                </svg>
              </button>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={toggleAutoRefresh}
                  style={{
                    accentColor: '#3b82f6'
                  }}
                />
                <label htmlFor="autoRefresh" style={{ fontSize: '14px', color: '#6b7280' }}>
                  Auto-refresh
                </label>
              </div>
              
              {autoRefresh && (
                <select
                  value={refreshInterval}
                  onChange={handleRefreshIntervalChange}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'white',
                    border: '1px solid #3b82f6',
                    borderRadius: '8px',
                    color: '#1f2937',
                    fontSize: '14px'
                  }}
                >
                  <option value="5000">5s</option>
                  <option value="10000">10s</option>
                  <option value="30000">30s</option>
                  <option value="60000">1m</option>
                </select>
              )}
              
              <div style={{ fontSize: '12px', color: '#a3a3a3' }}>
                Last updated: {lastRefreshed.toLocaleTimeString()}
              </div>
            </div>
          </div>
        
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: 'white',
                border: '1px solid #3b82f6',
                borderRadius: '12px',
                color: currentPage === 1 ? '#9ca3af' : '#3b82f6',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: currentPage === 1 ? 0.6 : 1
              }}
            >
              <FaChevronLeft />
              <span>Previous</span>
            </button>
            
            <div style={{
              display: 'flex',
              gap: '4px'
            }}>
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
                    style={{
                      minWidth: '40px',
                      padding: '10px',
                      backgroundColor: currentPage === pageNum ? '#3b82f6' : 'white',
                      border: '1px solid #3b82f6',
                      borderRadius: '12px',
                      color: currentPage === pageNum ? '#fff' : '#3b82f6',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: 'white',
                border: '1px solid #3b82f6',
                borderRadius: '12px',
                color: currentPage === totalPages ? '#9ca3af' : '#3b82f6',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: currentPage === totalPages ? 0.6 : 1
              }}
            >
              <span>Next</span>
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {isModalOpen && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={handleCloseModal}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
};

export default RecordManagement;
