import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import ShopkeeperDashboard from './pages/ShopkeeperDashboard';
import './index.css';

// Protected Route Wrapper
const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('jwt_token');
  const userType = localStorage.getItem('user_type');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userType !== requiredRole) {
    // If they are logged in but wrong role, send them to their respective dashboard
    return <Navigate to={userType === 'shopkeeper' ? '/dashboard/shopkeeper' : '/dashboard/user'} replace />;
  }

  return children;
};

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route 
          path="/dashboard/user" 
          element={
            <ProtectedRoute requiredRole="user">
              <UserDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/dashboard/shopkeeper" 
          element={
            <ProtectedRoute requiredRole="shopkeeper">
              <ShopkeeperDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
