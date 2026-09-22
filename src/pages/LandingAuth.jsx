import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Activity, Zap, Eye, EyeOff, 
  AlertCircle, CheckCircle, ArrowRight, X, Store, Car
} from 'lucide-react';
import { authApi, setToken, getToken } from '../services/api';

export default function LandingAuth() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [loginRole, setLoginRole] = useState(() => {
    // Remember previous role preference or default to shopkeeper if last used
    return localStorage.getItem('gearly_role') || 'user';
  });
  const [signupRole, setSignupRole] = useState('user'); // 'user' or 'shopkeeper'
  const navigate = useNavigate();

  // If already logged in with a valid token, auto-route to dashboard
  useEffect(() => {
    const existing = getToken();
    if (existing) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // Form states
  const [loginForm, setLoginForm] = useState({ username_or_email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone_number: '',
    password: '',
    shop_name: '',
    shop_address: '',
    city: ''
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const showToast = (text, type = 'error') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Comprehensive error parser for Axum & Axios responses
  const parseApiError = (err, defaultMsg = 'Operation failed') => {
    if (err.message === 'Network Error') {
      return {
        title: 'Connection Error',
        message: 'Unable to reach the authentication service. Please ensure gearly-login is running on port 8000.',
        isUserExists: false,
      };
    }

    const data = err.response?.data;
    let rawMsg = '';
    if (typeof data === 'string') {
      rawMsg = data;
    } else if (data && typeof data === 'object') {
      rawMsg = data.error || data.message || data.msg || data.details || JSON.stringify(data);
    } else {
      rawMsg = err.message || defaultMsg;
    }

    // Check if error indicates account already exists
    const isUserExists = 
      /already\s*(exist|existed)/i.test(rawMsg) || 
      /duplicate/i.test(rawMsg) || 
      err.response?.status === 409;

    if (isUserExists) {
      return {
        title: 'Account Already Exists',
        message: 'An account with this phone number, email, or username is already registered. Please sign in instead.',
        isUserExists: true,
      };
    }

    return {
      title: 'Authentication Notice',
      message: rawMsg,
      isUserExists: false,
    };
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const isShop = loginRole === 'shopkeeper';
      const res = isShop
        ? await authApi.loginShopkeeper(loginForm)
        : await authApi.loginUser(loginForm);
      
      let token = res.data;
      if (typeof token === 'string' && token.trim().length > 0) {
        // Save token and explicit role
        setToken(token, isShop ? 'shopkeeper' : 'customer');
        navigate('/dashboard');
      } else {
        const parsed = {
          title: 'Token Error',
          message: 'Login succeeded but server returned an invalid token format.',
          isUserExists: false,
        };
        setFeedback({ type: 'error', ...parsed });
        showToast(parsed.message, 'error');
      }
    } catch (err) {
      const isShop = loginRole === 'shopkeeper';
      const parsed = parseApiError(err, `Login failed for ${isShop ? 'Shopkeeper' : 'Customer'}. Verify your credentials.`);
      
      // Add smart role-switch suggestion if credentials failed
      setFeedback({ 
        type: 'error', 
        ...parsed,
        suggestAltRole: true
      });
      showToast(parsed.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      if (signupRole === 'user') {
        await authApi.signupUser({
          first_name: signupForm.first_name,
          last_name: signupForm.last_name,
          username: signupForm.username,
          email: signupForm.email,
          phone_number: signupForm.phone_number,
          password: signupForm.password,
        });
      } else {
        await authApi.signupShopkeeper({
          first_name: signupForm.first_name || null,
          last_name: signupForm.last_name,
          username: signupForm.username,
          email: signupForm.email || null,
          phone_number: signupForm.phone_number || null,
          password: signupForm.password || null,
          shop_name: signupForm.shop_name || null,
          shop_address: signupForm.shop_address || null,
          city: signupForm.city || null,
        });
      }

      // Seamlessly switch to login tab with the matching role
      setActiveTab('login');
      setLoginRole(signupRole);
      setLoginForm(prev => ({
        ...prev,
        username_or_email: signupForm.username || signupForm.email || signupForm.phone_number || prev.username_or_email,
      }));
      setFeedback({
        type: 'success',
        title: `${signupRole === 'shopkeeper' ? 'Shopkeeper' : 'Customer'} Account Registered!`,
        message: 'Your account has been created. Please enter your password to sign in.',
        isUserExists: false,
      });
      showToast('Account registered successfully! Please sign in.', 'success');
    } catch (err) {
      const parsed = parseApiError(err, 'Signup failed. Please check your details.');
      setFeedback({ type: 'error', ...parsed });
      showToast(parsed.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToLoginFromExistingUser = () => {
    setActiveTab('login');
    setLoginRole(signupRole);
    setLoginForm(prev => ({
      ...prev,
      username_or_email: signupForm.username || signupForm.email || signupForm.phone_number || prev.username_or_email,
    }));
    setFeedback({
      type: 'info',
      title: 'Sign In With Existing Account',
      message: 'Your credentials have been pre-filled. Enter your password to access your account.',
      isUserExists: false,
    });
  };

  const toggleLoginRole = (targetRole) => {
    setLoginRole(targetRole);
    setFeedback(null);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      
      {/* LEFT: Branding & Value Proposition Section */}
      <div 
        className="glass-panel"
        style={{ 
          flex: '1 1 50%', 
          padding: '4rem', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          position: 'relative', 
          overflow: 'hidden',
          borderRadius: 0,
          borderRight: '1px solid var(--border-color)',
          background: 'linear-gradient(145deg, rgba(16, 24, 40, 0.95) 0%, rgba(10, 14, 24, 0.98) 100%)'
        }} 
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3.5rem' }}>
            <div style={{ 
              width: '46px', 
              height: '46px', 
              borderRadius: '14px', 
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(6, 182, 212, 0.5)'
            }}>
              <Car size={26} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '2rem', margin: 0, letterSpacing: '2px', fontWeight: 800 }}>GEARLY</h1>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Next-Gen Automotive Marketplace
              </span>
            </div>
          </div>
          
          <h2 style={{ fontSize: '3.2rem', lineHeight: 1.15, marginBottom: '1.5rem', fontWeight: 800, letterSpacing: '-1px' }}>
            Empowering <span className="text-gradient">auto merchants</span> and precision car owners.
          </h2>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '520px', margin: '0 0 3rem 0' }}>
            A unified automotive ecosystem connecting certified spare parts shopkeepers with car enthusiasts across verified OEM components.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '460px' }}>
            <div className="glass-panel" style={{ padding: '1.2rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              <Store className="text-gradient" size={24} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: '#ffffff' }}>Dedicated Shopkeeper Inventory Portal</strong>
                <span className="text-muted" style={{ fontSize: '0.84rem' }}>Manage stock, OEM part numbers, and live marketplace distribution.</span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.2rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <ShieldCheck className="text-gradient" size={24} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: '#ffffff' }}>Zero-Trust JWT Security</strong>
                <span className="text-muted" style={{ fontSize: '0.84rem' }}>Role-based access control protected by high-throughput Rust Axum APIs.</span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.2rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
              <Zap className="text-gradient" size={24} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: '#ffffff' }}>Real-Time Microservices Architecture</strong>
                <span className="text-muted" style={{ fontSize: '0.84rem' }}>Decoupled services for authentication, catalog, and RabbitMQ events.</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          &copy; {new Date().getFullYear()} Gearly Automotive Systems &bull; Microservices Deployment Active
        </div>
      </div>

      {/* RIGHT: High-Contrast Auth Section */}
      <div style={{ flex: '1 1 50%', padding: '3.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel page-enter" style={{ 
          width: '100%', 
          maxWidth: '520px', 
          padding: '2.5rem', 
          position: 'relative',
          boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
          border: '1px solid rgba(6, 182, 212, 0.25)'
        }}>
          
          {/* Tab Selector: Login vs Create Account */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.8rem' }}>
            <button 
              id="tab-login"
              onClick={() => { setActiveTab('login'); setFeedback(null); }}
              style={{ 
                flex: 1, 
                padding: '0.9rem', 
                background: 'transparent', 
                border: 'none', 
                color: activeTab === 'login' ? '#ffffff' : 'var(--text-muted)', 
                borderBottom: activeTab === 'login' ? '2px solid var(--accent-cyan)' : '2px solid transparent', 
                cursor: 'pointer', 
                fontWeight: 700, 
                fontSize: '1rem',
                transition: 'all 0.2s ease'
              }}
            >
              Sign In
            </button>
            <button 
              id="tab-signup"
              onClick={() => { setActiveTab('signup'); setFeedback(null); }}
              style={{ 
                flex: 1, 
                padding: '0.9rem', 
                background: 'transparent', 
                border: 'none', 
                color: activeTab === 'signup' ? '#ffffff' : 'var(--text-muted)', 
                borderBottom: activeTab === 'signup' ? '2px solid var(--accent-cyan)' : '2px solid transparent', 
                cursor: 'pointer', 
                fontWeight: 700, 
                fontSize: '1rem',
                transition: 'all 0.2s ease'
              }}
            >
              Create Account
            </button>
          </div>

          {/* High-Visibility Feedback Banner */}
          {feedback && (
            <div 
              className={feedback.type === 'success' ? 'bg-success' : 'bg-danger'}
              style={{ 
                padding: '1.1rem 1.3rem', 
                borderRadius: '10px', 
                marginBottom: '1.5rem', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.6rem',
                animation: 'fadeIn 0.25s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                {feedback.type === 'success' ? (
                  <CheckCircle size={22} style={{ color: '#34d399', flexShrink: 0, marginTop: '2px' }} />
                ) : (
                  <AlertCircle size={22} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
                )}
                
                <div style={{ flex: 1 }}>
                  {feedback.title && (
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: '#ffffff', marginBottom: '0.2rem' }}>
                      {feedback.title}
                    </strong>
                  )}
                  <span style={{ fontSize: '0.88rem', lineHeight: 1.5, display: 'block' }}>
                    {feedback.message}
                  </span>
                </div>

                <button 
                  onClick={() => setFeedback(null)} 
                  style={{ background: 'transparent', border: 'none', color: 'inherit', opacity: 0.7, cursor: 'pointer', padding: '2px' }}
                  title="Dismiss"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 1-Click Action to Switch to Login if User Already Exists */}
              {feedback.isUserExists && activeTab === 'signup' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.6rem', borderTop: '1px solid rgba(239, 68, 68, 0.3)', marginTop: '0.3rem' }}>
                  <button
                    type="button"
                    onClick={handleSwitchToLoginFromExistingUser}
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.84rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                  >
                    <span>Sign In With This Account</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {/* Smart Fallback Hint if Login Role might be mismatched */}
              {feedback.suggestAltRole && activeTab === 'login' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.6rem', borderTop: '1px solid rgba(239, 68, 68, 0.3)', marginTop: '0.3rem', fontSize: '0.82rem' }}>
                  <span style={{ opacity: 0.9 }}>
                    Registered under the other account type?
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleLoginRole(loginRole === 'shopkeeper' ? 'user' : 'shopkeeper')}
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.15)', 
                      border: '1px solid rgba(255, 255, 255, 0.3)', 
                      color: '#ffffff', 
                      padding: '3px 8px', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    Switch to {loginRole === 'shopkeeper' ? 'Customer' : 'Shopkeeper'} Login &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 1: LOGIN FORM                                                */}
          {/* ================================================================ */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Prominent High-Contrast Role Selector */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Select Access Portal:
                  </span>
                  <span style={{ 
                    fontSize: '0.74rem', 
                    color: loginRole === 'shopkeeper' ? '#60a5fa' : '#34d399', 
                    fontWeight: 800,
                    textTransform: 'uppercase'
                  }}>
                    {loginRole === 'shopkeeper' ? '🏪 Merchant Inventory Mode' : '👤 Public Buyer Mode'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <div 
                    id="login-role-customer"
                    onClick={() => toggleLoginRole('user')}
                    className={`glass-panel ${loginRole === 'user' ? 'btn-emerald-active' : ''}`}
                    style={{ 
                      flex: 1, 
                      padding: '1rem 0.8rem', 
                      textAlign: 'center', 
                      cursor: 'pointer', 
                      transition: 'all 0.2s ease', 
                      borderRadius: '10px',
                      border: loginRole === 'user' ? '2px solid #10b981' : '1px solid var(--border-color)',
                      background: loginRole === 'user' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>👤</div>
                    <strong style={{ display: 'block', fontSize: '0.92rem', color: loginRole === 'user' ? '#34d399' : '#ffffff' }}>Customer</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Buy parts / Browse</span>
                  </div>

                  <div 
                    id="login-role-shopkeeper"
                    onClick={() => toggleLoginRole('shopkeeper')}
                    className={`glass-panel ${loginRole === 'shopkeeper' ? 'btn-blue-active' : ''}`}
                    style={{ 
                      flex: 1, 
                      padding: '1rem 0.8rem', 
                      textAlign: 'center', 
                      cursor: 'pointer', 
                      transition: 'all 0.2s ease', 
                      borderRadius: '10px',
                      border: loginRole === 'shopkeeper' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                      background: loginRole === 'shopkeeper' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>🏪</div>
                    <strong style={{ display: 'block', fontSize: '0.92rem', color: loginRole === 'shopkeeper' ? '#60a5fa' : '#ffffff' }}>Shopkeeper</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Manage store stock</span>
                  </div>
                </div>
              </div>

              <div>
                <label>Email or Username</label>
                <input 
                  id="login-username"
                  type="text" 
                  required 
                  value={loginForm.username_or_email} 
                  onChange={(e) => setLoginForm({...loginForm, username_or_email: e.target.value})}
                  placeholder="e.g. arunjot or merchant@gearly.in"
                />
              </div>

              <div style={{ position: 'relative' }}>
                <label>Password</label>
                <input 
                  id="login-password"
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={loginForm.password} 
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ position: 'absolute', right: '1rem', top: '2.2rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button 
                id="submit-login-btn"
                type="submit" 
                className="btn btn-primary" 
                disabled={loading} 
                style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.85rem',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  background: loginRole === 'shopkeeper' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'linear-gradient(135deg, #059669, #10b981)'
                }}
              >
                {loading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} className="animate-spin" />
                    Authenticating {loginRole === 'shopkeeper' ? 'Shopkeeper' : 'Customer'}...
                  </span>
                ) : (
                  `Sign In as ${loginRole === 'shopkeeper' ? 'Shopkeeper (Merchant)' : 'Customer (Buyer)'}`
                )}
              </button>
            </form>
          ) : (
            /* ================================================================ */
            /* TAB 2: SIGNUP FORM                                               */
            /* ================================================================ */
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Role Selection for Account Registration */}
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>
                  Account Type:
                </span>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <div 
                    id="signup-role-customer"
                    onClick={() => setSignupRole('user')}
                    style={{ 
                      flex: 1, 
                      padding: '1rem 0.8rem', 
                      textAlign: 'center', 
                      cursor: 'pointer', 
                      transition: 'all 0.2s ease', 
                      borderRadius: '10px',
                      border: signupRole === 'user' ? '2px solid #10b981' : '1px solid var(--border-color)',
                      background: signupRole === 'user' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>👤</div>
                    <strong style={{ display: 'block', color: signupRole === 'user' ? '#34d399' : '#ffffff' }}>Customer</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Buy car parts</span>
                  </div>

                  <div 
                    id="signup-role-shopkeeper"
                    onClick={() => setSignupRole('shopkeeper')}
                    style={{ 
                      flex: 1, 
                      padding: '1rem 0.8rem', 
                      textAlign: 'center', 
                      cursor: 'pointer', 
                      transition: 'all 0.2s ease', 
                      borderRadius: '10px',
                      border: signupRole === 'shopkeeper' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                      background: signupRole === 'shopkeeper' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>🏪</div>
                    <strong style={{ display: 'block', color: signupRole === 'shopkeeper' ? '#60a5fa' : '#ffffff' }}>Shopkeeper</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sell car parts</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>First Name</label>
                  <input type="text" value={signupForm.first_name} onChange={(e) => setSignupForm({...signupForm, first_name: e.target.value})} placeholder="e.g. Rahul" required={signupRole === 'user'} />
                </div>
                <div>
                  <label>Last Name *</label>
                  <input type="text" required value={signupForm.last_name} onChange={(e) => setSignupForm({...signupForm, last_name: e.target.value})} placeholder="e.g. Sharma" />
                </div>
              </div>

              {signupRole === 'shopkeeper' && (
                <>
                  <div>
                    <label>Shop / Business Name *</label>
                    <input type="text" required value={signupForm.shop_name} onChange={(e) => setSignupForm({...signupForm, shop_name: e.target.value})} placeholder="e.g. Apex Auto Spares" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label>Shop Address</label>
                      <input type="text" value={signupForm.shop_address} onChange={(e) => setSignupForm({...signupForm, shop_address: e.target.value})} placeholder="e.g. Shop 14, Auto Market" />
                    </div>
                    <div>
                      <label>City</label>
                      <input type="text" value={signupForm.city} onChange={(e) => setSignupForm({...signupForm, city: e.target.value})} placeholder="e.g. Mohali" />
                    </div>
                  </div>
                </>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Username *</label>
                  <input type="text" required value={signupForm.username} onChange={(e) => setSignupForm({...signupForm, username: e.target.value})} placeholder="unique_user" />
                </div>
                <div>
                  <label>Phone Number (10 digits) *</label>
                  <input type="text" required maxLength={10} value={signupForm.phone_number} onChange={(e) => setSignupForm({...signupForm, phone_number: e.target.value})} placeholder="9876543210" />
                </div>
              </div>

              <div>
                <label>Email Address *</label>
                <input type="email" required value={signupForm.email} onChange={(e) => setSignupForm({...signupForm, email: e.target.value})} placeholder="name@example.com" />
              </div>

              <div style={{ position: 'relative' }}>
                <label>Password *</label>
                <input type={showPassword ? "text" : "password"} required value={signupForm.password} onChange={(e) => setSignupForm({...signupForm, password: e.target.value})} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '2.2rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button 
                id="submit-signup-btn"
                type="submit" 
                className="btn btn-primary" 
                disabled={loading} 
                style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.85rem',
                  fontWeight: 700,
                  background: signupRole === 'shopkeeper' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'linear-gradient(135deg, #059669, #10b981)'
                }}
              >
                {loading ? <span className="animate-spin"><Activity size={18} /></span> : `Register as ${signupRole === 'shopkeeper' ? 'Shopkeeper' : 'Customer'}`}
              </button>
            </form>
          )}

        </div>
      </div>

      {/* High-Visibility Floating Toast Notification */}
      {toastMessage && (
        <div className="animate-fade-in" style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100,
          padding: '0.95rem 1.4rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: toastMessage.type === 'error' ? 'rgba(239, 68, 68, 0.96)' : 'rgba(16, 185, 129, 0.96)',
          backdropFilter: 'blur(12px)',
          color: '#ffffff',
          boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
          fontWeight: 600,
          fontSize: '0.9rem',
          maxWidth: '420px'
        }}>
          {toastMessage.type === 'error' ? <AlertCircle size={19} style={{ flexShrink: 0 }} /> : <CheckCircle size={19} style={{ flexShrink: 0 }} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

    </div>
  );
}
