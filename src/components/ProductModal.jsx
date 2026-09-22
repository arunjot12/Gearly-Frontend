import React from 'react';
import { Package, X, RefreshCw } from 'lucide-react';

export default function ProductModal({
  isOpen,
  mode = 'create', // 'create' or 'edit'
  form,
  onChange,
  onApplyPreset,
  onSubmit,
  onClose,
  submitting = false
}) {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        padding: '1rem'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-panel animate-scale-up" style={{ 
        width: '100%', 
        maxWidth: '560px', 
        padding: '2.2rem', 
        background: 'var(--bg-panel-solid)', 
        boxShadow: '0 24px 60px rgba(0,0,0,0.85)', 
        border: '1px solid rgba(6, 182, 212, 0.35)' 
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ffffff' }}>
            <Package className="text-gradient" size={24} />
            {mode === 'create' ? 'Register New Spare Part' : 'Edit Spare Part Specs'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Quick Auto Presets (for create mode) */}
        {mode === 'create' && (
          <div style={{ marginBottom: '1.2rem', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>
              ⚡ 1-Click OEM Presets:
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button 
                type="button"
                onClick={() => onApplyPreset({
                  name: 'Brembo Ceramic Front Brake Pads',
                  part_number: 'BRM-9921',
                  price: '4500',
                  descri: 'High thermal tolerance ceramic compound. Low dust, zero fade. Fitment: Honda City / Civic 2018-2024.'
                })}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}
              >
                + Ceramic Brake Pads
              </button>
              <button 
                type="button"
                onClick={() => onApplyPreset({
                  name: 'Bosch Iridium Spark Plug Set (Pack of 4)',
                  part_number: 'BSH-IR40',
                  price: '2800',
                  descri: 'Laser-welded iridium electrode. 100,000 km lifespan. Fitment: Maruti Swift / Dzire / Baleno 1.2L.'
                })}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}
              >
                + Spark Plug Set
              </button>
              <button 
                type="button"
                onClick={() => onApplyPreset({
                  name: 'Monroe OESpectrum Front Shock Absorber',
                  part_number: 'MNR-SK88',
                  price: '6200',
                  descri: 'Twin Technology Active Control System. Superior handling on Indian rough road terrain.'
                })}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}
              >
                + Shock Absorber
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label>Part Name *</label>
            <input 
              type="text" 
              required
              value={form.name} 
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              placeholder="e.g. Brembo Ceramic Front Brake Pads"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label>Part Number (SKU) *</label>
              <input 
                type="text" 
                required
                value={form.part_number} 
                onChange={(e) => onChange({ ...form, part_number: e.target.value })}
                placeholder="e.g. BRM-9921"
              />
            </div>

            <div>
              <label>Price (₹) *</label>
              <input 
                type="number" 
                required
                min="1"
                value={form.price} 
                onChange={(e) => onChange({ ...form, price: e.target.value })}
                placeholder="e.g. 4500"
              />
            </div>
          </div>

          <div>
            <label>Technical Description & Vehicle Fitment *</label>
            <textarea 
              rows="3"
              required
              value={form.descri} 
              onChange={(e) => onChange({ ...form, descri: e.target.value })}
              placeholder="e.g. High thermal tolerance ceramic compound. Compatible with Honda City / Civic 2018-2023..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ minWidth: '150px' }}>
              {submitting ? <RefreshCw size={16} className="animate-spin" /> : (mode === 'create' ? 'List Spare Part' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
