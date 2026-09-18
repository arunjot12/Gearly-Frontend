import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Lock, Activity, Zap, Wrench, Eye, EyeOff, 
  AlertCircle, CheckCircle, ArrowRight, X 
} from 'lucide-react';
import { authApi, setToken } from '../services/api';

export default function LandingAuth() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [loginRole, setLoginRole] = useState('user'); // 'user' or 'shopkeeper'
  const [signupRole, setSignupRole] = useState('user'); // 'user' or 'shopkeeper'
  const navigate = useNavigate();

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
  // feedback: { type: 'error' | 'success' | 'info', title?: string, message: string, isUserExists?: boolean } | null
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

    // Check if error indicates user/account already exists
    const isUserExists = 
      /already\s*(exist|existed)/i.test(rawMsg) || 
      /duplicate/i.test(rawMsg) || 
      err.response?.status === 409;

    if (isUserExists) {
      return {
        title: 'Account Already Exists',
        message: 'A user or shopkeeper with this phone number, email, or username is already registered. Please sign in instead.',
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
      const res = loginRole === 'shopkeeper'
        ? await authApi.loginShopkeeper(loginForm)
        : await authApi.loginUser(loginForm);
      
      // Axum returns raw JSON string for JWT
      let token = res.data;
      if (typeof token === 'string') {
        setToken(token);
        navigate('/dashboard');
      } else {
        const parsed = {
          title: 'Token Error',
          message: 'Login succeeded but token format returned by server is invalid.',
          isUserExists: false,
        };
        setFeedback({ type: 'error', ...parsed });
        showToast(parsed.message, 'error');
      }
    } catch (err) {
      const parsed = parseApiError(err, 'Login failed. Please verify your credentials.');
      setFeedback({ type: 'error', ...parsed });
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

      // Switch back to login on success
      setActiveTab('login');
      setLoginRole(signupRole);
      setLoginForm(prev => ({
        ...prev,
        username_or_email: signupForm.username || signupForm.email || signupForm.phone_number || prev.username_or_email,
      }));
      setFeedback({
        type: 'success',
        title: 'Account Created Successfully!',
        message: 'Your account has been registered. Please sign in with your password.',
        isUserExists: false,
      });
      showToast('Account created successfully! Please sign in.', 'success');
    } catch (err) {
      const parsed = parseApiError(err, 'Signup failed. Please check your details.');
      setFeedback({ type: 'error', ...parsed });
      showToast(parsed.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper when user already exists: seamlessly switches to Login tab and pre-fills credentials
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
      message: 'Your username or email has been pre-filled. Enter your password to access your account.',
      isUserExists: false,
    });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      
      {/* LEFT: Branding Section */}
      <div style={{ flex: 1, padding: '4rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }} className="glass-panel">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '4rem' }}>
            <Wrench size={32} className="text-gradient" />
            <h1 style={{ fontSize: '2rem', margin: 0, letterSpacing: '2px' }}>GEARLY</h1>
          </div>
          
          <h2 style={{ fontSize: '3.5rem', lineHeight: 1.1, marginBottom: '1.5rem', fontWeight: 700 }}>
            Your gateway to the <span className="text-gradient">automotive parts marketplace.</span>
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '4rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '400px' }}>
              <ShieldCheck className="text-gradient" size={24} />
              <div><strong style={{ display: 'block' }}>Secure authentication</strong><span className="text-muted" style={{ fontSize: '0.9rem' }}>End-to-end security</span></div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '400px' }}>
              <Lock className="text-gradient" size={24} />
              <div><strong style={{ display: 'block' }}>JWT protected APIs</strong><span className="text-muted" style={{ fontSize: '0.9rem' }}>Axum middleware integration</span></div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '400px' }}>
              <Zap className="text-gradient" size={24} />
              <div><strong style={{ display: 'block' }}>Fast & reliable backend</strong><span className="text-muted" style={{ fontSize: '0.9rem' }}>Powered by Rust</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Auth Section */}
      <div style={{ flex: 1, padding: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
        <div className="glass-panel page-enter" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', position: 'relative' }}>
          
          {/* Tab Selector: Login vs Create Account */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.8rem' }}>
            <button 
              onClick={() => { setActiveTab('login'); setFeedback(null); }}
              style={{ flex: 1, padding: '1rem', background: 'transparent', border: 'none', color: activeTab === 'login' ? 'white' : 'var(--text-muted)', borderBottom: activeTab === 'login' ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)', fontSize: '1rem' }}
            >
              Login
            </button>
            <button 
              onClick={() => { setActiveTab('signup'); setFeedback(null); }}
              style={{ flex: 1, padding: '1rem', background: 'transparent', border: 'none', color: activeTab === 'signup' ? 'white' : 'var(--text-muted)', borderBottom: activeTab === 'signup' ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)', fontSize: '1rem' }}
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
                  title="Dismiss notification"
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
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.25rem' }}>
                <div 
                  onClick={() => setLoginRole('user')}
                  className={`glass-panel ${loginRole === 'user' ? 'btn-primary' : ''}`}
                  style={{ flex: 1, padding: '0.85rem', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)', border: loginRole === 'user' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)' }}
                >
                  <div style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>👤</div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Customer</strong>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Login as user</span>
                </div>
                <div 
                  onClick={() => setLoginRole('shopkeeper')}
                  className={`glass-panel ${loginRole === 'shopkeeper' ? 'btn-primary' : ''}`}
                  style={{ flex: 1, padding: '0.85rem', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)', border: loginRole === 'shopkeeper' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)' }}
                >
                  <div style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>🏪</div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Shopkeeper</strong>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Manage inventory</span>
                </div>
              </div>

              <div>
                <label>Email or Username</label>
                <input 
                  type="text" required 
                  value={loginForm.username_or_email} onChange={(e) => setLoginForm({...loginForm, username_or_email: e.target.value})}
                  placeholder="name@example.com or username"
                />
              </div>

              <div style={{ position: 'relative' }}>
                <label>Password</label>
                <input 
                  type={showPassword ? "text" : "password"} required 
                  value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '2.2rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Inline Error Notice above submit button if error is active */}
              {feedback && feedback.type === 'error' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontSize: '0.82rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 0.8rem', borderRadius: '7px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{feedback.message}</span>
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
                {loading ? <span className="animate-spin"><Activity size={18} /></span> : 'Sign In'}
              </button>
            </form>
          ) : (
            /* SIGNUP FORM */
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                <div 
                  onClick={() => setSignupRole('user')}
                  className={`glass-panel ${signupRole === 'user' ? 'btn-primary' : ''}`}
                  style={{ flex: 1, padding: '1rem', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)', border: signupRole === 'user' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)' }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👤</div>
                  <strong style={{ display: 'block' }}>Customer</strong>
                  <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Buy car parts</span>
                </div>
                <div 
                  onClick={() => setSignupRole('shopkeeper')}
                  className={`glass-panel ${signupRole === 'shopkeeper' ? 'btn-primary' : ''}`}
                  style={{ flex: 1, padding: '1rem', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)', border: signupRole === 'shopkeeper' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)' }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏪</div>
                  <strong style={{ display: 'block' }}>Shopkeeper</strong>
                  <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Sell car parts</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>First Name</label>
                  <input type="text" value={signupForm.first_name} onChange={(e) => setSignupForm({...signupForm, first_name: e.target.value})} placeholder="John" required={signupRole === 'user'} />
                </div>
                <div>
                  <label>Last Name *</label>
                  <input type="text" required value={signupForm.last_name} onChange={(e) => setSignupForm({...signupForm, last_name: e.target.value})} placeholder="Doe" />
                </div>
              </div>

              {signupRole === 'shopkeeper' && (
                <>
                  <div>
                    <label>Shop Name</label>
                    <input type="text" value={signupForm.shop_name} onChange={(e) => setSignupForm({...signupForm, shop_name: e.target.value})} placeholder="e.g. Apex Auto Spares" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label>Shop Address</label>
                      <input type="text" value={signupForm.shop_address} onChange={(e) => setSignupForm({...signupForm, shop_address: e.target.value})} placeholder="123 Main St" />
                    </div>
                    <div>
                      <label>City</label>
                      <input type="text" value={signupForm.city} onChange={(e) => setSignupForm({...signupForm, city: e.target.value})} placeholder="Mohali" />
                    </div>
                  </div>
                </>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Username *</label>
                  <input type="text" required value={signupForm.username} onChange={(e) => setSignupForm({...signupForm, username: e.target.value})} placeholder="username" />
                </div>
                <div>
                  <label>Phone Number (10 digits) *</label>
                  <input type="text" required maxLength={10} value={signupForm.phone_number} onChange={(e) => setSignupForm({...signupForm, phone_number: e.target.value})} placeholder="9876543210" />
                </div>
              </div>

              <div>
                <label>Email *</label>
                <input type="email" required value={signupForm.email} onChange={(e) => setSignupForm({...signupForm, email: e.target.value})} placeholder="name@example.com" />
              </div>

              <div style={{ position: 'relative' }}>
                <label>Password *</label>
                <input type={showPassword ? "text" : "password"} required value={signupForm.password} onChange={(e) => setSignupForm({...signupForm, password: e.target.value})} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '2.2rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Inline Error Notice above submit button if error is active */}
              {feedback && feedback.type === 'error' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', color: '#f87171', fontSize: '0.84rem', background: 'rgba(239, 68, 68, 0.12)', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.35)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{feedback.message}</span>
                  </div>
                  {feedback.isUserExists && (
                    <button
                      type="button"
                      onClick={handleSwitchToLoginFromExistingUser}
                      style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', textDecoration: 'underline' }}
                    >
                      Sign In &rarr;
                    </button>
                  )}
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
                {loading ? <span className="animate-spin"><Activity size={18} /></span> : 'Create Account'}
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
