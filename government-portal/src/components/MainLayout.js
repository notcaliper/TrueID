import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { useTheme } from '../utils/ThemeContext';
import { FaChevronLeft, FaChevronRight, FaTachometerAlt, 
         FaHistory, FaCog, FaSignOutAlt, FaCode, FaToggleOn, FaToggleOff,
         FaShieldAlt, FaBell, FaUserShield, FaIdCard,
         FaSun, FaMoon } from 'react-icons/fa';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDevControls, setShowDevControls] = useState(false);
  const { currentUser, logout, devMode, toggleDevMode } = useAuth();
  const { toggleTheme, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const toggleDevControls = () => {
    setShowDevControls(prev => !prev);
  };

  return (
    <div className={`main-layout ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">
            <FaShieldAlt className="logo-icon" />
            TrueID Admin
          </h2>
          {devMode && sidebarOpen && <span className="dev-badge"><FaCode /> DEV</span>}
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
                to="/dashboard"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <FaTachometerAlt className="nav-icon" />
                {sidebarOpen && <span>Dashboard</span>}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/records"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <FaIdCard className="nav-icon" />
                {sidebarOpen && <span>User Records</span>}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/activity-logs"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <FaHistory className="nav-icon" />
                {sidebarOpen && <span>Activity Logs</span>}
              </NavLink>
            </li>
            
            {sidebarOpen && <div className="nav-section-title">SYSTEM</div>}
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <FaCog className="nav-icon" />
                {sidebarOpen && <span>Settings</span>}
              </NavLink>
            </li>
            
            {/* Developer Mode Toggle (only visible when sidebar is open) */}
            {sidebarOpen && devMode && (
              <li className="dev-mode-menu-item">
                <button 
                  className="dev-mode-menu-button"
                  onClick={toggleDevControls}
                >
                  <FaCode className="nav-icon" />
                  <span>Developer Tools</span>
                </button>
              </li>
            )}
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
              TrueID Government Portal
            </h1>
          </div>
          
          <div className="header-right">
            {/* Theme Toggle Button */}
            <div className="header-icon-button theme-toggle" onClick={toggleTheme} title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </div>
            
            {/* Notification Icon */}
            <div className="header-icon-button">
              <FaBell />
              <span className="notification-badge">3</span>
            </div>
            
            {/* Developer Mode Indicator - Always visible when dev mode is active */}
            {devMode && (
              <div className="dev-mode-indicator" onClick={toggleDevControls}>
                <FaCode className="dev-icon" />
                <span>Developer Mode</span>
              </div>
            )}
          
          {/* Developer Controls Panel - Only visible when toggled */}
          {showDevControls && devMode && (
            <div className="dev-controls-panel">
              <div className="dev-controls-header">
                <h3>
                  <FaCode className="dev-controls-icon" />
                  Developer Controls
                </h3>
                <button 
                  className="dev-controls-close" 
                  onClick={toggleDevControls}
                  aria-label="Close developer controls"
                >
                  &times;
                </button>
              </div>
              
              <div className="dev-controls-body">
                <div className="dev-control-item">
                  <span className="dev-control-label">Developer Mode</span>
                  <button 
                    className="dev-mode-toggle-button" 
                    onClick={toggleDevMode}
                    aria-label="Toggle developer mode"
                  >
                    {devMode ? 
                      <FaToggleOn className="toggle-icon on" /> : 
                      <FaToggleOff className="toggle-icon off" />
                    }
                    <span>{devMode ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>
                
                <div className="dev-info-item">
                  <span className="dev-info-label">User ID:</span>
                  <span className="dev-info-value">{currentUser?.id || 'dev-admin'}</span>
                </div>
                
                <div className="dev-info-item">
                  <span className="dev-info-label">Current Path:</span>
                  <span className="dev-info-value">{location.pathname}</span>
                </div>
              </div>
            </div>
          )}
          
            {/* User Profile */}
            {currentUser && (
              <div className="user-profile">
                <div className="user-avatar">
                  {currentUser.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="user-details">
                  <p className="user-name">{currentUser.name || 'Admin'}</p>
                  <p className="user-role">
                    {devMode ? 'Developer' : 'Government Official'}
                    {devMode && <span className="dev-badge-small"><FaCode /></span>}
                  </p>
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
