import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { LogIn } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username_or_email: '',
    password: '',
    userType: 'user' // 'user' or 'shopkeeper'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // The backend expects specific payload for login based on the routes
      // Note: adjust the endpoint based on the actual Axum backend implementation
      const endpoint = '/login_user';
      
      const response = await apiClient.post(endpoint, {
        username_or_email: formData.username_or_email,
        password: formData.password
      });

      // Assuming the backend returns the token in response.data.token
      // And we also want to store userType
      if (response.data && response.data.token) {
        localStorage.setItem('jwt_token', response.data.token);
        localStorage.setItem('user_type', formData.userType);
        
        if (formData.userType === 'shopkeeper') {
          navigate('/dashboard/shopkeeper');
        } else {
          navigate('/dashboard/user');
        }
      } else {
        setError('Login successful, but no token received.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter flex-center min-h-screen">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', marginTop: '70px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogIn size={28} className="text-gradient" />
          </div>
          <h2 style={{ fontSize: '2rem' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Login to your Gearly account</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="userType" 
                value="user" 
                checked={formData.userType === 'user'} 
                onChange={(e) => setFormData({...formData, userType: e.target.value})}
                style={{ width: 'auto' }}
              />
              User
            </label>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="userType" 
                value="shopkeeper" 
                checked={formData.userType === 'shopkeeper'} 
                onChange={(e) => setFormData({...formData, userType: e.target.value})}
                style={{ width: 'auto' }}
              />
              Shopkeeper
            </label>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Username or Email</label>
            <input 
              type="text" 
              required
              value={formData.username_or_email}
              onChange={(e) => setFormData({...formData, username_or_email: e.target.value})}
              placeholder="Username or you@example.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Password</label>
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/signup" className="text-gradient" style={{ textDecoration: 'none', fontWeight: 500 }}>Sign up</Link>
        </p>

      </div>
    </div>
  );
}
