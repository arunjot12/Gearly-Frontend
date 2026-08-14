import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import apiClient from '../api/client';

export default function ShopkeeperDashboard() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch this shopkeeper's inventory
    setTimeout(() => {
      setInventory([
        { id: 1, name: 'V8 Engine Block', price: 1200.00, stock: 5 },
        { id: 2, name: 'Performance Brake Pads', price: 85.50, stock: 12 },
        { id: 3, name: 'LED Headlight Conversion Kit', price: 150.00, stock: 2 },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="page-enter container" style={{ paddingTop: '100px', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem' }}>My Inventory</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your car parts catalog and stock levels.</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Add New Part
        </button>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Part Name</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Price</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Stock</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ padding: '3rem', textAlign: 'center' }}>Loading inventory...</td>
              </tr>
            ) : inventory.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>You have no parts listed yet.</p>
                </td>
              </tr>
            ) : (
              inventory.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>{item.name}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>${item.price.toFixed(2)}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      background: item.stock > 3 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: item.stock > 3 ? 'var(--success)' : 'var(--danger)',
                      fontSize: '0.85rem'
                    }}>
                      {item.stock} in stock
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <button className="btn btn-outline" style={{ padding: '0.4rem', marginRight: '0.5rem' }}>
                      <Edit2 size={16} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
