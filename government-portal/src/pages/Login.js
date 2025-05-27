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

  // Add animation styles to head
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(2deg); }
      }
      
      @keyframes shine {
        0% { transform: translateX(-100%) rotate(45deg); }
        50%, 100% { transform: translateX(100%) rotate(45deg); }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      
      @media (max-width: 1024px) {
        .login-branding {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="login-container" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1a1a1a',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      position: 'relative',
      overflow: 'hidden',
      backgroundImage: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(0,0,0,0) 100%)'
    }}>
      {/* Background Elements */}
      <div className="login-background" style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: '0'
      }}>
        <div className="login-shape" style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.03) 0%, rgba(99,102,241,0) 70%)',
          borderRadius: '50%',
          animation: 'float 20s infinite ease-in-out'
        }}></div>
        <div className="login-shape" style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-15%',
          width: '1000px',
          height: '1000px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.03) 0%, rgba(99,102,241,0) 70%)',
          borderRadius: '50%',
          animation: 'float 25s infinite ease-in-out reverse'
        }}></div>
      </div>
      
      <div className="login-content" style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 24px',
        display: 'flex',
        gap: '48px',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: '1'
      }}>
        {/* Left Side - Government Branding */}
        <div className="login-branding" style={{
          flex: '1',
          maxWidth: '500px',
          display: 'none',
          '@media (min-width: 1024px)': {
            display: 'block'
          }
        }}>
          <div style={{
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 24px',
              position: 'relative'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '24px',
                backgroundColor: '#2d2d2d',
                transform: 'rotate(45deg)',
                position: 'absolute',
                border: '2px solid #404040'
              }}></div>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#6366f1',
                fontSize: '48px',
                fontWeight: '700'
              }}>
                DBIS
              </div>
            </div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '16px',
              letterSpacing: '-0.5px'
            }}>
              Government of India
            </h1>
            <p style={{
              fontSize: '18px',
              color: '#a3a3a3',
              lineHeight: '1.6'
            }}>
              Decentralized Biometric Identity System Portal
            </p>
          </div>

          <div style={{
            padding: '32px',
            backgroundColor: '#2d2d2d',
            borderRadius: '16px',
            border: '1px solid #404040'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '16px'
            }}>Secure Government Access</h2>
            <ul style={{
              listStyle: 'none',
              padding: '0',
              margin: '0',
              color: '#a3a3a3'
            }}>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                fontSize: '14px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(99,102,241,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6366f1'
                }}>1</div>
                End-to-end encrypted data transmission
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                fontSize: '14px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(99,102,241,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6366f1'
                }}>2</div>
                Multi-factor authentication
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                fontSize: '14px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(99,102,241,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6366f1'
                }}>3</div>
                Blockchain-based identity verification
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-card" style={{
          backgroundColor: '#2d2d2d',
          borderRadius: '24px',
          padding: '48px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          border: '1px solid #404040'
        }}>
          <div className="login-header" style={{
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            <div className="login-logo-container" onClick={handleLogoClick} style={{
              marginBottom: '24px',
              cursor: 'pointer'
            }}>
              <div className="login-logo-circle" style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                backgroundColor: '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                border: '2px solid #6366f1',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  width: '150%',
                  height: '150%',
                  background: 'linear-gradient(45deg, transparent 40%, rgba(99,102,241,0.2) 50%, transparent 60%)',
                  animation: 'shine 3s infinite'
                }}></div>
                <span className="login-logo-text" style={{
                  color: '#fff',
                  fontSize: '24px',
                  fontWeight: '700',
                  letterSpacing: '2px',
                  position: 'relative'
                }}>DBIS</span>
              </div>
            </div>
            <h1 className="login-title" style={{
              color: '#fff',
              fontSize: '24px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              letterSpacing: '-0.5px'
            }}>Welcome Back</h1>
            <p className="login-subtitle" style={{
              color: '#a3a3a3',
              fontSize: '16px',
              margin: '0'
            }}>Sign in to your secure account</p>
          </div>
          
          {error && (
            <div className="error-message" style={{
              backgroundColor: '#2c1519',
              color: '#f87171',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              border: '1px solid #451a1a',
              animation: 'shake 0.5s'
            }}>
              <FaExclamationCircle style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="login-form" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <div className="form-group" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <label htmlFor="email" style={{
                color: '#a3a3a3',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FaUser style={{ color: '#6366f1' }} />
                Email Address
              </label>
              <div style={{
                position: 'relative'
              }}>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter your government email"
                  autoComplete="email"
                  required
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    paddingLeft: '40px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    width: '100%',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    ':focus': {
                      borderColor: '#6366f1',
                      boxShadow: '0 0 0 2px rgba(99,102,241,0.2)'
                    }
                  }}
                />
                <FaUser style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                  pointerEvents: 'none'
                }} />
              </div>
            </div>
            
            <div className="form-group" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <label htmlFor="password" style={{
                color: '#a3a3a3',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FaLock style={{ color: '#6366f1' }} />
                Password
              </label>
              <div style={{
                position: 'relative'
              }}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter your secure password"
                  autoComplete="current-password"
                  required
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    paddingLeft: '40px',
                    paddingRight: '40px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    width: '100%',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    ':focus': {
                      borderColor: '#6366f1',
                      boxShadow: '0 0 0 2px rgba(99,102,241,0.2)'
                    }
                  }}
                />
                <FaLock style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                  pointerEvents: 'none'
                }} />
                <button 
                  type="button" 
                  onClick={togglePasswordVisibility}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    transition: 'color 0.2s ease',
                    ':hover': {
                      color: '#6366f1'
                    }
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <div className="form-actions" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginTop: '8px'
            }}>
              <button 
                type="submit" 
                disabled={isLoading}
                style={{
                  backgroundColor: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  opacity: isLoading ? '0.7' : '1',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {isLoading ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <FaShieldAlt />
                    <span>Secure Login</span>
                  </>
                )}
              </button>
              
              <div style={{
                height: '1px',
                backgroundColor: '#404040',
                margin: '8px 0',
                position: 'relative'
              }}>
                <span style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: '#2d2d2d',
                  padding: '0 16px',
                  color: '#6b7280',
                  fontSize: '12px'
                }}>Secure Access</span>
              </div>
              
              {showDevOptions && (
                <button 
                  type="button" 
                  onClick={handleDevModeActivate}
                  style={{
                    backgroundColor: '#374151',
                    color: '#e0e0e0',
                    border: '1px solid #404040',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FaCode />
                  <span>Developer Access</span>
                </button>
              )}
            </div>
          </form>
          
          <div className="login-footer" style={{
            marginTop: '32px',
            textAlign: 'center'
          }}>
            <p style={{
              color: '#a3a3a3',
              fontSize: '14px',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <span style={{
                fontSize: '16px'
              }}>🔒</span>
              <span>Government Secure Access Portal</span>
            </p>
            <p style={{
              color: '#6b7280',
              fontSize: '12px',
              margin: '0'
            }}>
              &copy; {new Date().getFullYear()} Department of Identity Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
