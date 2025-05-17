import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { FaChevronLeft, FaChevronRight, FaTachometerAlt, FaUsers, 
         FaHistory, FaCog, FaSignOutAlt, FaCode, FaToggleOn, FaToggleOff,
         FaShieldAlt, FaBell, FaUserShield, FaFingerprint, FaIdCard,
         FaExchangeAlt } from 'react-icons/fa';
import BackendStatusChecker from './BackendStatusChecker';
import './BackendStatusChecker.css';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // No development controls in production

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">
            <FaShieldAlt className="logo-icon" />
            DBIS Admin
          </h2>
          <button 
            onClick={toggleSidebar}
            className="sidebar-toggle"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {sidebarOpen && <div className="nav-section-title">MAIN NAVIGATION</div>}
          <ul>
            <li>
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <FaTachometerAlt className="nav-icon" />
                {sidebarOpen && <span>Dashboard</span>}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/records"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <FaIdCard className="nav-icon" />
                {sidebarOpen && <span>User Records</span>}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/blockchain"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <FaExchangeAlt className="nav-icon" />
                {sidebarOpen && <span>Blockchain</span>}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/activity-logs"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <FaHistory className="nav-icon" />
                {sidebarOpen && <span>Activity Logs</span>}
              </NavLink>
            </li>
            
            {sidebarOpen && <div className="nav-section-title">SYSTEM</div>}
            <li>
              <NavLink
                to="/admin/settings"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <FaCog className="nav-icon" />
                {sidebarOpen && <span>Settings</span>}
              </NavLink>
            </li>
            
            {/* No developer tools in production */}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            className="logout-button"
            aria-label="Logout"
          >
            <FaSignOutAlt className="nav-icon" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="main-header">
          <div className="header-left">
            <h1>
              <FaUserShield className="header-icon" />
              DBIS Government Portal
            </h1>
          </div>
          
          <div className="header-right">
            {/* Backend Status Checker */}
            <div className="backend-status-container">
              <BackendStatusChecker />
            </div>
            
            {/* Notification Icon */}
            <div className="header-icon-button">
              <FaBell />
              <span className="notification-badge">3</span>
            </div>
            
            {/* No developer mode in production */}
          
            {/* User Profile */}
            {currentUser && (
              <div className="user-profile">
                <div className="user-avatar">
                  {currentUser.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="user-details">
                  <p className="user-name">{currentUser.name || 'Admin'}</p>
                  <p className="user-role">Government Official</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
