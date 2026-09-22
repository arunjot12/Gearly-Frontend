import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function DeleteModal({
  isOpen,
  product,
  onConfirm,
  onCancel,
  submitting = false
}) {
  if (!isOpen || !product) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 130,
        padding: '1rem'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="glass-panel animate-scale-up" style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: '2rem', 
        background: 'var(--bg-panel-solid)', 
        border: '1px solid rgba(239, 68, 68, 0.4)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#f87171', marginBottom: '1rem' }}>
          <AlertTriangle size={26} />
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff' }}>Remove from Inventory?</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          Are you sure you want to delete <strong style={{ color: '#ffffff' }}>"{product.name}"</strong> (SKU: {product.part_number})? It will be permanently removed from your store and delisted from the public marketplace.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
          <button onClick={onCancel} className="btn-ghost" disabled={submitting}>
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="btn-danger-ghost" 
            disabled={submitting}
            style={{ background: 'rgba(239, 68, 68, 0.25)', color: '#ffffff', borderColor: '#ef4444' }}
          >
            <Trash2 size={15} />
            <span>{submitting ? 'Removing...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
