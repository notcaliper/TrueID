import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../services/ApiService';
import { FaUsers, FaUserCheck, FaUserClock, FaUserTimes, 
         FaCheckCircle, FaTimesCircle, FaEdit, FaHistory, 
         FaCog, FaLink, FaChevronRight, FaFingerprint, 
         FaChartLine, FaShieldAlt, FaIdCard, FaArrowUp, 
         FaArrowDown, FaSync, FaExclamationTriangle, FaUserShield } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';
import './Dashboard.css';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial empty state for dashboard data - used as reference for data structure
  // eslint-disable-next-line no-unused-vars
  const initialDashboardState = {
    userStats: {
      total: 0,
      verified: 0,
      pending: 0,
      rejected: 0
    },
    recordStats: {
      biometricRecords: 0,
      professionalRecords: 0,
      blockchainTransactions: 0
    },
    recentActivity: [],
    registrationTrend: [],
    lastUpdated: new Date()
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get dashboard statistics from API
      const response = await ApiService.getDashboardStats();
      const data = response.data || response;
      
      console.log('Dashboard data received:', data);
      
      // Transform API data to match our state structure
      // Handle both possible response formats
      const transformedData = {
        totalUsers: data.userStats?.total || 0,
        verifiedUsers: data.userStats?.verified || 0,
        pendingUsers: data.userStats?.pending || 0,
        rejectedUsers: data.userStats?.rejected || 0,
        lastUpdated: new Date(),
        trends: {
          totalChange: 0, // We'll calculate this when we have previous data
          verifiedChange: 0,
          pendingChange: 0,
          rejectedChange: 0
        },
        recentActivities: (data.recentActivity || []).map(activity => ({
          id: activity.id || Math.random().toString(36).substr(2, 9),
          action: activity.action,
          timestamp: new Date(activity.created_at || activity.timestamp || Date.now()),
          userName: activity.user_name || activity.userName || 'Unknown User',
          userId: activity.government_id || activity.userId || '-',
          adminName: activity.admin_username || activity.adminName || currentUser?.username || 'System',
          txHash: activity.details?.transactionHash || activity.txHash
        }))
      };
      
      setStats(transformedData);
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
        // Get fresh data from API
        const response = await ApiService.getDashboardStats();
        const data = response.data || response;
        
        // Transform API data to match our state structure
        const transformedData = {
          totalUsers: data.userStats?.total || 0,
          verifiedUsers: data.userStats?.verified || 0,
          pendingUsers: data.userStats?.pending || 0,
          rejectedUsers: data.userStats?.rejected || 0,
          lastUpdated: new Date(),
          trends: {
            totalChange: (data.userStats?.total || 0) - stats.totalUsers,
            verifiedChange: (data.userStats?.verified || 0) - stats.verifiedUsers,
            pendingChange: (data.userStats?.pending || 0) - stats.pendingUsers,
            rejectedChange: (data.userStats?.rejected || 0) - stats.rejectedUsers
          },
          recentActivities: (data.recentActivity || []).map(activity => ({
            id: activity.id || Math.random().toString(36).substr(2, 9),
            action: activity.action,
            timestamp: new Date(activity.created_at || activity.timestamp || Date.now()),
            userName: activity.user_name || activity.userName || 'Unknown User',
            userId: activity.government_id || activity.userId || '-',
            adminName: activity.admin_username || activity.adminName || currentUser?.username || 'System',
            txHash: activity.details?.transactionHash || activity.txHash
          }))
        };
        
        setStats(transformedData);
      } catch (err) {
        // Silent refresh doesn't show errors
        console.error('Error during silent refresh:', err);
      } finally {
        setRefreshing(false);
      }
    } else {
      // Regular refresh shows loading state
      setRefreshing(true);
      setLoading(true);
      try {
        // Get fresh data from API
        const response = await ApiService.getDashboardStats();
        const data = response.data || response;
        
        // Transform API data to match our state structure
        const transformedData = {
          totalUsers: data.userStats?.total || 0,
          verifiedUsers: data.userStats?.verified || 0,
          pendingUsers: data.userStats?.pending || 0,
          rejectedUsers: data.userStats?.rejected || 0,
          lastUpdated: new Date(),
          trends: {
            totalChange: (data.userStats?.total || 0) - stats.totalUsers,
            verifiedChange: (data.userStats?.verified || 0) - stats.verifiedUsers,
            pendingChange: (data.userStats?.pending || 0) - stats.pendingUsers,
            rejectedChange: (data.userStats?.rejected || 0) - stats.rejectedUsers
          },
          recentActivities: (data.recentActivity || []).map(activity => ({
            id: activity.id || Math.random().toString(36).substr(2, 9),
            action: activity.action,
            timestamp: new Date(activity.created_at || activity.timestamp || Date.now()),
            userName: activity.user_name || activity.userName || 'Unknown User',
            userId: activity.government_id || activity.userId || '-',
            adminName: activity.admin_username || activity.adminName || currentUser?.username || 'System',
            txHash: activity.details?.transactionHash || activity.txHash
          }))
        };
        
        setStats(transformedData);
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
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <FaChartLine className="title-icon" />
          Government Identity Dashboard
        </h1>
        <div className="dashboard-actions">
          <button 
            className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
            onClick={() => handleRefresh(false)} 
            disabled={loading || refreshing}
          >
            <FaSync className="refresh-icon" />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          {stats.lastUpdated && (
            <div className="last-updated">
              Last updated: {formatDate(stats.lastUpdated)}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && !error && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
        </div>
      )}

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* Stats Overview */}
        <div className="section stats-section">
          <div className="section-header">
            <h2 className="section-title">
              <FaChartLine className="section-icon" /> Statistics Overview
            </h2>
            <p className="section-subtitle">Current system statistics and trends</p>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-header">
                <h3 className="stat-title">Total Users</h3>
                <FaUsers className="stat-icon total" />
              </div>
              <p className="stat-value">{stats.totalUsers}</p>
              <div className={`stat-trend ${stats.trends.totalChange > 0 ? 'trend-up' : stats.trends.totalChange < 0 ? 'trend-down' : 'trend-neutral'}`}>
                {stats.trends.totalChange > 0 ? (
                  <>
                    <FaArrowUp className="trend-icon" /> +{stats.trends.totalChange} from last period
                  </>
                ) : stats.trends.totalChange < 0 ? (
                  <>
                    <FaArrowDown className="trend-icon" /> {stats.trends.totalChange} from last period
                  </>
                ) : (
                  <>No change from last period</>
                )}
              </div>
            </div>
            
            <div className="stat-card verified">
              <div className="stat-header">
                <h3 className="stat-title">Verified Users</h3>
                <FaUserCheck className="stat-icon verified" />
              </div>
              <p className="stat-value">{stats.verifiedUsers}</p>
              <div className={`stat-trend ${stats.trends.verifiedChange > 0 ? 'trend-up' : stats.trends.verifiedChange < 0 ? 'trend-down' : 'trend-neutral'}`}>
                {stats.trends.verifiedChange > 0 ? (
                  <>
                    <FaArrowUp className="trend-icon" /> +{stats.trends.verifiedChange} from last period
                  </>
                ) : stats.trends.verifiedChange < 0 ? (
                  <>
                    <FaArrowDown className="trend-icon" /> {stats.trends.verifiedChange} from last period
                  </>
                ) : (
                  <>No change from last period</>
                )}
              </div>
            </div>
            
            <div className="stat-card pending">
              <div className="stat-header">
                <h3 className="stat-title">Pending Verification</h3>
                <FaUserClock className="stat-icon pending" />
              </div>
              <p className="stat-value">{stats.pendingUsers}</p>
              <div className={`stat-trend ${stats.trends.pendingChange > 0 ? 'trend-up' : stats.trends.pendingChange < 0 ? 'trend-down' : 'trend-neutral'}`}>
                {stats.trends.pendingChange > 0 ? (
                  <>
                    <FaArrowUp className="trend-icon" /> +{stats.trends.pendingChange} from last period
                  </>
                ) : stats.trends.pendingChange < 0 ? (
                  <>
                    <FaArrowDown className="trend-icon" /> {stats.trends.pendingChange} from last period
                  </>
                ) : (
                  <>No change from last period</>
                )}
              </div>
            </div>
            
            <div className="stat-card rejected">
              <div className="stat-header">
                <h3 className="stat-title">Rejected Users</h3>
                <FaUserTimes className="stat-icon rejected" />
              </div>
              <p className="stat-value">{stats.rejectedUsers}</p>
              <div className={`stat-trend ${stats.trends.rejectedChange > 0 ? 'trend-up' : stats.trends.rejectedChange < 0 ? 'trend-down' : 'trend-neutral'}`}>
                {stats.trends.rejectedChange > 0 ? (
                  <>
                    <FaArrowUp className="trend-icon" /> +{stats.trends.rejectedChange} from last period
                  </>
                ) : stats.trends.rejectedChange < 0 ? (
                  <>
                    <FaArrowDown className="trend-icon" /> {stats.trends.rejectedChange} from last period
                  </>
                ) : (
                  <>No change from last period</>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="section activity-section">
          <div className="section-header">
            <h2 className="section-title">
              <FaHistory className="section-icon" /> Recent Activity
            </h2>
            <p className="section-subtitle">Latest verification and system activities</p>
          </div>
          
          <div className="section-content">
            <div className="activity-list">
              {stats.recentActivities && stats.recentActivities.length > 0 ? (
                stats.recentActivities.map(activity => (
                  <div key={activity.id} className="activity-card">
                    <div className="activity-header">
                      <div className="activity-action">
                        {getActionIcon(activity.action)} {activity.action}
                      </div>
                      <div className="activity-timestamp">
                        {formatDate(activity.timestamp)}
                      </div>
                    </div>
                    
                    <div className="activity-content">
                      <div className="activity-user">
                        <div className="user-name">
                          {activity.userName}
                        </div>
                        <div className="user-id">
                          <FaFingerprint className="id-icon" />
                          {activity.userId}
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
                ))
              ) : (
                <div className="empty-state">
                  <FaHistory className="empty-icon" />
                  <p className="empty-text">No recent activities found</p>
                </div>
              )}
            </div>
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
    </div>
  );
};

export default Dashboard;
