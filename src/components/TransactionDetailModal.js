import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaExchangeAlt, FaSpinner, FaExclamationTriangle, 
         FaClipboard, FaCopy, FaServer, FaCheckCircle, FaUser, 
         FaCode, FaClock, FaLink } from 'react-icons/fa';
import ApiService from '../services/ApiService';

const TransactionDetailModal = ({ txHash, network, onClose }) => {
  const [txData, setTxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [expandedFields, setExpandedFields] = useState({
    input: false,
    logs: false
  });

  useEffect(() => {
    const checkApiEndpoint = async () => {
      try {
        // Check if the endpoint is available
        const endpointHealth = await ApiService.checkEndpointHealth(`/blockchain/transactions/${txHash}`);
        setApiAvailable(endpointHealth);
        
        if (endpointHealth) {
          fetchTransactionDetails();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking API endpoint:', error);
        setLoading(false);
      }
    };
    
    checkApiEndpoint();
  }, [txHash, network]);

  const fetchTransactionDetails = async () => {
    try {
      const result = await ApiService.getTransactionDetails(txHash, network);
      if (result.success) {
        setTxData(result.data);
      } else {
        console.error('Failed to fetch transaction details:', result.error);
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedField(field);
        setTimeout(() => setCopiedField(''), 2000);
      },
      (err) => console.error('Could not copy text: ', err)
    );
  };

  const toggleExpand = (field) => {
    setExpandedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 text-green-800 border-green-100';
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-100';
      case 'failed':
        return 'bg-red-50 text-red-800 border-red-100';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-100';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <FaExchangeAlt className="mr-2 text-indigo-600" />
              {loading ? 'Loading Transaction...' : 'Transaction Details'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <FaTimes className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* API Status Indicator */}
          {!loading && !apiAvailable && (
            <div className="p-4 bg-red-50 border-b border-red-100">
              <div className="flex items-center text-red-600">
                <FaExclamationTriangle className="h-5 w-5 mr-2" />
                <span>Blockchain API is unavailable. Unable to fetch transaction details.</span>
              </div>
            </div>
          )}

          {/* Network Indicator */}
          <div className={`p-3 border-b ${network === 'mumbai' ? 'bg-purple-50 border-purple-100' : 'bg-blue-50 border-blue-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaLink className={`mr-2 ${network === 'mumbai' ? 'text-purple-600' : 'text-blue-600'}`} />
                <span className={`font-medium ${network === 'mumbai' ? 'text-purple-800' : 'text-blue-800'}`}>
                  Network: {network === 'mumbai' ? 'Polygon Mumbai Testnet' : 'Local Development Network'}
                </span>
              </div>
              
              {txHash && network === 'mumbai' && (
                <a
                  href={`https://mumbai.polygonscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  View on PolygonScan
                  <svg className="h-4 w-4 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <FaSpinner className="animate-spin h-10 w-10 text-indigo-600" />
              </div>
            ) : !apiAvailable ? (
              <div className="text-center py-12">
                <FaExclamationTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Unable to load transaction data</h3>
                <p className="text-gray-600">
                  The API endpoint for blockchain transactions is currently unavailable.
                  Please try again later.
                </p>
              </div>
            ) : !txData ? (
              <div className="text-center py-12">
                <FaExclamationTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Transaction not found</h3>
                <p className="text-gray-600">
                  The requested transaction could not be found on the {network} network.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Transaction Hash */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Transaction Hash</h3>
                  <div className="bg-gray-800 text-gray-100 p-3 rounded-lg font-mono text-xs flex items-center justify-between overflow-auto">
                    <div className="truncate">
                      {txHash}
                    </div>
                    <button
                      onClick={() => copyToClipboard(txHash, 'txHash')}
                      className="ml-2 p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 flex-shrink-0"
                    >
                      {copiedField === 'txHash' ? (
                        <FaCheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <FaCopy className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Transaction Status */}
                <div className={`p-4 rounded-lg border ${getStatusColor(txData.status)}`}>
                  <div className="flex items-center">
                    <div className="mr-4">
                      {txData.status === 'confirmed' ? (
                        <FaCheckCircle className="h-6 w-6 text-green-500" />
                      ) : txData.status === 'pending' ? (
                        <FaSpinner className="h-6 w-6 text-yellow-500" />
                      ) : (
                        <FaExclamationTriangle className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">
                        Status: {txData.status.charAt(0).toUpperCase() + txData.status.slice(1)}
                      </h3>
                      {txData.status === 'confirmed' && txData.confirmations && (
                        <p className="text-sm">Confirmations: {txData.confirmations}</p>
                      )}
                      {txData.status === 'failed' && txData.error && (
                        <p className="text-sm mt-1 text-red-700">{txData.error}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Transaction Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Transaction Type</h3>
                      <p className="font-medium flex items-center">
                        <FaCode className="mr-2 text-indigo-600" />
                        {txData.type === 'registerIdentity' ? 'Register Identity' :
                         txData.type === 'updateIdentity' ? 'Update Identity' :
                         txData.type === 'revokeIdentity' ? 'Revoke Identity' :
                         txData.type === 'verifyIdentity' ? 'Verify Identity' :
                         txData.type || 'Unknown Type'}
                      </p>
                    </div>
                    
                    {txData.userId && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Associated User</h3>
                        <p className="font-medium flex items-center">
                          <FaUser className="mr-2 text-indigo-600" />
                          {txData.userName || txData.userId}
                        </p>
                      </div>
                    )}
                    
                    {txData.contract && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Contract</h3>
                        <div className="bg-gray-50 p-3 rounded-lg font-mono text-xs flex items-center justify-between overflow-auto">
                          <div className="truncate">
                            {txData.contract}
                          </div>
                          <button
                            onClick={() => copyToClipboard(txData.contract, 'contract')}
                            className="ml-2 p-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 flex-shrink-0"
                          >
                            {copiedField === 'contract' ? (
                              <FaCheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <FaCopy className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Right Column */}
                  <div className="space-y-4">
                    {txData.timestamp && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Timestamp</h3>
                        <p className="font-medium flex items-center">
                          <FaClock className="mr-2 text-indigo-600" />
                          {formatTimestamp(txData.timestamp)}
                        </p>
                      </div>
                    )}
                    
                    {txData.gasUsed && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Gas Used</h3>
                        <p className="font-medium">{txData.gasUsed.toLocaleString()} wei</p>
                      </div>
                    )}
                    
                    {txData.blockNumber && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Block Number</h3>
                        <p className="font-medium">{txData.blockNumber.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Transaction Input Data */}
                {txData.input && (
                  <div>
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleExpand('input')}
                    >
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Input Data</h3>
                      <button className="text-gray-500 hover:text-gray-700">
                        {expandedFields.input ? 'Collapse' : 'Expand'}
                      </button>
                    </div>
                    
                    <div className={`bg-gray-50 p-3 rounded-lg font-mono text-xs overflow-auto transition-all ${
                      expandedFields.input ? 'max-h-60' : 'max-h-8'
                    }`}>
                      {txData.input}
                    </div>
                  </div>
                )}
                
                {/* Transaction Logs */}
                {txData.logs && txData.logs.length > 0 && (
                  <div>
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleExpand('logs')}
                    >
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Event Logs</h3>
                      <button className="text-gray-500 hover:text-gray-700">
                        {expandedFields.logs ? 'Collapse' : 'Expand'}
                      </button>
                    </div>
                    
                    <div className={`overflow-auto transition-all ${
                      expandedFields.logs ? 'max-h-80' : 'max-h-8'
                    }`}>
                      {txData.logs.map((log, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg mb-2 font-mono text-xs">
                          <div className="font-bold mb-1">Event: {log.name || 'Unknown Event'}</div>
                          <div className="text-xs">{JSON.stringify(log.data || {}, null, 2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Modal Footer */}
          <div className="border-t border-gray-200 p-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TransactionDetailModal; 