import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { UserPlus } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    username: '',
    email: '',
    password: '',
    phone_number: '',
    shop_name: '',
    shop_address: '',
    city: '',
    userType: 'user' // 'user' or 'shopkeeper'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = formData.userType === 'shopkeeper' ? '/signup_shopkeeper' : '/signup_user';
      
      let payload = {};
      if (formData.userType === 'shopkeeper') {
        payload = {
          first_name: formData.first_name || null,
          username: formData.username,
          email: formData.email || null,
          password: formData.password || null,
          phone_number: formData.phone_number || null,
          shop_name: formData.shop_name || null,
          shop_address: formData.shop_address || null,
          city: formData.city || null,
        };
      } else {
        payload = {
          first_name: formData.first_name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          phone_number: formData.phone_number,
        };
      }

      await apiClient.post(endpoint, payload);
      
      // On successful signup, redirect to login
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter flex-center min-h-screen">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', marginTop: '70px', marginBottom: '2rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={28} className="text-gradient" />
          </div>
          <h2 style={{ fontSize: '2rem' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Join the Gearly marketplace</p>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>First Name</label>
              <input 
                type="text" 
                required={formData.userType === 'user'}
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                placeholder="John"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Username</label>
              <input 
                type="text" 
                required
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="johndoe"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email Address</label>
              <input 
                type="email" 
                required={formData.userType === 'user'}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Phone Number</label>
              <input 
                type="text" 
                required={formData.userType === 'user'}
                value={formData.phone_number}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Password</label>
            <input 
              type="password" 
              required={formData.userType === 'user'}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
            />
          </div>

          {formData.userType === 'shopkeeper' && (
            <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Shop Name (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.shop_name}
                    onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
                    placeholder="Joe's Auto Parts"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>City (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="New York"
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Shop Address (Optional)</label>
                <textarea 
                  value={formData.shop_address}
                  onChange={(e) => setFormData({...formData, shop_address: e.target.value})}
                  placeholder="123 Auto Parts Ave..."
                  rows="2"
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" className="text-gradient" style={{ textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </p>

      </div>
    </div>
  );
}
