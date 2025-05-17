import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { FaLock, FaUser, FaEnvelope, FaShieldAlt, FaServer, FaExclamationTriangle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import ApiService from '../services/ApiService';

const Login = () => {
  const [email, setEmail] = useState('admin@dbis.gov');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState({ checked: false, available: false });
  const { login } = useAuth();
  const navigate = useNavigate();

  // Check API endpoint availability when component loads
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const isAvailable = await ApiService.checkEndpointHealth('/admin/login');
        setApiStatus({ checked: true, available: isAvailable });
      } catch (error) {
        setApiStatus({ checked: true, available: false });
        console.error('API status check failed:', error);
      }
    };

    checkApiStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('Submitting login form with email:', email);

      // Call the login method from AuthContext
      const result = await login(email, password);
      console.log('Login result:', result);
      
      if (result.success) {
        // Redirect to admin dashboard on successful login
        console.log('Login successful, redirecting to dashboard');
        navigate('/admin/dashboard');
      } else {
        setError(result.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex justify-center items-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">DBIS Admin Portal</h2>
            <p className="text-gray-600 mt-2">Decentralized Biometric Identity System</p>
          </div>

          {apiStatus.checked && !apiStatus.available && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded"
            >
              <div className="flex items-center">
                <FaExclamationTriangle className="text-red-500 mr-2" />
                <p className="text-sm text-red-600">
                  API service is currently unavailable. Login might not work properly.
                </p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-sm">
                    <span className="text-indigo-600 hover:text-indigo-500 cursor-pointer">
                      Forgot your password?
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaServer className={`${apiStatus.available ? 'text-green-500' : 'text-red-500'}`} />
                  <span>{apiStatus.available ? 'Server online' : 'Server offline'}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <FaShieldAlt className="h-5 w-5 mr-2" />
                )}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-gray-50 py-4 px-8 border-t">
          <p className="text-xs text-center text-gray-500">
            Government of India · DBIS Administration · {new Date().getFullYear()}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
