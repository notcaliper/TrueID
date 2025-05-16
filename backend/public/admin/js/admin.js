/**
 * DBIS Admin Dashboard Core JavaScript
 */

// Global variables
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Check if user is authenticated
function checkAuth() {
  if (!authToken) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Logout function
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  window.location.href = 'login.html';
}

// Fetch current admin user info
async function fetchCurrentUser() {
  if (!checkAuth()) return;
  
  try {
    const response = await fetch('/api/admin/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      // Token expired, try to refresh
      const refreshed = await refreshToken();
      if (refreshed) {
        return fetchCurrentUser();
      } else {
        logout();
        return;
      }
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const data = await response.json();
    currentUser = data.admin;
    
    // Update UI with user info
    updateUserUI();
    
    return currentUser;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    showToast('error', 'Failed to load user profile');
  }
}

// Refresh token
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    return false;
  }
  
  try {
    const response = await fetch('/api/admin/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    authToken = data.token;
    
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}

// Update UI with user info
function updateUserUI() {
  const userNameElement = document.getElementById('user-name');
  const userRoleElement = document.getElementById('user-role');
  
  if (userNameElement && currentUser) {
    userNameElement.textContent = currentUser.name;
  }
  
  if (userRoleElement && currentUser) {
    userRoleElement.textContent = currentUser.role;
  }
}

// Show toast notification
function showToast(type, message) {
  // Implementation depends on your UI framework
  console.log(`${type.toUpperCase()}: ${message}`);
}

// Initialize dashboard
function initDashboard() {
  // Check authentication
  if (!checkAuth()) return;
  
  // Fetch current user
  fetchCurrentUser();
  
  // Setup logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);
