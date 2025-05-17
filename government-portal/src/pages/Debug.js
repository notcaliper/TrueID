import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/ApiService';
import { useAuth } from '../utils/AuthContext';
import '../styles/Debug.css';

const Debug = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState('api');
  const [endpoint, setEndpoint] = useState('/test');
  const [method, setMethod] = useState('GET');
  const [requestBody, setRequestBody] = useState('{}');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || '');
  const [statusChecks, setStatusChecks] = useState({});
  
  // Common endpoints for quick testing
  const commonEndpoints = [
    { name: 'Test Connection', endpoint: '/test', method: 'GET' },
    { name: 'Network Status', endpoint: '/network/status', method: 'GET' },
    { name: 'Admin Login', endpoint: '/admin/login', method: 'POST', body: '{"email": "admin@dbis.gov", "password": "admin123"}' },
    { name: 'Admin Profile', endpoint: '/admin/profile', method: 'GET' },
    { name: 'Users List', endpoint: '/admin/users', method: 'GET' },
    { name: 'Activity Logs', endpoint: '/admin/logs', method: 'GET' },
    { name: 'Blockchain Transactions', endpoint: '/blockchain/transactions', method: 'GET' },
  ];
  
  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated) {
      // Allow debug page to work without authentication, but show warning
      console.warn('Debug page accessed without authentication');
    }
    
    // Update token from localStorage
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setAuthToken(storedToken);
    }
    
    // Run initial health checks
    checkApiStatus();
  }, [isAuthenticated]);
  
  // Function to check API status
  const checkApiStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoints = [
        '/test',
        '/admin/login',
        '/admin/profile',
        '/admin/users',
        '/network/status',
        '/blockchain/transactions'
      ];
      
      const results = {};
      
      for (const endpoint of endpoints) {
        const isHealthy = await ApiService.checkEndpointHealth(endpoint);
        results[endpoint] = isHealthy;
      }
      
      setStatusChecks(results);
    } catch (error) {
      console.error('Error checking API status:', error);
      setError('Failed to check API status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to make API request
  const makeRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      let requestData = {};
      
      // Parse request body if not empty
      if (requestBody && requestBody.trim() !== '{}' && requestBody.trim() !== '') {
        try {
          requestData = JSON.parse(requestBody);
        } catch (e) {
          setError('Invalid JSON in request body');
          setLoading(false);
          return;
        }
      }
      
      // Make the request using ApiService
      let result;
      
      switch (method) {
        case 'GET':
          result = await ApiService.safeApiCall('GET', endpoint, null, {
            params: requestData
          });
          break;
        case 'POST':
          result = await ApiService.safeApiCall('POST', endpoint, requestData);
          break;
        case 'PUT':
          result = await ApiService.safeApiCall('PUT', endpoint, requestData);
          break;
        case 'DELETE':
          result = await ApiService.safeApiCall('DELETE', endpoint, requestData);
          break;
        default:
          setError(`Unsupported method: ${method}`);
          setLoading(false);
          return;
      }
      
      setResponse(result);
    } catch (error) {
      console.error('API request error:', error);
      setError(error.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to set token in localStorage and update headers
  const updateToken = () => {
    if (authToken) {
      localStorage.setItem('authToken', authToken);
      // Force reload to update axios instance with new token
      window.location.reload();
    } else {
      localStorage.removeItem('authToken');
      // Force reload to update axios instance without token
      window.location.reload();
    }
  };
  
  // Function to format JSON
  const formatJSON = (json) => {
    try {
      if (typeof json === 'string') {
        json = JSON.parse(json);
      }
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return json;
    }
  };
  
  // Function to select a common endpoint
  const selectEndpoint = (item) => {
    setEndpoint(item.endpoint);
    setMethod(item.method);
    if (item.body) {
      setRequestBody(item.body);
    } else {
      setRequestBody('{}');
    }
  };
  
  return (
    <div className="debug-container">
      <div className="debug-header">
        <h1>DBIS Debug Console</h1>
        <div className="environment-badge">
          {process.env.REACT_APP_ENV || 'development'}
        </div>
      </div>
      
      <div className="debug-warning">
        <strong>Warning:</strong> This page is for development and testing purposes only.
        It should be disabled in production environments.
      </div>
      
      <div className="debug-tabs">
        <button 
          className={activeTab === 'api' ? 'active' : ''}
          onClick={() => setActiveTab('api')}
        >
          API Testing
        </button>
        <button 
          className={activeTab === 'auth' ? 'active' : ''}
          onClick={() => setActiveTab('auth')}
        >
          Authentication
        </button>
        <button 
          className={activeTab === 'status' ? 'active' : ''}
          onClick={() => setActiveTab('status')}
        >
          API Status
        </button>
      </div>
      
      <div className="debug-content">
        {activeTab === 'api' && (
          <div className="api-tester">
            <div className="common-endpoints">
              <h3>Common Endpoints</h3>
              <div className="endpoint-list">
                {commonEndpoints.map((item, index) => (
                  <button 
                    key={index} 
                    onClick={() => selectEndpoint(item)}
                    className={endpoint === item.endpoint && method === item.method ? 'active' : ''}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="request-form">
              <div className="form-group">
                <label>Method:</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Endpoint:</label>
                <input 
                  type="text" 
                  value={endpoint} 
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="/api/endpoint"
                />
              </div>
              
              <div className="form-group">
                <label>Request Body (JSON):</label>
                <textarea 
                  value={requestBody} 
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder={'{\n  "key": "value"\n}'}
                  rows={8}
                />
              </div>
              
              <button 
                onClick={makeRequest} 
                disabled={loading}
                className="submit-button"
              >
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
            
            <div className="response-section">
              <h3>Response</h3>
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              {response && (
                <pre className="response-data">
                  {formatJSON(response)}
                </pre>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'auth' && (
          <div className="auth-tester">
            <div className="current-auth">
              <h3>Current Authentication</h3>
              <div className="auth-status">
                <p>
                  <strong>Status:</strong> {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </p>
                {currentUser && (
                  <div className="user-info">
                    <p><strong>User:</strong> {currentUser.name || currentUser.email}</p>
                    <p><strong>Role:</strong> {currentUser.role || 'N/A'}</p>
                    <p><strong>ID:</strong> {currentUser.id || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="token-manager">
              <h3>JWT Token Manager</h3>
              <div className="form-group">
                <label>Auth Token:</label>
                <textarea 
                  value={authToken} 
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="JWT token"
                  rows={4}
                />
              </div>
              
              <div className="token-actions">
                <button onClick={updateToken} className="token-button">
                  Update Token
                </button>
                <button 
                  onClick={() => {
                    setAuthToken('');
                    localStorage.removeItem('authToken');
                    window.location.reload();
                  }} 
                  className="token-button clear"
                >
                  Clear Token
                </button>
              </div>
              
              <div className="login-shortcut">
                <button onClick={() => navigate('/login')} className="nav-button">
                  Go to Login Page
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'status' && (
          <div className="status-checker">
            <div className="status-header">
              <h3>API Endpoint Status</h3>
              <button 
                onClick={checkApiStatus} 
                disabled={loading}
                className="refresh-button"
              >
                {loading ? 'Checking...' : 'Refresh Status'}
              </button>
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <div className="status-grid">
              {Object.entries(statusChecks).map(([endpoint, isHealthy]) => (
                <div key={endpoint} className={`status-item ${isHealthy ? 'healthy' : 'unhealthy'}`}>
                  <div className="status-indicator"></div>
                  <div className="status-endpoint">{endpoint}</div>
                  <div className="status-text">{isHealthy ? 'Available' : 'Unavailable'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Debug;
