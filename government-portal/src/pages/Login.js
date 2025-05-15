import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaExclamationCircle, FaShieldAlt, FaCode, FaToggleOn, FaToggleOff } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDevOptions, setShowDevOptions] = useState(false);
  const [devClickCount, setDevClickCount] = useState(0);
  const { login, currentUser, devMode, toggleDevMode, enableDevMode } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Reset dev click count after 3 seconds of inactivity
  useEffect(() => {
    if (devClickCount > 0) {
      const timer = setTimeout(() => {
        setDevClickCount(0);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [devClickCount]);

  // Check for dev mode activation (5 rapid clicks on the logo)
  const handleLogoClick = () => {
    setDevClickCount(prevCount => {
      const newCount = prevCount + 1;
      if (newCount >= 5) {
        setShowDevOptions(true);
        return 0;
      }
      return newCount;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleDevModeActivate = () => {
    enableDevMode();
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-shape"></div>
        <div className="login-shape"></div>
      </div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-container" onClick={handleLogoClick}>
            <div className="login-logo-circle">
              <span className="login-logo-text">DBIS</span>
            </div>
          </div>
          <h1 className="login-title">DBIS Government Portal</h1>
          <p className="login-subtitle">Decentralized Biometric Identity System</p>
        </div>
        
        {error && (
          <div className="error-message">
            <FaExclamationCircle className="error-icon" />
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <FaUser className="form-label-icon" />
              Email Address
            </label>
            <div className="input-container">
              <input
                type="email"
                id="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="Enter your government email"
                autoComplete="email"
                required
              />
              <span className="input-focus-border"></span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <FaLock className="form-label-icon" />
              Password
            </label>
            <div className="input-container password-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Enter your secure password"
                autoComplete="current-password"
                required
              />
              <button 
                type="button" 
                className="password-toggle" 
                onClick={togglePasswordVisibility}
                tabIndex="-1"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              <span className="input-focus-border"></span>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="button button-primary">
              {isLoading ? (
                <>
                  <div className="button-spinner"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <FaShieldAlt className="button-icon" />
                  <span>Secure Login</span>
                </>
              )}
            </button>
            
            <div className="dev-mode-divider"></div>
            
            <button 
              type="button" 
              className="dev-bypass-button"
              onClick={handleDevModeActivate}
            >
              <FaCode className="dev-bypass-icon" />
              <span>Developer Bypass</span>
            </button>
          </div>
        </form>
        
        <div className="login-footer">
          <p className="security-note">
            <span className="security-icon">🔒</span>
            <span>Secure Government Access Portal</span>
          </p>
          <p className="copyright">
            &copy; {new Date().getFullYear()} Department of Identity Management
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
