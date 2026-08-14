import React, { useEffect, useState } from 'react';
import { Search, ShoppingCart, Filter } from 'lucide-react';
import apiClient from '../api/client';

export default function UserDashboard() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch parts from the backend here
    // Example: apiClient.get('/parts').then(res => setParts(res.data))
    
    // Simulating data fetch for the stunning UI demo
    setTimeout(() => {
      setParts([
        { id: 1, name: 'V8 Engine Block', price: 1200.00, shop: 'Joe\'s Auto', status: 'In Stock' },
        { id: 2, name: 'Performance Brake Pads', price: 85.50, shop: 'Speedy Parts', status: 'In Stock' },
        { id: 3, name: 'LED Headlight Conversion Kit', price: 150.00, shop: 'Bright Auto', status: 'Only 2 Left' },
        { id: 4, name: 'Synthetic Motor Oil 5W-30', price: 45.99, shop: 'Lube Pro', status: 'In Stock' },
        { id: 5, name: 'Racing Steering Wheel', price: 299.99, shop: 'Track Prep', status: 'Out of Stock' },
        { id: 6, name: 'Sport Suspension Kit', price: 850.00, shop: 'Speedy Parts', status: 'In Stock' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="page-enter container" style={{ paddingTop: '100px', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem' }}>Browse Parts</h1>
          <p style={{ color: 'var(--text-muted)' }}>Find the best parts from verified shopkeepers.</p>
        </div>
        <button className="btn btn-primary">
          <ShoppingCart size={18} /> Cart (0)
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search for engines, brakes, oil..." style={{ paddingLeft: '2.5rem' }} />
        </div>
        <button className="btn btn-outline">
          <Filter size={18} /> Filters
        </button>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: '300px' }}>
          <div className="animate-float">
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {parts.map(part => (
            <div key={part.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', height: '150px', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Placeholder for image */}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Image Not Available</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{part.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Sold by: <span className="text-gradient">{part.shop}</span></p>
              
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${part.price.toFixed(2)}</span>
                <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }} disabled={part.status === 'Out of Stock'}>
                  {part.status === 'Out of Stock' ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
