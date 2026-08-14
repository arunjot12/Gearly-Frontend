import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Activity, Server, Zap, Wrench, Eye, EyeOff } from 'lucide-react';
import { authApi, setToken } from '../services/api';

export default function LandingAuth() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [signupRole, setSignupRole] = useState('user'); // 'user' or 'shopkeeper'
  const navigate = useNavigate();

  // Form states
  const [loginForm, setLoginForm] = useState({ username_or_email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    first_name: '', username: '', email: '', phone_number: '', password: '', shop_name: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.loginUser(loginForm);
      // Axum returns raw JSON string for JWT
      let token = res.data;
      if (typeof token === 'string') {
        token = token.replace(/^"|"$/g, ''); // strip quotes if any
        setToken(token);
        navigate('/dashboard');
      } else {
        setError('Login succeeded but token format is invalid.');
      }
    } catch (err) {
      setError(err.response?.data || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (signupRole === 'user') {
        await authApi.signupUser({
          first_name: signupForm.first_name,
          username: signupForm.username,
          email: signupForm.email,
          phone_number: signupForm.phone_number,
          password: signupForm.password,
        });
      } else {
        await authApi.signupShopkeeper({
          shop_name: signupForm.shop_name,
          username: signupForm.username,
          email: signupForm.email,
          phone_number: signupForm.phone_number,
          password: signupForm.password,
        });
      }
      // Switch back to login on success
      setActiveTab('login');
      setError('Account created successfully! Please log in.');
    } catch (err) {
      setError(err.response?.data || err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
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
        <div className="glass-panel page-enter" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem' }}>
          
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
            <button 
              onClick={() => { setActiveTab('login'); setError(null); }}
              style={{ flex: 1, padding: '1rem', background: 'transparent', border: 'none', color: activeTab === 'login' ? 'white' : 'var(--text-muted)', borderBottom: activeTab === 'login' ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)' }}
            >
              Login
            </button>
            <button 
              onClick={() => { setActiveTab('signup'); setError(null); }}
              style={{ flex: 1, padding: '1rem', background: 'transparent', border: 'none', color: activeTab === 'signup' ? 'white' : 'var(--text-muted)', borderBottom: activeTab === 'signup' ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)' }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className={error.includes('successfully') ? 'bg-success' : 'bg-danger'} style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label>Email or Username</label>
                <input 
                  type="text" required 
                  value={loginForm.username_or_email} onChange={(e) => setLoginForm({...loginForm, username_or_email: e.target.value})}
                  placeholder="name@example.com"
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
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                {loading ? <span className="animate-spin"><Activity size={18} /></span> : 'Sign In'}
              </button>
            </form>
          ) : (
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

              {signupRole === 'user' ? (
                <div>
                  <label>First Name</label>
                  <input type="text" required value={signupForm.first_name} onChange={(e) => setSignupForm({...signupForm, first_name: e.target.value})} />
                </div>
              ) : (
                <div>
                  <label>Shop Name</label>
                  <input type="text" required value={signupForm.shop_name} onChange={(e) => setSignupForm({...signupForm, shop_name: e.target.value})} />
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Username</label>
                  <input type="text" required value={signupForm.username} onChange={(e) => setSignupForm({...signupForm, username: e.target.value})} />
                </div>
                <div>
                  <label>Phone Number</label>
                  <input type="text" required value={signupForm.phone_number} onChange={(e) => setSignupForm({...signupForm, phone_number: e.target.value})} />
                </div>
              </div>

              <div>
                <label>Email</label>
                <input type="email" required value={signupForm.email} onChange={(e) => setSignupForm({...signupForm, email: e.target.value})} />
              </div>

              <div style={{ position: 'relative' }}>
                <label>Password</label>
                <input type={showPassword ? "text" : "password"} required value={signupForm.password} onChange={(e) => setSignupForm({...signupForm, password: e.target.value})} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '2.2rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                {loading ? <span className="animate-spin"><Activity size={18} /></span> : 'Create Account'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
