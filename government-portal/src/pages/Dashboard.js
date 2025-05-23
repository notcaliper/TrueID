import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../services/ApiService';
import { FaUsers, FaUserCheck, FaUserClock, FaUserTimes, 
         FaCheckCircle, FaTimesCircle, FaEdit, FaHistory, 
         FaCog, FaLink, FaChevronRight, FaFingerprint, 
         FaChartLine, FaShieldAlt, FaIdCard, FaArrowUp, 
         FaArrowDown, FaSync, FaExclamationTriangle, FaUserShield } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingUsers: 0,
    rejectedUsers: 0,
    recentActivities: [],
    lastUpdated: null,
    trends: {
      totalChange: 0,
      verifiedChange: 0,
      pendingChange: 0,
      rejectedChange: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      handleRefresh(true);
    }, 300000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Mock data for dashboard
  const mockData = {
    totalUsers: 1248,
    verifiedUsers: 876,
    pendingUsers: 289,
    rejectedUsers: 83,
    lastUpdated: new Date(),
    trends: {
      totalChange: 42,
      verifiedChange: 28,
      pendingChange: -15,
      rejectedChange: -3
    },
    recentActivities: [
      {
        id: 1,
        action: 'User Verified',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        userName: 'Rahul Sharma',
        userId: 'ID-78945612',
        adminName: 'Admin Singh',
        txHash: '0x7d5c9b6c8f4a3d2e1b0a7c6b5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e'
      },
      {
        id: 2,
        action: 'Biometric Updated',
        timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
        userName: 'Priya Patel',
        userId: 'ID-45678912',
        adminName: 'Admin Singh',
        txHash: '0x3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2'
      },
      {
        id: 3,
        action: 'User Rejected',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        userName: 'Amit Kumar',
        userId: 'ID-12345678',
        adminName: 'Supervisor Gupta',
        txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2'
      },
      {
        id: 4,
        action: 'User Verified',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        userName: 'Neha Verma',
        userId: 'ID-98765432',
        adminName: 'Supervisor Gupta',
        txHash: '0x5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4'
      }
    ]
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data instead of API call
      // const data = await ApiService.getDashboardStats();
      const data = {...mockData, lastUpdated: new Date()};
      
      setStats(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
    }
  };

  const handleRefresh = async (silent = false) => {
    if (silent) {
      // Silent refresh doesn't show loading indicator
      setRefreshing(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Use mock data with slight variations to simulate changes
        const updatedMockData = {
          ...mockData,
          totalUsers: mockData.totalUsers + Math.floor(Math.random() * 5),
          verifiedUsers: mockData.verifiedUsers + Math.floor(Math.random() * 3),
          pendingUsers: Math.max(0, mockData.pendingUsers - Math.floor(Math.random() * 2)),
          lastUpdated: new Date(),
          trends: {
            ...mockData.trends,
            totalChange: mockData.trends.totalChange + Math.floor(Math.random() * 3) - 1
          }
        };
        
        setStats(updatedMockData);
      } catch (err) {
        console.error('Error refreshing dashboard data:', err);
        // Don't show error for silent refresh
      } finally {
        setRefreshing(false);
      }
    } else {
      // Regular refresh with loading indicator
      setRefreshing(true);
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Use mock data with variations to simulate changes
        const updatedMockData = {
          ...mockData,
          totalUsers: mockData.totalUsers + Math.floor(Math.random() * 10),
          verifiedUsers: mockData.verifiedUsers + Math.floor(Math.random() * 7),
          pendingUsers: Math.max(0, mockData.pendingUsers - Math.floor(Math.random() * 5)),
          rejectedUsers: mockData.rejectedUsers + Math.floor(Math.random() * 2),
          lastUpdated: new Date(),
          trends: {
            totalChange: mockData.trends.totalChange + Math.floor(Math.random() * 5) - 2,
            verifiedChange: mockData.trends.verifiedChange + Math.floor(Math.random() * 4) - 1,
            pendingChange: mockData.trends.pendingChange - Math.floor(Math.random() * 3),
            rejectedChange: mockData.trends.rejectedChange + Math.floor(Math.random() * 2) - 1
          }
        };
        
        // Add a new activity item occasionally
        if (Math.random() > 0.6) {
          const actions = ['User Verified', 'Biometric Updated', 'User Rejected'];
          const names = ['Vikram Mehta', 'Anjali Desai', 'Sanjay Patel', 'Meera Kapoor'];
          const admins = ['Admin Singh', 'Supervisor Gupta'];
          
          updatedMockData.recentActivities.unshift({
            id: Date.now(),
            action: actions[Math.floor(Math.random() * actions.length)],
            timestamp: new Date(),
            userName: names[Math.floor(Math.random() * names.length)],
            userId: `ID-${Math.floor(10000000 + Math.random() * 90000000)}`,
            adminName: admins[Math.floor(Math.random() * admins.length)],
            txHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`
          });
          
          // Keep only the most recent 5 activities
          updatedMockData.recentActivities = updatedMockData.recentActivities.slice(0, 5);
        }
        
        setStats(updatedMockData);
        setError(null);
      } catch (err) {
        console.error('Error refreshing dashboard data:', err);
        setError('Failed to refresh dashboard data. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }
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

  // Truncate hash for display
  const truncateHash = (hash) => {
    if (!hash) return '';
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
  };

  const getActionIcon = (action) => {
    if (action.includes('Verified')) return <FaCheckCircle className="action-icon verified" />;
    if (action.includes('Rejected')) return <FaTimesCircle className="action-icon rejected" />;
    if (action.includes('Updated')) return <FaEdit className="action-icon updated" />;
    if (action.includes('Biometric')) return <FaFingerprint className="action-icon biometric" />;
    return <FaUserClock className="action-icon pending" />;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">
            <FaChartLine className="page-title-icon" />
            Dashboard
          </h1>
          {stats.lastUpdated && (
            <div className="last-updated">
              Last updated: {formatDate(stats.lastUpdated)}
              {refreshing && <FaSync className="refresh-icon spinning" />}
            </div>
          )}
        </div>
        <div className="header-right">
          <button 
            className="refresh-button" 
            onClick={() => handleRefresh()}
            disabled={loading || refreshing}
          >
            <FaSync className={refreshing ? 'spinning' : ''} />
            Refresh Data
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <FaExclamationTriangle className="error-icon" />
          {error}
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stats-card total">
          <div className="stats-icon-container">
            <FaIdCard className="stats-icon" />
          </div>
          <div className="stats-info">
            <h3 className="stats-label">Total Users</h3>
            <p className="stats-value">
              {loading ? <span className="loading-dots">...</span> : stats.totalUsers.toLocaleString()}
            </p>
            <p className="stats-description">Registered identities in the system</p>
            {!loading && stats.trends.totalChange !== 0 && (
              <div className={`stats-change ${stats.trends.totalChange > 0 ? 'positive' : 'negative'}`}>
                {stats.trends.totalChange > 0 ? (
                  <>
                    <FaArrowUp className="trend-icon" />
                    <span>+{stats.trends.totalChange} since last week</span>
                  </>
                ) : (
                  <>
                    <FaArrowDown className="trend-icon" />
                    <span>{stats.trends.totalChange} since last week</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="stats-card verified">
          <div className="stats-icon-container">
            <FaUserCheck className="stats-icon" />
          </div>
          <div className="stats-info">
            <h3 className="stats-label">Verified Users</h3>
            <p className="stats-value">
              {loading ? <span className="loading-dots">...</span> : stats.verifiedUsers.toLocaleString()}
            </p>
            <div className="stats-meta">
              <p className="stats-description">Confirmed identities</p>
              <div className="stats-percentage">
                {loading ? '' : `${Math.round((stats.verifiedUsers / (stats.totalUsers || 1)) * 100)}%`}
              </div>
            </div>
            {!loading && stats.trends.verifiedChange !== 0 && (
              <div className={`stats-change ${stats.trends.verifiedChange > 0 ? 'positive' : 'negative'}`}>
                {stats.trends.verifiedChange > 0 ? (
                  <>
                    <FaArrowUp className="trend-icon" />
                    <span>+{stats.trends.verifiedChange} since last week</span>
                  </>
                ) : (
                  <>
                    <FaArrowDown className="trend-icon" />
                    <span>{stats.trends.verifiedChange} since last week</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="stats-card pending">
          <div className="stats-icon-container">
            <FaUserClock className="stats-icon" />
          </div>
          <div className="stats-info">
            <h3 className="stats-label">Pending Users</h3>
            <p className="stats-value">
              {loading ? <span className="loading-dots">...</span> : stats.pendingUsers.toLocaleString()}
            </p>
            <div className="stats-meta">
              <p className="stats-description">Awaiting verification</p>
              <div className="stats-percentage">
                {loading ? '' : `${Math.round((stats.pendingUsers / (stats.totalUsers || 1)) * 100)}%`}
              </div>
            </div>
            {!loading && stats.trends.pendingChange !== 0 && (
              <div className={`stats-change ${stats.trends.pendingChange < 0 ? 'positive' : 'negative'}`}>
                {stats.trends.pendingChange > 0 ? (
                  <>
                    <FaArrowUp className="trend-icon" />
                    <span>+{stats.trends.pendingChange} since last week</span>
                  </>
                ) : (
                  <>
                    <FaArrowDown className="trend-icon" />
                    <span>{Math.abs(stats.trends.pendingChange)} fewer since last week</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="stats-card rejected">
          <div className="stats-icon-container">
            <FaUserTimes className="stats-icon" />
          </div>
          <div className="stats-info">
            <h3 className="stats-label">Rejected Users</h3>
            <p className="stats-value">
              {loading ? <span className="loading-dots">...</span> : stats.rejectedUsers.toLocaleString()}
            </p>
            <div className="stats-meta">
              <p className="stats-description">Failed verification</p>
              <div className="stats-percentage">
                {loading ? '' : `${Math.round((stats.rejectedUsers / (stats.totalUsers || 1)) * 100)}%`}
              </div>
            </div>
            {!loading && stats.trends.rejectedChange !== 0 && (
              <div className={`stats-change ${stats.trends.rejectedChange < 0 ? 'positive' : 'negative'}`}>
                {stats.trends.rejectedChange > 0 ? (
                  <>
                    <FaArrowUp className="trend-icon" />
                    <span>+{stats.trends.rejectedChange} since last week</span>
                  </>
                ) : (
                  <>
                    <FaArrowDown className="trend-icon" />
                    <span>{Math.abs(stats.trends.rejectedChange)} fewer since last week</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="activity-section">
        <div className="section-header">
          <h2 className="section-title">
            <FaHistory className="section-icon" />
            Recent Activity
          </h2>
          <Link to="/activity-logs" className="view-all-link">
            View All <FaChevronRight className="view-all-icon" />
          </Link>
        </div>
        
        <div className="section-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading recent activity...</p>
            </div>
          ) : stats.recentActivities.length === 0 ? (
            <div className="empty-state">
              <FaHistory className="empty-icon" />
              <p className="empty-text">No recent activity found.</p>
              <p className="empty-subtext">Activities will appear here as users are verified or updated.</p>
            </div>
          ) : (
            <div className="activity-cards">
              {stats.recentActivities.map((activity) => (
                <div key={activity.id} className="activity-card">
                  <div className="activity-header">
                    <div className="activity-action">
                      {getActionIcon(activity.action)}
                      <span className="action-text">{activity.action}</span>
                    </div>
                    <div className="activity-time">
                      <FaHistory className="time-icon" />
                      {formatDate(activity.timestamp)}
                    </div>
                  </div>
                  
                  <div className="activity-body">
                    <div className="activity-user">
                      <div className="user-avatar">
                        {activity.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{activity.userName}</div>
                        <div className="user-id">
                          <FaIdCard className="id-icon" />
                          {activity.userId}
                        </div>
                      </div>
                    </div>
                    
                    <div className="activity-admin">
                      <span className="admin-label">Verified by:</span>
                      <span className="admin-name">
                        <FaUserShield className="admin-icon" />
                        {activity.adminName}
                      </span>
                    </div>
                  </div>
                  
                  {activity.txHash && (
                    <div className="activity-footer">
                      <div className="tx-hash">
                        <FaLink className="tx-icon" />
                        <span className="tx-label">Blockchain TX:</span>
                        <Link to={`/activity-logs?txHash=${activity.txHash}`} className="tx-value">
                          {truncateHash(activity.txHash)}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="section quick-actions-section">
        <div className="section-header">
          <h2 className="section-title">
            <FaShieldAlt className="section-icon" />
            Quick Actions
          </h2>
          <p className="section-subtitle">Common tasks for government officials</p>
        </div>
        
        <div className="quick-actions-grid">
          <Link to="/records" className="quick-action-card">
            <div className="quick-action-icon-container records">
              <FaIdCard className="quick-action-icon" />
            </div>
            <div className="quick-action-content">
              <h3 className="quick-action-title">Manage Records</h3>
              <p className="quick-action-description">View and update user identity records</p>
              <ul className="quick-action-features">
                <li>Search and filter users</li>
                <li>Verify identities</li>
                <li>Update biometric data</li>
              </ul>
            </div>
            <div className="quick-action-arrow">
              <FaChevronRight />
            </div>
          </Link>
          
          <Link to="/activity-logs" className="quick-action-card">
            <div className="quick-action-icon-container logs">
              <FaHistory className="quick-action-icon" />
            </div>
            <div className="quick-action-content">
              <h3 className="quick-action-title">Activity Logs</h3>
              <p className="quick-action-description">View system audit trail and verification history</p>
              <ul className="quick-action-features">
                <li>Track verification activities</li>
                <li>Monitor blockchain transactions</li>
                <li>Export audit reports</li>
              </ul>
            </div>
            <div className="quick-action-arrow">
              <FaChevronRight />
            </div>
          </Link>
          
          <Link to="/settings" className="quick-action-card">
            <div className="quick-action-icon-container settings">
              <FaCog className="quick-action-icon" />
            </div>
            <div className="quick-action-content">
              <h3 className="quick-action-title">Admin Settings</h3>
              <p className="quick-action-description">Manage account preferences and security settings</p>
              <ul className="quick-action-features">
                <li>Update admin profile</li>
                <li>Configure security options</li>
                <li>Manage notification preferences</li>
              </ul>
            </div>
            <div className="quick-action-arrow">
              <FaChevronRight />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
