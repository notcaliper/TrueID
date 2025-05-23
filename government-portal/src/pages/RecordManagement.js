import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';
import UserDetailModal from '../components/UserDetailModal';
import { FaSearch, FaEye, FaEdit, FaUserCheck, FaUserTimes, FaUserClock, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="status-badge verified">
            <FaUserCheck className="status-icon" />
            Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="status-badge rejected">
            <FaUserTimes className="status-icon" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="status-badge pending">
            <FaUserClock className="status-icon" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="record-management">
      <div className="page-header">
        <h1 className="page-title">User Records</h1>
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-controls">
            <div className="search-type-selector">
              <select 
                value={searchType} 
                onChange={(e) => setSearchType(e.target.value)}
                className="search-type-select"
              >
                <option value="name">Search by Name</option>
                <option value="id">Search by ID</option>
                <option value="facehash">Search by Facemesh Hash</option>
              </select>
            </div>
            <div className="search-input-container">
              <input
                type="text"
                placeholder={`Search by ${searchType}...`}
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
              Search
            </button>
          </div>
          <div className="search-stats">
            {!loading && (
              <span className="results-count">
                Showing {users.length} of {totalUsers} total users
              </span>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Serial No.</th>
              <th>Name</th>
              <th>Unique ID</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="loading-cell">
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id} className="data-row">
                  <td>{(currentPage - 1) * usersPerPage + index + 1}</td>
                  <td>{user.name}</td>
                  <td>{user.uniqueId}</td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>{formatDate(user.lastUpdated)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="action-button view"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleViewUser({...user, isEdit: true})}
                        className="action-button edit"
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
              <FaChevronLeft />
              <span>Previous</span>
            </button>
            <div className="pagination-pages">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
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
                    className={`pagination-page-button ${currentPage === pageNum ? 'active' : ''}`}
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
              aria-label="Next page"
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
