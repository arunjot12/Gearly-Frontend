import React, { useState } from 'react';
import { X, Car, ShoppingBag } from 'lucide-react';

export default function QuickViewModal({
  isOpen,
  product,
  onClose,
  onAddToCart
}) {
  const [qty, setQty] = useState(1);

  if (!isOpen || !product) return null;

  const unitPrice = Number(product.price) || 0;
  const totalPrice = unitPrice * qty;

  const handleAdd = () => {
    onAddToCart(product, qty);
    onClose();
  };

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
        zIndex: 120,
        padding: '1rem'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-panel animate-scale-up" style={{ 
        width: '100%', 
        maxWidth: '620px', 
        padding: '2.4rem', 
        background: 'var(--bg-panel-solid)', 
        boxShadow: '0 24px 60px rgba(0,0,0,0.85)', 
        border: '1px solid rgba(6, 182, 212, 0.35)' 
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.2rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="badge-sku">#{product.part_number}</span>
              <span className="badge-oem">OEM Certified</span>
              <span className="badge-seller">Merchant #{product.shopkeeper_id || '1'}</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.45rem', color: '#ffffff', fontWeight: 800 }}>{product.name}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
          {/* Engineering Description */}
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              Engineering Specifications & Fitment
            </div>
            <p style={{ color: 'var(--text-main)', marginTop: '0.4rem', lineHeight: 1.6, fontSize: '0.94rem' }}>
              {product.descri || 'Genuine automotive replacement component engineered to factory OEM specifications with full warranty.'}
            </p>
          </div>

          {/* Fitment Specifications Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div style={{ padding: '0.9rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Warranty</span>
              <strong style={{ fontSize: '0.88rem', color: '#67e8f9' }}>12-Month Replacement</strong>
            </div>
            <div style={{ padding: '0.9rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Installation Fit</span>
              <strong style={{ fontSize: '0.88rem', color: '#34d399' }}>Direct Bolt-On OEM</strong>
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(6, 182, 212, 0.08)', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.25)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Car size={26} color="var(--accent-cyan)" />
            <div>
              <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--accent-cyan)' }}>Automotive Compatibility Guarantee</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cross-referenced against standard Indian vehicle specifications. 100% fit guaranteed.</span>
            </div>
          </div>

          {/* Quantity Selector & Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.2rem', borderTop: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total Order Value</span>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                ₹{totalPrice.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '6px 12px', cursor: 'pointer', fontSize: '1rem' }}
                >
                  -
                </button>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, minWidth: '28px', textAlign: 'center', color: '#ffffff' }}>
                  {qty}
                </span>
                <button 
                  onClick={() => setQty(qty + 1)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '6px 12px', cursor: 'pointer', fontSize: '1rem' }}
                >
                  +
                </button>
              </div>

              <button 
                onClick={handleAdd} 
                className="btn-emerald" 
                style={{ padding: '0.75rem 1.4rem' }}
              >
                <ShoppingBag size={17} />
                <span>Add to Order Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
