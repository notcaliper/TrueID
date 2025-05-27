import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaExclamationCircle, FaShieldAlt } from 'react-icons/fa';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(username, password);
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
            backgroundColor: '#2d2d2d',
            borderRadius: '24px',
            padding: '40px',
            border: '1px solid #404040',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(0,0,0,0) 100%)',
              zIndex: '0'
            }}></div>
            
            <div style={{
              position: 'relative',
              zIndex: '1'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '40px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  backgroundColor: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #6366f1'
                }}>
                  <span style={{
                    color: '#fff',
                    fontSize: '24px',
                    fontWeight: '700',
                    letterSpacing: '2px'
                  }}>DBIS</span>
                </div>
                <div>
                  <h2 style={{
                    color: '#fff',
                    fontSize: '24px',
                    fontWeight: '600',
                    margin: '0 0 4px 0',
                    letterSpacing: '-0.5px'
                  }}>Digital Biometric<br />Identity System</h2>
                  <p style={{
                    color: '#a3a3a3',
                    fontSize: '14px',
                    margin: '0'
                  }}>Government of India</p>
                </div>
              </div>
              
              <h1 style={{
                color: '#fff',
                fontSize: '32px',
                fontWeight: '700',
                margin: '0 0 16px 0',
                letterSpacing: '-0.5px'
              }}>Secure Identity<br />Management Portal</h1>
              
              <p style={{
                color: '#e0e0e0',
                fontSize: '16px',
                lineHeight: '1.6',
                margin: '0 0 24px 0'
              }}>Welcome to the official government portal for digital identity verification and management.</p>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(99,102,241,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(99,102,241,0.2)'
                  }}>
                    <span style={{
                      fontSize: '20px'
                    }}>🔐</span>
                  </div>
                  <div>
                    <h3 style={{
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: '0 0 2px 0'
                    }}>Secure Authentication</h3>
                    <p style={{
                      color: '#a3a3a3',
                      fontSize: '14px',
                      margin: '0'
                    }}>Multi-factor security protocols</p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(99,102,241,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(99,102,241,0.2)'
                  }}>
                    <span style={{
                      fontSize: '20px'
                    }}>📊</span>
                  </div>
                  <div>
                    <h3 style={{
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: '0 0 2px 0'
                    }}>Real-time Analytics</h3>
                    <p style={{
                      color: '#a3a3a3',
                      fontSize: '14px',
                      margin: '0'
                    }}>Comprehensive dashboard insights</p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(99,102,241,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(99,102,241,0.2)'
                  }}>
                    <span style={{
                      fontSize: '20px'
                    }}>⛓️</span>
                  </div>
                  <div>
                    <h3 style={{
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: '0 0 2px 0'
                    }}>Blockchain Verification</h3>
                    <p style={{
                      color: '#a3a3a3',
                      fontSize: '14px',
                      margin: '0'
                    }}>Immutable identity records</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Login Form */}
        <div className="login-form-container" style={{
          flex: '1',
          maxWidth: '450px',
          backgroundColor: '#2d2d2d',
          borderRadius: '24px',
          padding: '40px',
          border: '1px solid #404040',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div className="login-header" style={{
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            <div className="login-logo-container" style={{
              marginBottom: '24px'
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
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#e2e2e2'
              }}>
                Username
              </label>
              <div style={{
                position: 'relative'
              }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
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
