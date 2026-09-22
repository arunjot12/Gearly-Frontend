import React from 'react';
import { ShoppingBag, X, Trash2, Truck } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onCheckout
}) {
  if (!isOpen) return null;

  const cartSubtotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * item.quantity), 0);
  const cartGst = Math.round(cartSubtotal * 0.18);
  const cartGrandTotal = cartSubtotal + cartGst;
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 150,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="drawer-slide-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          background: '#0e121a',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Drawer Header */}
        <div style={{ padding: '1.4rem 1.6rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingBag size={20} color="var(--accent-cyan)" />
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff' }}>Your Order Cart</h3>
            <span style={{ background: 'var(--accent-cyan)', color: '#000', fontSize: '0.72rem', fontWeight: 800, padding: '1px 7px', borderRadius: '10px' }}>
              {cartItemsCount}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1.6rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <ShoppingBag size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.25, color: 'var(--accent-cyan)' }} />
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#ffffff' }}>Your cart is empty</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Browse the public catalog and add spare parts to initiate an order.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ flex: 1, paddingRight: '0.8rem' }}>
                  <span className="badge-sku" style={{ fontSize: '0.7rem' }}>#{item.part_number}</span>
                  <h4 style={{ margin: '0.3rem 0 0.2rem 0', fontSize: '0.96rem', fontWeight: 700, color: '#ffffff' }}>{item.name}</h4>
                  <div style={{ fontSize: '0.94rem', color: 'var(--accent-emerald)', fontWeight: 800 }}>
                    ₹{(Number(item.price) || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <button 
                      onClick={() => onUpdateQty(item.id, -1)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '4px 8px', cursor: 'pointer' }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '24px', textAlign: 'center', color: '#ffffff' }}>
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => onUpdateQty(item.id, 1)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '4px 8px', cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </div>

                  <button 
                    onClick={() => onRemoveItem(item.id)}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '1.4rem 1.6rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.2rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Subtotal</span>
                <span>₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Estimated GST (18%)</span>
                <span>₹{cartGst.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399', fontSize: '0.82rem' }}>
                <span>Delivery</span>
                <span>FREE (Special Marketplace Offer)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem', color: '#ffffff', paddingTop: '0.6rem', borderTop: '1px solid var(--border-color)' }}>
                <span>Grand Total</span>
                <span style={{ color: 'var(--accent-emerald)' }}>₹{cartGrandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button onClick={onClearCart} className="btn-ghost" style={{ flex: 1, fontSize: '0.85rem' }}>
                Clear
              </button>
              <button onClick={onCheckout} className="btn-emerald" style={{ flex: 2, fontSize: '0.9rem' }}>
                <Truck size={16} />
                <span>Order Dispatch</span>
              </button>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'center', display: 'block', marginTop: '0.8rem' }}>
              ⚡ Prepares payload for upcoming <code style={{ color: 'var(--accent-cyan)' }}>gearly-order</code> microservice
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
