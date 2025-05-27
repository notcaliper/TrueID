import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';
import UserDetailModal from '../components/UserDetailModal';
import { FaSearch, FaEye, FaEdit, FaUserCheck, FaUserTimes, FaUserClock, FaChevronLeft, FaChevronRight, FaDatabase } from 'react-icons/fa';

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
  const usersPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getUsers(currentPage, usersPerPage, searchQuery, searchType);
      setUsers(data.users);
      setTotalPages(Math.ceil(data.total / usersPerPage));
      setTotalUsers(data.total);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchUsers();
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
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
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Define styles object for animations
  const styles = {
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' }
    },
    '@keyframes shake': {
      '0%, 100%': { transform: 'translateX(0)' },
      '25%': { transform: 'translateX(-5px)' },
      '75%': { transform: 'translateX(5px)' }
    }
  };

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
      backgroundColor: '#1a1a1a',
      minHeight: '100vh',
      color: '#e0e0e0',
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
            backgroundColor: '#2d2d2d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #404040'
          }}>
            <FaDatabase style={{ color: '#6366f1', fontSize: '20px' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '600',
              margin: '0 0 4px 0',
              color: '#fff',
              letterSpacing: '-0.5px'
            }}>User Records</h1>
            <p style={{
              color: '#a3a3a3',
              fontSize: '14px',
              margin: '0'
            }}>Manage and monitor user identities in the system</p>
          </div>
        </div>
        
        <form onSubmit={handleSearch} style={{
          backgroundColor: '#2d2d2d',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #404040'
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
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #404040',
                  borderRadius: '12px',
                  color: '#e0e0e0',
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
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #404040',
                  borderRadius: '12px',
                  color: '#e0e0e0',
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
                backgroundColor: '#6366f1',
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
                transition: 'all 0.2s ease',
                ':hover': {
                  backgroundColor: '#4f46e5'
                }
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
          backgroundColor: '#2c1519',
          color: '#f87171',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          fontSize: '14px',
          border: '1px solid #451a1a',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'shake 0.5s'
        }}>
          <FaExclamationCircle />
          {error}
        </div>
      )}

      <div style={{
        backgroundColor: '#2d2d2d',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #404040',
        marginBottom: '24px'
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
                backgroundColor: '#262626'
              }}>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#e0e0e0',
                  borderBottom: '2px solid #404040',
                  whiteSpace: 'nowrap'
                }}>Serial No.</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#e0e0e0',
                  borderBottom: '2px solid #404040',
                  whiteSpace: 'nowrap'
                }}>Name</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#e0e0e0',
                  borderBottom: '2px solid #404040',
                  whiteSpace: 'nowrap'
                }}>Unique ID</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#e0e0e0',
                  borderBottom: '2px solid #404040',
                  whiteSpace: 'nowrap'
                }}>Status</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#e0e0e0',
                  borderBottom: '2px solid #404040',
                  whiteSpace: 'nowrap'
                }}>Last Updated</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#e0e0e0',
                  borderBottom: '2px solid #404040',
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
                    borderBottom: '1px solid #404040',
                    backgroundColor: index % 2 === 0 ? '#262626' : '#2d2d2d',
                    transition: 'background-color 0.2s ease',
                    ':hover': {
                      backgroundColor: '#323232'
                    }
                  }}>
                    <td style={{
                      padding: '16px',
                      color: '#e0e0e0',
                      whiteSpace: 'nowrap'
                    }}>{(currentPage - 1) * usersPerPage + index + 1}</td>
                    <td style={{
                      padding: '16px',
                      color: '#e0e0e0',
                      whiteSpace: 'nowrap'
                    }}>{user?.name || 'N/A'}</td>
                    <td style={{
                      padding: '16px',
                      color: '#e0e0e0',
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap'
                    }}>{user?.uniqueId || 'N/A'}</td>
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
                        backgroundColor: user?.status === 'verified' ? 'rgba(16, 185, 129, 0.1)' :
                                       user?.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' :
                                       'rgba(245, 158, 11, 0.1)',
                        color: user?.status === 'verified' ? '#34d399' :
                               user?.status === 'rejected' ? '#f87171' :
                               '#fbbf24',
                        border: `1px solid ${user?.status === 'verified' ? 'rgba(16, 185, 129, 0.2)' :
                                           user?.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' :
                                           'rgba(245, 158, 11, 0.2)'}`,
                        transition: 'all 0.2s ease'
                      }}>
                        {user?.status === 'verified' && <FaUserCheck />}
                        {user?.status === 'rejected' && <FaUserTimes />}
                        {(!user?.status || user.status === 'pending') && <FaUserClock />}
                        <span>{getStatusDisplay(user?.status || 'pending')}</span>
                      </div>
                    </td>
                    <td style={{
                      padding: '16px',
                      color: '#a3a3a3',
                      whiteSpace: 'nowrap'
                    }}>{user?.lastUpdated ? formatDate(user.lastUpdated) : 'N/A'}</td>
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
                            backgroundColor: '#374151',
                            color: '#6366f1',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            ':hover': {
                              backgroundColor: '#4b5563',
                              transform: 'translateY(-1px)'
                            }
                          }}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleViewUser({...user, isEdit: true})}
                          style={{
                            backgroundColor: '#374151',
                            color: '#6366f1',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            ':hover': {
                              backgroundColor: '#4b5563',
                              transform: 'translateY(-1px)'
                            }
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
          padding: '20px',
          backgroundColor: '#2d2d2d',
          borderRadius: '16px',
          border: '1px solid #404040'
        }}>
          <div style={{
            color: '#a3a3a3',
            fontSize: '14px'
          }}>
            Page {currentPage} of {totalPages}
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
                backgroundColor: currentPage === 1 ? '#262626' : '#374151',
                border: '1px solid #404040',
                borderRadius: '12px',
                color: currentPage === 1 ? '#6b7280' : '#e0e0e0',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                ':hover': currentPage !== 1 && {
                  backgroundColor: '#4b5563',
                  transform: 'translateY(-1px)'
                }
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
                      backgroundColor: currentPage === pageNum ? '#6366f1' : '#374151',
                      border: '1px solid #404040',
                      borderRadius: '12px',
                      color: currentPage === pageNum ? '#fff' : '#e0e0e0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      ':hover': currentPage !== pageNum && {
                        backgroundColor: '#4b5563',
                        transform: 'translateY(-1px)'
                      }
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
                backgroundColor: currentPage === totalPages ? '#262626' : '#374151',
                border: '1px solid #404040',
                borderRadius: '12px',
                color: currentPage === totalPages ? '#6b7280' : '#e0e0e0',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                ':hover': currentPage !== totalPages && {
                  backgroundColor: '#4b5563',
                  transform: 'translateY(-1px)'
                }
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
