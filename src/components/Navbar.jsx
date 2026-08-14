import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, LogOut, LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('jwt_token');
  const userType = localStorage.getItem('user_type');

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_type');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="nav-logo">
          <Settings className="text-gradient" size={28} />
          <span>Gearly</span>
        </Link>
        <div className="nav-links">
          {token ? (
            <>
              {userType === 'shopkeeper' ? (
                <Link to="/dashboard/shopkeeper" className="nav-link">My Inventory</Link>
              ) : (
                <Link to="/dashboard/user" className="nav-link">Browse Parts</Link>
              )}
              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.4rem 1rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link flex-center" style={{ gap: '0.25rem' }}>
                <LogIn size={18} /> Login
              </Link>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>
                <UserPlus size={16} /> Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
