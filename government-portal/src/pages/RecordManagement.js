import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUserEdit, FaUserCheck, FaTimesCircle, FaExclamationTriangle, 
         FaSearch, FaFilter, FaSpinner, FaEllipsisH, FaChevronLeft, 
         FaChevronRight, FaServer } from 'react-icons/fa';
import ApiService from '../services/ApiService';
import UserDetailModal from '../components/UserDetailModal';

const RecordManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'dateCreated',
    sortOrder: 'desc'
  });
  const [apiCheckPerformed, setApiCheckPerformed] = useState(false);

  useEffect(() => {
    const checkApiHealth = async () => {
      // Check if endpoint exists before attempting to fetch data
      const isHealthy = await ApiService.checkEndpointHealth('/admin/users');
      setApiAvailable(isHealthy);
      setApiCheckPerformed(true);
      
      if (isHealthy) {
        fetchUsers();
      } else {
        setLoading(false);
      }
    };
    
    checkApiHealth();
  }, [currentPage, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await ApiService.getUsers(
        currentPage,
        10,
        {
          search: searchQuery,
          status: filters.status,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder
        }
      );
      
      if (result.success) {
        // Map database fields to frontend display fields
        const mappedUsers = (result.data.users || []).map(user => ({
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email || 'N/A',
          uniqueId: user.government_id || 'N/A',
          location: user.location || (user.wallet_address ? `Wallet: ${user.wallet_address}` : 'Unknown location'),
          status: user.verification_status?.toLowerCase() || user.status || 'unknown',
          createdAt: user.created_at || user.createdAt,
          has_biometric: user.has_biometric
        }));
        
        setUsers(mappedUsers);
        setTotalPages(result.data.totalPages || result.data.pagination?.pages || 1);
      } else {
        console.error('Failed to fetch users:', result.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page
    fetchUsers();
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    setCurrentPage(1); // Reset to first page
  };

  const handleUserSelect = async (userId) => {
    setSelectedUser(userId);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    // Refresh user list after modal is closed to reflect any changes
    fetchUsers();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 font-medium">
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 font-medium">
            Rejected
          </span>
        );
      case 'onchain':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 font-medium">
            On Blockchain
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 font-medium">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  // Loading state - show skeleton loader
  if (loading && !apiCheckPerformed) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">User Records</h1>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // API unavailable state
  if (!apiAvailable && apiCheckPerformed) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">User Records</h1>
          <div className="flex items-center text-red-500">
            <FaServer className="mr-2" />
            <span>API Unavailable</span>
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex flex-col items-center justify-center p-6">
            <FaExclamationTriangle className="text-red-500 text-5xl mb-4" />
            <h2 className="text-xl font-semibold mb-2">User Management API is unavailable</h2>
            <p className="text-gray-600 text-center mb-4">
              We're unable to connect to the User Management service. The server might be
              down or experiencing issues.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
            >
              <FaSpinner className="mr-2" />
              Retry Connection
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Records</h1>
        
        <div className="flex items-center">
          <div className={`mr-4 flex items-center ${apiAvailable ? 'text-green-500' : 'text-red-500'}`}>
            <FaServer className="mr-1" />
            <span className="text-sm">{apiAvailable ? 'API Online' : 'API Offline'}</span>
          </div>
          
          <button
            onClick={fetchUsers}
            disabled={loading || !apiAvailable}
            className={`px-4 py-2 rounded-lg flex items-center ${
              loading || !apiAvailable
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Loading...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
      >
        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <form onSubmit={handleSearch} className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, ID, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <button
                  type="submit"
                  className="absolute right-2 top-2 px-2 py-1 bg-indigo-600 text-white rounded text-xs"
                >
                  Search
                </button>
              </div>
            </form>
            
            <div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="onchain">On Blockchain</option>
              </select>
            </div>
            
            <div>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="dateCreated-desc">Newest First</option>
                <option value="dateCreated-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="status-asc">Status (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID/Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="h-4 bg-gray-200 rounded w-1/4 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.uniqueId || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{user.location || 'Unknown location'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleUserSelect(user.id)}
                          className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100"
                        >
                          <FaUserEdit className="w-4 h-4" />
                        </button>
                        {user.status === 'pending' && (
                          <button
                            onClick={() => handleUserSelect(user.id)}
                            className="px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                          >
                            <FaUserCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button className="px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100">
                          <FaEllipsisH className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {users.length > 0 && totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md flex items-center ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaChevronLeft className="mr-1 w-3 h-3" />
                Previous
              </button>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md flex items-center ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Next
                <FaChevronRight className="ml-1 w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
      
      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <UserDetailModal
          userId={selectedUser}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default RecordManagement;
