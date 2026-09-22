import React from 'react';
import { 
  Car, Store, Package, ShieldCheck, ShoppingBag, LogOut 
} from 'lucide-react';

export default function Navbar({
  activeView,
  setActiveView,
  isShopkeeper,
  currentUser,
  cartCount,
  onOpenCart,
  onLogout,
  storeProductCount = 0
}) {

  const roleLabel = isShopkeeper ? 'Shopkeeper (Merchant)' : 'Customer (Buyer)';
  const roleBadgeColor = isShopkeeper ? '#60a5fa' : '#34d399';
  const roleBadgeBg = isShopkeeper ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)';
  const roleBadgeBorder = isShopkeeper ? 'rgba(59, 130, 246, 0.35)' : 'rgba(16, 185, 129, 0.35)';

  const userInitial = isShopkeeper ? 'S' : 'C';
  const userId = currentUser?.claims?.sub || '1';

  return (
    <header className="glass-panel" style={{ 
      borderRadius: 0, 
      padding: '0.85rem 2rem', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      position: 'sticky', 
      top: 0, 
      zIndex: 40, 
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(10, 15, 29, 0.85)',
      backdropFilter: 'blur(16px)'
    }}>
      {/* Brand & Left Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        
        {/* Brand Logo */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} 
          onClick={() => setActiveView('marketplace')}
        >
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)' 
          }}>
            <Car size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="text-gradient" style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '1px', lineHeight: 1 }}>GEARLY</span>
              <span style={{ 
                fontSize: '0.62rem', 
                background: 'rgba(6, 182, 212, 0.15)', 
                color: 'var(--accent-cyan)', 
                padding: '2px 6px', 
                borderRadius: '4px', 
                fontWeight: 700,
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}>
                v2.0
              </span>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '0.6px', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginTop: '2px' }}>
              Automotive Parts Ecosystem
            </span>
          </div>
        </div>

        {/* View Switcher Tabs (Desktop) */}
        <nav className="desktop-nav" style={{ 
          display: 'flex', 
          gap: '0.35rem', 
          background: 'rgba(0,0,0,0.4)', 
          padding: '4px', 
          borderRadius: '10px', 
          border: '1px solid var(--border-color)' 
        }}>
          <button 
            id="nav-catalog-btn"
            onClick={() => setActiveView('marketplace')} 
            className={activeView === 'marketplace' ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '0.45rem 1rem', fontSize: '0.84rem', borderRadius: '7px', border: 'none' }}
          >
            <Store size={15} />
            <span>Public Catalog</span>
          </button>
          
          {isShopkeeper && (
            <button 
              id="nav-inventory-btn"
              onClick={() => setActiveView('inventory')} 
              className={activeView === 'inventory' ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '0.45rem 1rem', fontSize: '0.84rem', borderRadius: '7px', border: 'none', position: 'relative' }}
            >
              <Package size={15} />
              <span>Store Inventory</span>
              {storeProductCount > 0 && (
                <span style={{ 
                  background: 'rgba(255, 255, 255, 0.25)', 
                  color: '#ffffff', 
                  fontSize: '0.7rem', 
                  fontWeight: 800, 
                  padding: '1px 6px', 
                  borderRadius: '8px', 
                  marginLeft: '4px' 
                }}>
                  {storeProductCount}
                </span>
              )}
            </button>
          )}

          <button 
            id="nav-diagnostics-btn"
            onClick={() => setActiveView('security')} 
            className={activeView === 'security' ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '0.45rem 1rem', fontSize: '0.84rem', borderRadius: '7px', border: 'none' }}
          >
            <ShieldCheck size={15} />
            <span>Diagnostics</span>
          </button>
        </nav>
      </div>

      {/* Right Controls: Cart, Verified Role Badge, User & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
        
        {/* Cart Drawer Trigger */}
        <button 
          id="cart-drawer-btn"
          onClick={onOpenCart}
          className="btn-ghost"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.6rem', 
            padding: '0.45rem 1rem', 
            borderRadius: '20px', 
            borderColor: cartCount > 0 ? 'var(--accent-cyan)' : 'var(--border-color)',
            background: cartCount > 0 ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="Open Cart"
        >
          <ShoppingBag size={17} color={cartCount > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Cart</span>
          {cartCount > 0 && (
            <span style={{ 
              background: 'var(--accent-cyan)', 
              color: '#000000', 
              fontSize: '0.72rem', 
              fontWeight: 800, 
              padding: '1px 7px', 
              borderRadius: '10px',
              animation: 'pulse 1.5s infinite'
            }}>
              {cartCount}
            </span>
          )}
        </button>

        {/* Verified Role & User Profile Card */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.85rem', 
          paddingLeft: '1rem', 
          borderLeft: '1px solid var(--border-color)' 
        }}>
          {/* Robust Inline SVG Avatar */}
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            background: isShopkeeper ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'linear-gradient(135deg, #059669, #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.9rem',
            color: '#ffffff',
            boxShadow: `0 0 12px ${isShopkeeper ? 'rgba(59, 130, 246, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
            border: `2px solid ${isShopkeeper ? '#93c5fd' : '#6ee7b7'}`
          }}>
            {userInitial}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
              {isShopkeeper ? `Shopkeeper #${userId}` : `Customer #${userId}`}
            </span>
            <div style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.7rem', 
              color: roleBadgeColor, 
              background: roleBadgeBg,
              border: `1px solid ${roleBadgeBorder}`,
              borderRadius: '6px',
              padding: '1px 7px',
              fontWeight: 700, 
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: '2px'
            }}>
              <span className="pulse-dot" style={{ width: '6px', height: '6px', background: roleBadgeColor }}></span>
              <span>{roleLabel}</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button 
          id="logout-btn"
          onClick={onLogout} 
          className="btn-danger-ghost" 
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', borderRadius: '8px' }}
          title="Sign Out"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
