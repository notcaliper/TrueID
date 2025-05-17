import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExchangeAlt, FaServer, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import ApiService from '../services/ApiService';

const NetworkSwitcher = () => {
  const [currentNetwork, setCurrentNetwork] = useState('Mumbai');
  const [apiHealthStatus, setApiHealthStatus] = useState({
    status: false,
    switch: false
  });
  const [loading, setLoading] = useState(true);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [targetNetwork, setTargetNetwork] = useState('');
  
  useEffect(() => {
    const checkApiEndpoints = async () => {
      try {
        // Check if the network status and switch endpoints are available
        const statusEndpoint = await ApiService.checkEndpointHealth('/network/status');
        const switchEndpoint = await ApiService.checkEndpointHealth('/network/switch');
        
        setApiHealthStatus({
          status: statusEndpoint,
          switch: switchEndpoint
        });
        
        if (statusEndpoint) {
          const result = await ApiService.getNetworkStatus();
          if (result.success) {
            setCurrentNetwork(result.data.currentNetwork);
          }
        }
      } catch (error) {
        console.error('Error checking network endpoints:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkApiEndpoints();
  }, []);
  
  const handleNetworkSwitch = (network) => {
    if (!apiHealthStatus.switch) {
      // API endpoint is not available
      return;
    }
    
    setTargetNetwork(network);
    setShowConfirmModal(true);
  };
  
  const confirmNetworkSwitch = async () => {
    if (!targetNetwork || !apiHealthStatus.switch) return;
    
    try {
      setSwitchingNetwork(true);
      setShowConfirmModal(false);
      
      const result = await ApiService.switchNetwork({ network: targetNetwork });
      
      if (result.success) {
        setCurrentNetwork(targetNetwork);
      }
    } catch (error) {
      console.error('Error switching network:', error);
    } finally {
      setSwitchingNetwork(false);
    }
  };
  
  const cancelNetworkSwitch = () => {
    setShowConfirmModal(false);
    setTargetNetwork('');
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center justify-center space-x-2 text-gray-500 h-48">
          <FaSpinner className="animate-spin h-6 w-6" />
          <span>Loading network status...</span>
        </div>
      </div>
    );
  }
  
  if (!apiHealthStatus.status) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center mb-4 text-xl font-bold">
          <FaExchangeAlt className="mr-2" />
          <h3>Network Switcher</h3>
        </div>
        
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-2" />
            <p className="text-sm text-red-600">
              Network API is currently unavailable. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center text-xl font-bold">
          <FaExchangeAlt className="mr-2" />
          <h3>Network Switcher</h3>
        </div>
        
        <div className="flex items-center">
          <FaServer className={`mr-1 ${apiHealthStatus.switch ? 'text-green-500' : 'text-red-500'}`} />
          <span className="text-sm">
            {apiHealthStatus.switch ? 'API Available' : 'API Unavailable'}
          </span>
        </div>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-1">Current Network:</p>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span className="font-medium">{currentNetwork}</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {switchingNetwork ? (
          <div className="bg-indigo-50 p-4 rounded-lg text-center">
            <FaSpinner className="animate-spin h-5 w-5 mx-auto mb-2 text-indigo-600" />
            <p className="text-indigo-600">Switching network, please wait...</p>
          </div>
        ) : (
          <>
            <button
              onClick={() => handleNetworkSwitch('Mumbai')}
              disabled={!apiHealthStatus.switch || currentNetwork === 'Mumbai'}
              className={`w-full py-3 px-4 rounded-lg flex items-center justify-between ${
                currentNetwork === 'Mumbai'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : !apiHealthStatus.switch
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                <span>Mumbai Testnet</span>
              </div>
              {currentNetwork === 'Mumbai' && <FaCheckCircle className="text-green-500" />}
            </button>
            
            <button
              onClick={() => handleNetworkSwitch('Local')}
              disabled={!apiHealthStatus.switch || currentNetwork === 'Local'}
              className={`w-full py-3 px-4 rounded-lg flex items-center justify-between ${
                currentNetwork === 'Local'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : !apiHealthStatus.switch
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                <span>Local Development</span>
              </div>
              {currentNetwork === 'Local' && <FaCheckCircle className="text-green-500" />}
            </button>
          </>
        )}
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>
          Switching networks will change the connection to the blockchain. This may affect
          transaction history and pending transactions.
        </p>
      </div>
      
      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 m-4"
            >
              <h3 className="text-lg font-bold mb-4">Confirm Network Switch</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to switch from <span className="font-medium">{currentNetwork}</span> to{' '}
                <span className="font-medium">{targetNetwork}</span>?
              </p>
              <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg mb-6">
                <FaExclamationTriangle className="inline-block mr-1" />
                This action will change the blockchain connection. Make sure all your current operations are completed.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelNetworkSwitch}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmNetworkSwitch}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Confirm Switch
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NetworkSwitcher; 