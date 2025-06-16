import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { useTheme } from '../utils/ThemeContext';
import { RiMenuFoldLine, RiMenuUnfoldLine, RiDashboardLine, RiFileUserLine,
         RiShieldUserLine, RiAccountCircleLine, RiAwardLine, RiBillLine,
         RiSettingsLine, RiLogoutBoxLine, RiSunLine, RiMoonLine, RiUser3Line,
         RiNotificationLine } from 'react-icons/ri';

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
          <h2 className="sidebar-title" title="TrueID Admin">
            <RiShieldUserLine className="logo-icon" />
          </h2>
          {devMode && sidebarOpen && <span className="dev-badge"><RiAccountCircleLine /> DEV</span>}
          <button 
            onClick={toggleSidebar}
            className="sidebar-toggle"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <RiMenuFoldLine /> : <RiMenuUnfoldLine />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {sidebarOpen && <div className="nav-section-title">MAIN NAVIGATION</div>}
          <ul>
            <li title="Dashboard">
              <NavLink
                to="/dashboard"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                {!sidebarOpen && <span className="tooltip">Dashboard</span>}
                <RiDashboardLine className="nav-icon" />
                {sidebarOpen && <span>Dashboard</span>}
              </NavLink>
            </li>
            <li title="User Records">
              <NavLink
                to="/records"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <RiFileUserLine className="nav-icon" />
                {sidebarOpen && <span>User Records</span>}
              </NavLink>
            </li>
            <li title="Professional Records">
              <NavLink
                to="/professional-records"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <RiAwardLine className="nav-icon" />
                {sidebarOpen && <span>Professional Records</span>}
              </NavLink>
            </li>
            <li title="Face Verification">
              <NavLink
                to="/face-verification"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <RiUser3Line className="nav-icon" />
                {sidebarOpen && <span>Face Verification</span>}
              </NavLink>
            </li>
            <li title="Activity Logs">
              <NavLink
                to="/activity-logs"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <RiBillLine className="nav-icon" />
                {sidebarOpen && <span>Activity Logs</span>}
              </NavLink>
            </li>
            
            {sidebarOpen && <div className="nav-section-title">SYSTEM</div>}
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <RiSettingsLine className="nav-icon" />
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
                  <RiAccountCircleLine className="nav-icon" />
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
            <RiLogoutBoxLine className="nav-icon" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="main-header">
          <div className="header-left">
            <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle menu">
              {sidebarOpen ? <RiMenuFoldLine /> : <RiMenuUnfoldLine />}
            </button>
            <h1>Government Portal</h1>
          </div>
          
          <div className="header-right">
            {/* Theme Toggle Button */}
            <div className="header-icon-button theme-toggle" onClick={toggleTheme} title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
              {isDarkMode ? <RiSunLine /> : <RiMoonLine />}
            </div>
            
            {/* Notification Icon */}
            <div className="header-icon-button" title="Notifications">
              <RiNotificationLine />
              <span className="notification-badge">3</span>
            </div>
            
            {/* User Profile */}
            <div className="header-avatar" title={currentUser?.username}>
              <RiAccountCircleLine />
            </div>
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
