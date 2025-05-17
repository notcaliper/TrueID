import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaUserCheck, FaUserTimes, FaFingerprint, 
         FaSpinner, FaExclamationTriangle, FaClipboard, 
         FaCopy, FaExchangeAlt, FaServer, FaCheckCircle } from 'react-icons/fa';
import ApiService from '../services/ApiService';

const UserDetailModal = ({ userId, onClose }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState({
    details: false,
    verify: false,
    blockchain: false
  });
  const [activeTab, setActiveTab] = useState('details');
  const [verificationStatus, setVerificationStatus] = useState({
    loading: false,
    success: false,
    error: null
  });
  const [blockchainStatus, setBlockchainStatus] = useState({
    loading: false,
    success: false,
    error: null,
    txHash: null
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    const checkApiEndpoints = async () => {
      try {
        // Check if the required endpoints are available
        const userDetailsHealth = await ApiService.checkEndpointHealth(`/admin/users/${userId}`);
        const verifyEndpointHealth = await ApiService.checkEndpointHealth(`/admin/users/${userId}/verify`);
        const blockchainEndpointHealth = await ApiService.checkEndpointHealth('/blockchain/record');
        
        setApiStatus({
          details: userDetailsHealth,
          verify: verifyEndpointHealth,
          blockchain: blockchainEndpointHealth
        });
        
        if (userDetailsHealth) {
          fetchUserDetails();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking API endpoints:', error);
        setLoading(false);
      }
    };
    
    checkApiEndpoints();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const result = await ApiService.getUserById(userId);
      let userInfo = null;
      
      // Extract user data from various possible response formats
      if (result.user) {
        userInfo = result.user;
      } else if (result.data && result.data.user) {
        userInfo = result.data.user;
      } else if (result.success && result.data) {
        userInfo = result.data;
      } else {
        userInfo = result;
      }
      
      // Process biometric data if available
      if (result.biometricData || result.data?.biometricData) {
        const biometricData = result.biometricData || result.data?.biometricData;
        userInfo.has_biometric = true;
        userInfo.biometricData = biometricData;
        
        // If we have biometric data, extract the hash for display
        if (Array.isArray(biometricData) && biometricData.length > 0) {
          // Check for different field formats
          if (biometricData[0].facemesh_hash) {
            userInfo.biometricHash = biometricData[0].facemesh_hash;
          } else if (biometricData[0].biometricHash) {
            userInfo.biometricHash = biometricData[0].biometricHash;
          } else {
            console.log("Missing facemesh_hash in biometric data", biometricData[0]);
            // Create a placeholder hash
            userInfo.biometricHash = "0x" + "0".repeat(64);
          }
        }
      }
      
      // Process professional records if available
      if (result.professionalRecords || result.data?.professionalRecords) {
        userInfo.professionalRecords = result.professionalRecords || result.data?.professionalRecords;
      }
      
      // Set status data correctly
      if (userInfo.verification_status) {
        // Convert to uppercase if it's not already
        userInfo.verification_status = userInfo.verification_status.toUpperCase();
      } else if (userInfo.status) {
        // Use status if verification_status is not available
        userInfo.verification_status = userInfo.status.toUpperCase();
      }
      
      setUserData(userInfo);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async () => {
    if (!apiStatus.verify) return;
    
    setVerificationStatus({ loading: true, success: false, error: null });
    
    try {
      const result = await ApiService.verifyUser(userId);
      
      if (result.success) {
        setVerificationStatus({ loading: false, success: true, error: null });
        fetchUserDetails(); // Refresh user data
      } else {
        setVerificationStatus({ 
          loading: false, 
          success: false, 
          error: result.error || 'Verification failed' 
        });
      }
    } catch (error) {
      setVerificationStatus({ 
        loading: false, 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      });
    }
  };

  const handleRejectUser = async () => {
    if (!apiStatus.verify || !rejectionReason) return;
    
    setVerificationStatus({ loading: true, success: false, error: null });
    
    try {
      const result = await ApiService.rejectIdentity(userId, rejectionReason);
      
      if (result.success) {
        setVerificationStatus({ loading: false, success: true, error: null });
        setShowRejectionForm(false);
        fetchUserDetails(); // Refresh user data
      } else {
        setVerificationStatus({ 
          loading: false, 
          success: false, 
          error: result.error || 'Rejection failed' 
        });
      }
    } catch (error) {
      setVerificationStatus({ 
        loading: false, 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      });
    }
  };

  const handlePushToBlockchain = async () => {
    if (!apiStatus.blockchain) return;
    
    setBlockchainStatus({ loading: true, success: false, error: null, txHash: null });
    
    try {
      // Extract biometric hash from either the direct property or the biometric data array
      const biometricHash = userData.biometricData && userData.biometricData.length > 0 ? 
                            userData.biometricData[0].facemesh_hash : 
                            (userData.facemesh_hash || '0x0000000000000000000000000000000000000000000000000000000000000000');
      
      const result = await ApiService.pushRecordToBlockchain(userId, {
        userId: userId,
        biometricHash: biometricHash,
        verificationData: {
          verifiedAt: userData.verified_at || new Date().toISOString(),
          verifiedBy: userData.verified_by_username || 'admin'
        }
      });
      
      if (result.success) {
        setBlockchainStatus({ 
          loading: false, 
          success: true, 
          error: null, 
          txHash: result.data?.txHash || result.data?.transaction?.hash || '0x0000000000000000000000000000000000000000'
        });
        fetchUserDetails(); // Refresh user data
      } else {
        setBlockchainStatus({ 
          loading: false, 
          success: false, 
          error: result.error || 'Failed to push to blockchain',
          txHash: null
        });
      }
    } catch (error) {
      setBlockchainStatus({ 
        loading: false, 
        success: false, 
        error: error.message || 'An unexpected error occurred',
        txHash: null
      });
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedText(type);
        setTimeout(() => setCopiedText(''), 2000);
      },
      (err) => console.error('Could not copy text: ', err)
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              {loading ? 'Loading User...' : userData?.name || 'User Details'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <FaTimes className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* API Status Indicator */}
          {!loading && !apiStatus.details && (
            <div className="p-4 bg-red-50 border-b border-red-100">
              <div className="flex items-center text-red-600">
                <FaExclamationTriangle className="h-5 w-5 mr-2" />
                <span>User details API is unavailable. Some features may not work correctly.</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          {!loading && apiStatus.details && (
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-6 py-3 font-medium text-sm ${
                    activeTab === 'details'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  User Details
                </button>
                <button
                  onClick={() => setActiveTab('verification')}
                  className={`px-6 py-3 font-medium text-sm ${
                    activeTab === 'verification'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Verification
                </button>
                <button
                  onClick={() => setActiveTab('blockchain')}
                  className={`px-6 py-3 font-medium text-sm ${
                    activeTab === 'blockchain'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Blockchain
                </button>
              </div>
            </div>
          )}

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <FaSpinner className="animate-spin h-10 w-10 text-indigo-600" />
              </div>
            ) : !apiStatus.details ? (
              <div className="text-center py-12">
                <FaExclamationTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Unable to load user data</h3>
                <p className="text-gray-600">
                  The API endpoint for user details is currently unavailable.
                  Please try again later.
                </p>
              </div>
            ) : !userData ? (
              <div className="text-center py-12">
                <FaExclamationTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">User not found</h3>
                <p className="text-gray-600">
                  The requested user could not be found or you may not have permission
                  to access this record.
                </p>
              </div>
            ) : (
              <>
                {/* User Details Tab */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                      <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 text-4xl font-bold">
                        {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold">{userData.name}</h3>
                        <p className="text-gray-600">{userData.email}</p>
                        <div className="mt-2 flex items-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium 
                              ${userData.status === 'verified' ? 'bg-green-100 text-green-800' : 
                                userData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                userData.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                userData.status === 'onchain' ? 'bg-purple-100 text-purple-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {userData?.status ? (userData.status.charAt(0).toUpperCase() + userData.status.slice(1)) : 'Unknown'}
                          </span>
                          
                          {userData.onBlockchain && (
                            <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              On Blockchain
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Personal Information</h4>
                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                          <div>
                            <p className="text-xs text-gray-500">Full Name</p>
                            <p className="font-medium">{userData.name || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">ID Number</p>
                            <p className="font-medium">{userData.government_id || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Phone Number</p>
                            <p className="font-medium">{userData.phone || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="font-medium">{userData.wallet_address ? `Wallet: ${userData.wallet_address}` : 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">System Information</h4>
                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                          <div>
                            <p className="text-xs text-gray-500">Registration Date</p>
                            <p className="font-medium">
                              {userData.created_at ? new Date(userData.created_at).toLocaleDateString() : 'Not available'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Last Updated</p>
                            <p className="font-medium">
                              {userData.updated_at ? new Date(userData.updated_at).toLocaleDateString() : 'Not available'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Biometric Data</p>
                            <p className="font-medium flex items-center">
                              {userData.has_biometric || (userData.biometricData && userData.biometricData.length > 0) ? 
                                'Provided' : 'Not provided'}
                              {(userData.has_biometric || (userData.biometricData && userData.biometricData.length > 0)) && (
                                <FaFingerprint className="ml-1 text-indigo-600" />
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {userData.biometricHash && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Biometric Hash</h4>
                        <div className="bg-gray-800 text-gray-100 p-3 rounded-lg font-mono text-xs flex items-center justify-between overflow-auto">
                          <div className="truncate">
                            {userData.biometricHash}
                          </div>
                          <button
                            onClick={() => copyToClipboard(userData.biometricHash, 'biometricHash')}
                            className="ml-2 p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 flex-shrink-0"
                          >
                            {copiedText === 'biometricHash' ? (
                              <FaCheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <FaCopy className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Verification Tab */}
                {activeTab === 'verification' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Verification Status</h3>
                      
                      <div className="flex items-center">
                        <FaServer className={`h-4 w-4 mr-1 ${apiStatus.verify ? 'text-green-500' : 'text-red-500'}`} />
                        <span className="text-sm text-gray-600">
                          API {apiStatus.verify ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-4">
                        <div
                          className={`h-12 w-12 rounded-full flex items-center justify-center mr-4 
                            ${userData.verification_status === 'VERIFIED' ? 'bg-green-100 text-green-800' : 
                              userData.verification_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                              userData.verification_status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {userData.verification_status === 'VERIFIED' ? <FaUserCheck className="h-6 w-6" /> : 
                            userData.verification_status === 'REJECTED' ? <FaUserTimes className="h-6 w-6" /> : 
                            <FaFingerprint className="h-6 w-6" />
                          }
                        </div>
                        
                        <div>
                          <h4 className="font-medium">
                            {userData.verification_status === 'VERIFIED' ? 'User is Verified' : 
                              userData.verification_status === 'PENDING' ? 'Pending Verification' : 
                              userData.verification_status === 'REJECTED' ? 'Verification Rejected' : 
                              'Unknown Status'
                            }
                          </h4>
                          <p className="text-sm text-gray-600">
                            {userData.verification_status === 'VERIFIED' ? 'User identity has been confirmed.' : 
                              userData.verification_status === 'PENDING' ? 'User is waiting for identity verification.' : 
                              userData.verification_status === 'REJECTED' ? `Reason: ${userData.rejectionReason || 'None provided'}` : 
                              'Status information unavailable.'
                            }
                          </p>
                        </div>
                      </div>
                      
                      {/* Verification Actions */}
                      {userData.verification_status === 'pending' && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h4 className="font-medium mb-3">Verification Actions</h4>
                          
                          {verificationStatus.error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
                              <div className="flex items-center">
                                <FaExclamationTriangle className="h-4 w-4 mr-2" />
                                <span>{verificationStatus.error}</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={handleVerifyUser}
                              disabled={!apiStatus.verify || verificationStatus.loading}
                              className={`px-4 py-2 rounded-lg flex items-center ${
                                !apiStatus.verify || verificationStatus.loading
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {verificationStatus.loading ? (
                                <FaSpinner className="animate-spin h-4 w-4 mr-2" />
                              ) : (
                                <FaUserCheck className="h-4 w-4 mr-2" />
                              )}
                              {verificationStatus.loading ? 'Processing...' : 'Approve & Verify'}
                            </button>
                            
                            {!showRejectionForm ? (
                              <button
                                onClick={() => setShowRejectionForm(true)}
                                disabled={!apiStatus.verify || verificationStatus.loading}
                                className={`px-4 py-2 rounded-lg flex items-center ${
                                  !apiStatus.verify || verificationStatus.loading
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                              >
                                <FaUserTimes className="h-4 w-4 mr-2" />
                                Reject
                              </button>
                            ) : (
                              <div className="w-full mt-3">
                                <div className="mb-3">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reason for Rejection
                                  </label>
                                  <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    rows="3"
                                    placeholder="Provide a reason for rejection..."
                                  ></textarea>
                                </div>
                                <div className="flex space-x-3">
                                  <button
                                    onClick={handleRejectUser}
                                    disabled={!apiStatus.verify || !rejectionReason || verificationStatus.loading}
                                    className={`px-4 py-2 rounded-lg flex items-center ${
                                      !apiStatus.verify || !rejectionReason || verificationStatus.loading
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                                  >
                                    {verificationStatus.loading ? (
                                      <FaSpinner className="animate-spin h-4 w-4 mr-2" />
                                    ) : (
                                      <FaUserTimes className="h-4 w-4 mr-2" />
                                    )}
                                    Confirm Rejection
                                  </button>
                                  <button
                                    onClick={() => setShowRejectionForm(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Blockchain Tab */}
                {activeTab === 'blockchain' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Blockchain Status</h3>
                      
                      <div className="flex items-center">
                        <FaServer className={`h-4 w-4 mr-1 ${apiStatus.blockchain ? 'text-green-500' : 'text-red-500'}`} />
                        <span className="text-sm text-gray-600">
                          API {apiStatus.blockchain ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center mr-4 
                          ${userData.blockchain_tx_hash ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}
                        >
                          <FaExchangeAlt className="h-6 w-6" />
                        </div>
                        
                        <div>
                          <h4 className="font-medium">
                            {userData.blockchain_tx_hash ? 'Published to Blockchain' : 'Not on Blockchain'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {userData.blockchain_tx_hash 
                              ? 'User identity has been recorded on the blockchain.' 
                              : 'User identity has not been recorded on the blockchain yet.'}
                          </p>
                        </div>
                      </div>
                      
                      {userData.blockchain_tx_hash && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Transaction Hash</h4>
                          <div className="bg-gray-800 text-gray-100 p-3 rounded-lg font-mono text-xs flex items-center justify-between overflow-auto">
                            <div className="truncate">
                              {userData.blockchain_tx_hash}
                            </div>
                            <button
                              onClick={() => copyToClipboard(userData.blockchain_tx_hash, 'txHash')}
                              className="ml-2 p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 flex-shrink-0"
                            >
                              {copiedText === 'txHash' ? (
                                <FaCheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <FaCopy className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                          
                          <div className="mt-3 flex justify-end">
                            <a
                              href={`https://mumbai.polygonscan.com/tx/${userData.blockchain_tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                            >
                              View on PolygonScan
                              <svg className="h-4 w-4 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {blockchainStatus.txHash && (
                        <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-lg">
                          <h4 className="font-medium flex items-center">
                            <FaCheckCircle className="h-4 w-4 mr-1" />
                            Successfully Published to Blockchain
                          </h4>
                          <div className="mt-2">
                            <p className="text-xs text-green-700 mb-1">Transaction Hash:</p>
                            <div className="bg-green-100 p-2 rounded font-mono text-xs flex items-center justify-between overflow-auto">
                              <div className="truncate">
                                {blockchainStatus.txHash}
                              </div>
                              <button
                                onClick={() => copyToClipboard(blockchainStatus.txHash, 'newTxHash')}
                                className="ml-2 p-1 rounded-lg bg-green-200 hover:bg-green-300 flex-shrink-0"
                              >
                                {copiedText === 'newTxHash' ? (
                                  <FaCheckCircle className="h-4 w-4 text-green-700" />
                                ) : (
                                  <FaCopy className="h-4 w-4 text-green-700" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {blockchainStatus.error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-lg">
                          <div className="flex items-center">
                            <FaExclamationTriangle className="h-4 w-4 mr-1" />
                            <h4 className="font-medium">Blockchain Operation Failed</h4>
                          </div>
                          <p className="text-sm mt-1">{blockchainStatus.error}</p>
                        </div>
                      )}
                      
                      {/* Blockchain Actions */}
                      {userData.verification_status === 'VERIFIED' && !userData.blockchain_tx_hash && !blockchainStatus.txHash && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h4 className="font-medium mb-3">Blockchain Actions</h4>
                          
                          <button
                            onClick={handlePushToBlockchain}
                            disabled={!apiStatus.blockchain || blockchainStatus.loading}
                            className={`px-4 py-2 rounded-lg flex items-center ${
                              !apiStatus.blockchain || blockchainStatus.loading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                          >
                            {blockchainStatus.loading ? (
                              <FaSpinner className="animate-spin h-4 w-4 mr-2" />
                            ) : (
                              <FaExchangeAlt className="h-4 w-4 mr-2" />
                            )}
                            {blockchainStatus.loading ? 'Processing...' : 'Push to Blockchain'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
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

export default UserDetailModal;
