import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wrench, Shield, Zap } from 'lucide-react';

export default function Landing() {
  return (
    <div className="page-enter min-h-screen">
      <div style={{ paddingTop: '120px' }} className="container">
        
        {/* Hero Section */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
          <div className="animate-float" style={{ display: 'inline-block', marginBottom: '2rem' }}>
            <Wrench size={64} className="text-gradient" />
          </div>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
            Find the perfect <span className="text-gradient">Car Parts</span> in seconds.
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
            The ultimate marketplace for auto enthusiasts and mechanics. Connect directly with top shopkeepers for premium OEM and aftermarket parts.
          </p>
          <div className="flex-center" style={{ gap: '1rem' }}>
            <Link to="/signup" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Get Started <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Shopkeeper Portal
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', paddingBottom: '4rem' }}>
          
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Shield className="text-gradient" size={24} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Verified Sellers</h3>
            <p style={{ color: 'var(--text-muted)' }}>Every shopkeeper is verified to ensure you receive authentic, high-quality auto parts.</p>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Zap className="text-gradient" size={24} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Lightning Fast</h3>
            <p style={{ color: 'var(--text-muted)' }}>Built on Rust and React, our platform offers an incredibly fast and seamless browsing experience.</p>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Wrench className="text-gradient" size={24} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Vast Inventory</h3>
            <p style={{ color: 'var(--text-muted)' }}>From engines to aesthetics, find exactly what you need with our extensive catalog of parts.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
