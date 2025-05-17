import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../services/ApiService';
import { FaUsers, FaUserCheck, FaUserClock, FaUserTimes, 
         FaCheckCircle, FaTimesCircle, FaEdit, FaHistory, 
         FaCog, FaLink, FaChevronRight, FaFingerprint, 
         FaChartLine, FaShieldAlt, FaIdCard, FaArrowUp, 
         FaArrowDown, FaSync, FaExclamationTriangle, FaUserShield, FaServer, FaExchangeAlt } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';
import { motion } from 'framer-motion';

// Component for skeleton loader
const SkeletonLoader = ({ height = 'h-32' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${height} w-full`}></div>
);

// Stat card component with API endpoint checking
const StatCard = ({ title, value, icon, color, endpoint, isLoading }) => {
  const [endpointStatus, setEndpointStatus] = useState({ checked: false, available: false });
  
  useEffect(() => {
    const checkEndpoint = async () => {
      if (endpoint) {
        const isAvailable = await ApiService.checkEndpointHealth(endpoint);
        setEndpointStatus({ checked: true, available: isAvailable });
      }
    };
    
    checkEndpoint();
  }, [endpoint]);
  
  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <SkeletonLoader height="h-24" />
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100 relative overflow-hidden"
    >
      {endpoint && endpointStatus.checked && !endpointStatus.available && (
        <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-xs px-2 py-1 m-2 rounded-md flex items-center">
          <FaExclamationTriangle className="mr-1" />
          API Unavailable
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-2">
            {endpointStatus.available === false && endpoint ? '—' : value}
          </p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {React.cloneElement(icon, { className: 'h-6 w-6 text-white' })}
        </div>
      </div>
    </motion.div>
  );
};

// Recent activity component
const RecentActivity = ({ isLoading }) => {
  const [activities, setActivities] = useState([]);
  const [apiAvailable, setApiAvailable] = useState(true);
  
  useEffect(() => {
    const fetchActivity = async () => {
      // Check if endpoint is available
      const isAvailable = await ApiService.checkEndpointHealth('/admin/dashboard/activity');
      setApiAvailable(isAvailable);
      
      if (isAvailable) {
        const result = await ApiService.getDashboardActivity(5);
        if (result.success) {
          setActivities(result.data || []);
        }
      }
    };
    
    fetchActivity();
  }, []);
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <SkeletonLoader height="h-64" />
      </div>
    );
  }
  
  if (!apiAvailable) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
      >
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-center">
          <FaExclamationTriangle className="mr-2" />
          <p>Activity data is currently unavailable</p>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      
      {activities.length === 0 ? (
        <p className="text-gray-500 text-center py-6">No recent activities found</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
              <div className={`p-2 rounded-full ${
                activity.type === 'verification' ? 'bg-green-100 text-green-600' :
                activity.type === 'registration' ? 'bg-blue-100 text-blue-600' :
                activity.type === 'blockchain' ? 'bg-purple-100 text-purple-600' :
                'bg-gray-100 text-gray-600'
              } mr-3`}>
                {activity.type === 'verification' ? <FaUserCheck className="h-4 w-4" /> :
                 activity.type === 'registration' ? <FaUserClock className="h-4 w-4" /> :
                 activity.type === 'blockchain' ? <FaExchangeAlt className="h-4 w-4" /> :
                 <FaChartLine className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.description}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">{activity.user}</p>
                  <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// API Health Status component
const ApiHealthStatus = ({ healthStatus }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <h3 className="text-lg font-semibold mb-4">API Health Status</h3>
      
      <div className="space-y-3">
        {Object.entries(healthStatus).map(([endpoint, isHealthy]) => (
          <div key={endpoint} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
            <div className="flex items-center">
              <FaServer className="text-gray-400 mr-2" />
              <span className="text-sm font-medium">{endpoint}</span>
            </div>
            <div className={`flex items-center ${isHealthy ? 'text-green-500' : 'text-red-500'}`}>
              {isHealthy ? 
                <><FaCheckCircle className="mr-1" /> <span className="text-sm">Online</span></> : 
                <><FaExclamationTriangle className="mr-1" /> <span className="text-sm">Offline</span></>
              }
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { currentUser, apiHealthStatus } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      // Check if dashboard endpoint is available
      const isAvailable = await ApiService.checkEndpointHealth('/admin/dashboard/stats');
      
      if (isAvailable) {
        const result = await ApiService.getDashboardStats();
        if (result.success) {
          setDashboardData(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {currentUser?.name || 'Administrator'}</p>
        </div>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 flex items-center"
        >
          <svg
            className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </motion.button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Verified Users"
          value={dashboardData?.verifiedCount || 0}
          icon={<FaUserCheck />}
          color="bg-green-500"
          endpoint="/admin/users"
          isLoading={loading}
        />
        <StatCard
          title="Pending Verifications"
          value={dashboardData?.pendingCount || 0}
          icon={<FaUserClock />}
          color="bg-yellow-500"
          endpoint="/admin/users"
          isLoading={loading}
        />
        <StatCard
          title="Rejected Applications"
          value={dashboardData?.rejectedCount || 0}
          icon={<FaUserTimes />}
          color="bg-red-500"
          endpoint="/admin/users"
          isLoading={loading}
        />
        <StatCard
          title="On Blockchain"
          value={dashboardData?.blockchainCount || 0}
          icon={<FaExchangeAlt />}
          color="bg-purple-500"
          endpoint="/blockchain/record"
          isLoading={loading}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity isLoading={loading} />
          
          {/* Quick Actions Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mt-6"
          >
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Link 
                to="/records" 
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 mr-3">
                  <FaIdCard className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">User Records</h4>
                  <p className="text-xs text-gray-500">View and manage users</p>
                </div>
              </Link>
              
              <Link 
                to="/blockchain" 
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-3">
                  <FaExchangeAlt className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">Blockchain History</h4>
                  <p className="text-xs text-gray-500">Track blockchain transactions</p>
                </div>
              </Link>
              
              <Link 
                to="/activity-logs" 
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                  <FaHistory className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">Activity Logs</h4>
                  <p className="text-xs text-gray-500">View system activity</p>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
        <div>
          <ApiHealthStatus healthStatus={apiHealthStatus} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
