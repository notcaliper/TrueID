import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';
import { FaServer, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const BackendStatusChecker = ({ showDetails = false }) => {
  const [status, setStatus] = useState({
    isChecking: true,
    isOnline: false,
    lastChecked: null,
    endpoints: {}
  });

  // Function to check backend status
  const checkBackendStatus = async () => {
    setStatus(prev => ({ ...prev, isChecking: true }));
    
    try {
      // Check the test endpoint which should be publicly accessible
      const testEndpoint = await ApiService.checkEndpointHealth('/test');
      
      // Check other critical endpoints
      const criticalEndpoints = [
        '/admin/login',
        '/admin/profile',
        '/admin/users',
        '/admin/logs'
      ];
      
      const endpointResults = {};
      
      // Check each endpoint
      for (const endpoint of criticalEndpoints) {
        const isHealthy = await ApiService.checkEndpointHealth(endpoint);
        endpointResults[endpoint] = isHealthy;
      }
      
      setStatus({
        isChecking: false,
        isOnline: testEndpoint,
        lastChecked: new Date(),
        endpoints: endpointResults
      });
    } catch (error) {
      console.error('Error checking backend status:', error);
      setStatus({
        isChecking: false,
        isOnline: false,
        lastChecked: new Date(),
        error: error.message
      });
    }
  };

  // Check status on component mount and periodically
  useEffect(() => {
    // Initial check
    checkBackendStatus();
    
    // Set up interval to check periodically (every 30 seconds)
    const intervalId = setInterval(checkBackendStatus, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Format the last checked time
  const formatLastChecked = () => {
    if (!status.lastChecked) return 'Never';
    
    const now = new Date();
    const diff = now - status.lastChecked;
    
    if (diff < 60000) { // Less than a minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than an hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return status.lastChecked.toLocaleTimeString();
    }
  };

  return (
    <div className="backend-status-checker">
      <div className={`status-indicator ${status.isOnline ? 'online' : 'offline'}`}>
        {status.isChecking ? (
          <div className="flex items-center">
            <div className="animate-pulse mr-2">
              <FaServer className="text-gray-400" />
            </div>
            <span className="text-sm text-gray-500">Checking backend...</span>
          </div>
        ) : status.isOnline ? (
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 mr-2" />
            <span className="text-sm font-medium text-green-700">Backend Online</span>
            {showDetails && (
              <span className="text-xs text-gray-500 ml-2">
                Last checked: {formatLastChecked()}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-2" />
            <span className="text-sm font-medium text-red-700">Backend Offline</span>
            {showDetails && (
              <span className="text-xs text-gray-500 ml-2">
                Last checked: {formatLastChecked()}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Detailed endpoint status (only shown when showDetails is true) */}
      {showDetails && !status.isChecking && (
        <div className="endpoint-details mt-2">
          <h4 className="text-sm font-semibold mb-1">Endpoint Status:</h4>
          <ul className="text-xs space-y-1">
            {Object.entries(status.endpoints).map(([endpoint, isHealthy]) => (
              <li key={endpoint} className="flex items-center">
                {isHealthy ? (
                  <FaCheckCircle className="text-green-500 mr-1 text-xs" />
                ) : (
                  <FaExclamationTriangle className="text-red-500 mr-1 text-xs" />
                )}
                <span className={isHealthy ? 'text-green-700' : 'text-red-700'}>
                  {endpoint}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Manual refresh button */}
      {showDetails && (
        <button 
          onClick={checkBackendStatus}
          disabled={status.isChecking}
          className="text-xs text-blue-600 hover:text-blue-800 mt-2 flex items-center"
        >
          {status.isChecking ? 'Checking...' : 'Refresh Status'}
        </button>
      )}
    </div>
  );
};

export default BackendStatusChecker;
