import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaExchangeAlt, FaSpinner, FaExclamationTriangle, 
         FaSearch, FaFilter, FaServer, FaChevronLeft, 
         FaChevronRight, FaCopy, FaCheckCircle, FaEye } from 'react-icons/fa';
import ApiService from '../services/ApiService';
import TransactionDetailModal from '../components/TransactionDetailModal';

const BlockchainHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTx, setSelectedTx] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentNetwork, setCurrentNetwork] = useState('mumbai');
  const [copiedTxHash, setCopiedTxHash] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
  const [apiCheckPerformed, setApiCheckPerformed] = useState(false);

  useEffect(() => {
    const checkApiHealth = async () => {
      // Check if endpoint exists before attempting to fetch data
      const isHealthy = await ApiService.checkEndpointHealth('/blockchain/transactions');
      setApiAvailable(isHealthy);
      setApiCheckPerformed(true);
      
      if (isHealthy) {
        fetchTransactions();
      } else {
        setLoading(false);
      }
    };
    
    checkApiHealth();
  }, [currentPage, filters, currentNetwork]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const result = await ApiService.getBlockchainTransactions(
        currentPage,
        10,
        {
          search: searchQuery,
          status: filters.status,
          type: filters.type,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          network: currentNetwork
        }
      );
      
      if (result.success) {
        setTransactions(result.data.transactions || []);
        setTotalPages(result.data.totalPages || 1);
      } else {
        console.error('Failed to fetch transactions:', result.error);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page
    fetchTransactions();
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    setCurrentPage(1); // Reset to first page
  };

  const handleNetworkChange = (network) => {
    setCurrentNetwork(network);
    setCurrentPage(1); // Reset to first page
  };

  const handleTxSelect = (txHash) => {
    setSelectedTx(txHash);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTx(null);
  };

  const copyToClipboard = (txHash) => {
    navigator.clipboard.writeText(txHash).then(
      () => {
        setCopiedTxHash(txHash);
        setTimeout(() => setCopiedTxHash(''), 2000);
      },
      (err) => console.error('Could not copy text: ', err)
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
            Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 font-medium">
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 font-medium">
            Failed
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

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'registerIdentity':
        return 'Register Identity';
      case 'updateIdentity':
        return 'Update Identity';
      case 'revokeIdentity':
        return 'Revoke Identity';
      case 'verifyIdentity':
        return 'Verify Identity';
      default:
        return type || 'Unknown';
    }
  };

  // Loading state - show skeleton loader
  if (loading && !apiCheckPerformed) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Blockchain Transactions</h1>
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
          <h1 className="text-2xl font-bold text-gray-800">Blockchain Transactions</h1>
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
            <h2 className="text-xl font-semibold mb-2">Blockchain API is unavailable</h2>
            <p className="text-gray-600 text-center mb-4">
              We're unable to connect to the Blockchain service. The server might be
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
        <h1 className="text-2xl font-bold text-gray-800">Blockchain Transactions</h1>
        
        <div className="flex items-center">
          <div className={`mr-4 flex items-center ${apiAvailable ? 'text-green-500' : 'text-red-500'}`}>
            <FaServer className="mr-1" />
            <span className="text-sm">{apiAvailable ? 'API Online' : 'API Offline'}</span>
          </div>
          
          <button
            onClick={fetchTransactions}
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
        {/* Network Selection */}
        <div className="bg-indigo-50 p-3 border-b border-indigo-100 flex items-center justify-between">
          <div className="font-medium text-indigo-800">Network:</div>
          <div className="flex">
            <button
              onClick={() => handleNetworkChange('mumbai')}
              className={`px-3 py-1 rounded-l-lg text-sm font-medium ${
                currentNetwork === 'mumbai'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              Mumbai Testnet
            </button>
            <button
              onClick={() => handleNetworkChange('local')}
              className={`px-3 py-1 rounded-r-lg text-sm font-medium ${
                currentNetwork === 'local'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              Local Network
            </button>
          </div>
        </div>
      
        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <form onSubmit={handleSearch} className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by transaction hash or user ID..."
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
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Transaction Types</option>
                <option value="registerIdentity">Register Identity</option>
                <option value="updateIdentity">Update Identity</option>
                <option value="revokeIdentity">Revoke Identity</option>
                <option value="verifyIdentity">Verify Identity</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction Hash
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="h-4 bg-gray-200 rounded w-1/4 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.hash} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="font-mono text-sm text-gray-900 truncate max-w-xs">
                          {tx.hash}
                        </div>
                        <button
                          onClick={() => copyToClipboard(tx.hash)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          {copiedTxHash === tx.hash ? (
                            <FaCheckCircle className="text-green-500" />
                          ) : (
                            <FaCopy />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getTransactionTypeLabel(tx.type)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tx.userId || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleTxSelect(tx.hash)}
                          className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100"
                          title="View Details"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <a
                          href={`https://${currentNetwork === 'mumbai' ? 'mumbai.' : ''}polygonscan.com/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                          title="View on PolygonScan"
                        >
                          <FaExchangeAlt className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {transactions.length > 0 && totalPages > 1 && (
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
      
      {/* Transaction Detail Modal */}
      {showModal && selectedTx && (
        <TransactionDetailModal
          txHash={selectedTx}
          network={currentNetwork}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default BlockchainHistory; 