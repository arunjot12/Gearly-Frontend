import React, { useState } from 'react';
import { 
  Check, Copy, ShieldCheck, Eye, ShoppingBag, Edit3, Trash2 
} from 'lucide-react';
import { getCategoryInfo } from '../utils/categories';

export default function ProductCard({
  product,
  viewMode = 'catalog', // 'catalog' or 'inventory'
  onQuickView,
  onAddToCart,
  onEdit,
  onDelete,
}) {
  const [copied, setCopied] = useState(false);
  const catInfo = getCategoryInfo(product.name, product.descri);
  const CategoryIcon = catInfo.icon;
  const price = Number(product.price) || 0;
  const msrp = Math.round(price * 1.18);

  const handleCopySku = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(product.part_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="product-card-modern card-sheen">
      {/* Category Pill & Stock Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.4rem', 
          background: catInfo.bg, 
          color: catInfo.color, 
          padding: '3px 10px', 
          borderRadius: '6px', 
          fontSize: '0.74rem', 
          fontWeight: 700, 
          border: `1px solid ${catInfo.color}40` 
        }}>
          <CategoryIcon size={13} />
          <span>{catInfo.name}</span>
        </div>
        <span className="badge-stock">
          <span className="pulse-dot"></span>
          In Stock
        </span>
      </div>

      {/* Part Title */}
      <h3 style={{ fontSize: '1.18rem', fontWeight: 700, margin: '0 0 0.45rem 0', color: '#ffffff', lineHeight: 1.35 }}>
        {product.name}
      </h3>

      {/* SKU & OEM Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <button
          onClick={handleCopySku}
          title="Click to copy SKU"
          style={{
            background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.12)',
            border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.3)'}`,
            color: copied ? '#34d399' : '#60a5fa',
            padding: '3px 8px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>#{product.part_number}</span>
          {copied && <span style={{ fontSize: '0.7rem' }}>Copied!</span>}
        </button>

        <span className="badge-oem">OEM Genuine</span>
      </div>

      {/* Description */}
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1.2rem 0', lineHeight: 1.5, minHeight: '40px' }}>
        {product.descri || 'Direct replacement automotive component engineered to factory OEM specifications.'}
      </p>

      {/* Seller Verification Badge */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '1.2rem', 
        padding: '0.5rem 0.8rem', 
        background: 'rgba(0,0,0,0.25)', 
        borderRadius: '8px', 
        border: '1px solid var(--border-color)' 
      }}>
        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          Verified Merchant #{product.shopkeeper_id || '1'}
        </span>
        <span style={{ fontSize: '0.74rem', color: '#67e8f9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
          <ShieldCheck size={13} /> 100% Fitment
        </span>
      </div>

      {/* Pricing & Contextual Actions */}
      <div style={{ 
        paddingTop: '1.1rem', 
        borderTop: '1px solid var(--border-color)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end' 
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '2px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
              ₹{msrp.toLocaleString('en-IN')}
            </span>
            <span className="badge-discount">-15% OFF</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
            ₹{price.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
            Incl. all GST & taxes
          </span>
        </div>

        {viewMode === 'catalog' ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => onQuickView(product)} 
              className="btn-ghost" 
              style={{ padding: '0.55rem 0.75rem', borderRadius: '8px' }}
              title="Quick View Specs"
            >
              <Eye size={17} />
            </button>
            
            <button 
              onClick={() => onAddToCart(product)} 
              className="btn-emerald" 
              style={{ padding: '0.55rem 1rem', fontSize: '0.86rem', borderRadius: '8px', gap: '0.45rem' }}
            >
              <ShoppingBag size={15} />
              <span>Add</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => onEdit(product)} 
              className="btn-ghost" 
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </button>
            <button 
              onClick={() => onDelete(product)} 
              className="btn-danger-ghost" 
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
