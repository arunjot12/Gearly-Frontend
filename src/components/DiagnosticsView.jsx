import React, { useState } from 'react';
import { UserCheck, Key, Copy, Cpu, CheckCircle, XCircle } from 'lucide-react';
import { authApi, getAuthBaseUrl } from '../services/api';
import { productApi, getProductBaseUrl } from '../services/productApi';

export default function DiagnosticsView({
  token,
  claims,
  isShopkeeper,
  showToast
}) {
  const [logs, setLogs] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const authUrl = getAuthBaseUrl();
  const productUrl = getProductBaseUrl();

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      showToast('JWT copied to clipboard!', 'success');
    }
  };

  const addLog = (method, endpoint, status, timeMs) => {
    setLogs(prev => [{
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      method,
      endpoint,
      status,
      timeMs
    }, ...prev].slice(0, 10));
  };

  const executeApiAndLog = async (method, endpoint, apiCallFn) => {
    const startTime = performance.now();
    try {
      const res = await apiCallFn();
      const endTime = performance.now();
      addLog(method, endpoint, res.status, Math.round(endTime - startTime));
      return { success: true, status: res.status, data: res.data };
    } catch (err) {
      const endTime = performance.now();
      const status = err.response?.status || 'ERR';
      const data = err.response?.data || err.message;
      addLog(method, endpoint, status, Math.round(endTime - startTime));
      return { success: false, status, data };
    }
  };

  const testPublicProducts = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await executeApiAndLog('GET', 'gearly-product :3000/products/public', async () => {
      return await productApi.getPublicProducts({ limit: 3, offset: 0 });
    });
    setTestResult({ name: 'Public Marketplace Catalog', ...result });
    setTesting(false);
  };

  const testProtectedProducts = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await executeApiAndLog('GET', 'gearly-product :3000/get_products', async () => {
      return await productApi.getProducts({ limit: 3, offset: 0 });
    });
    setTestResult({ name: 'Protected Merchant Inventory', ...result });
    setTesting(false);
  };

  const testHealthProbe = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await executeApiAndLog('GET', 'gearly-product :3000/health', async () => {
      return await productApi.checkHealth();
    });
    setTestResult({ name: 'Product Service Health Probe', ...result });
    setTesting(false);
  };

  const testAuthDashboard = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await executeApiAndLog('GET', 'gearly-login :8000/dashboard', async () => {
      return await authApi.getDashboard();
    });
    setTestResult({ name: 'Auth Service Protected Dashboard', ...result });
    setTesting(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
      {/* Identity & Claims Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Claims Card */}
        <div className="glass-panel" style={{ padding: '1.8rem' }}>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ffffff' }}>
            <UserCheck size={20} color="var(--accent-cyan)" />
            <span>Decoded Identity Claims (JWT)</span>
          </h3>

          {claims ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Subject (User ID)</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{claims.sub}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Assigned RBAC Role</span>
                <span style={{ 
                  padding: '2px 8px', 
                  borderRadius: '6px', 
                  fontSize: '0.78rem', 
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: isShopkeeper ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: isShopkeeper ? '#60a5fa' : '#34d399'
                }}>
                  {claims.roles || claims.role || (isShopkeeper ? 'SHOPKEEPER' : 'CUSTOMER')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Issued At (iat)</span>
                <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#ffffff' }}>
                  {claims.iat ? new Date(claims.iat * 1000).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Expires (exp)</span>
                <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: claims.exp * 1000 > Date.now() ? 'var(--accent-emerald)' : 'var(--danger)' }}>
                  {claims.exp ? new Date(claims.exp * 1000).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No claims found or token is invalid.</p>
          )}
        </div>

        {/* Raw Token Card */}
        <div className="glass-panel" style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ffffff' }}>
              <Key size={18} color="var(--accent-primary)" />
              <span>Active Bearer Token</span>
            </h3>
            <button 
              onClick={copyToken} 
              className="btn-ghost" 
              style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Copy size={14} />
              <span>Copy</span>
            </button>
          </div>

          <div style={{ 
            background: 'rgba(0, 0, 0, 0.4)', 
            padding: '1rem', 
            borderRadius: '10px', 
            border: '1px solid var(--border-color)',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            flex: 1,
            maxHeight: '140px',
            overflowY: 'auto',
            lineHeight: 1.5
          }}>
            {token}
          </div>

          <p style={{ margin: '0.8rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            This token is authenticated via <code style={{ color: 'var(--accent-cyan)' }}>Authorization: Bearer &lt;token&gt;</code> to <code style={{ color: '#60a5fa' }}>{authUrl}</code> and <code style={{ color: '#34d399' }}>{productUrl}</code>.
          </p>
        </div>
      </div>

      {/* Backend Verification Triggers */}
      <section className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ffffff' }}>
          <Cpu size={20} color="var(--accent-cyan)" />
          <span>Microservice Route Diagnostics</span>
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1.5rem 0' }}>
          Execute live HTTP requests across your Rust microservices to verify routing, authorization, and latency.
        </p>

        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button 
            onClick={testPublicProducts} 
            disabled={testing}
            className="btn-primary" 
            style={{ fontSize: '0.86rem' }}
          >
            <span>Test Public Catalog (/products/public)</span>
          </button>

          <button 
            onClick={testProtectedProducts} 
            disabled={testing}
            className="btn-ghost" 
            style={{ fontSize: '0.86rem', borderColor: 'var(--accent-cyan)' }}
          >
            <span>Test Store Inventory (/get_products)</span>
          </button>

          <button 
            onClick={testHealthProbe} 
            disabled={testing}
            className="btn-ghost" 
            style={{ fontSize: '0.86rem' }}
          >
            <span>Test Health Probe (/health)</span>
          </button>

          <button 
            onClick={testAuthDashboard} 
            disabled={testing}
            className="btn-ghost" 
            style={{ fontSize: '0.86rem' }}
          >
            <span>Test Auth Backend (:8000)</span>
          </button>
        </div>

        {/* Test Result Box */}
        {testResult && (
          <div className="animate-fade-in" style={{
            background: testResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '10px',
            padding: '1.2rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: testResult.success ? 'var(--accent-emerald)' : 'var(--danger)' }}>
                {testResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>{testResult.name} &bull; {testResult.status}</span>
              </div>
            </div>
            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)', maxHeight: '160px', overflowY: 'auto' }}>
              {typeof testResult.data === 'string' ? testResult.data : JSON.stringify(testResult.data, null, 2)}
            </pre>
          </div>
        )}

        {/* Live Request Activity Stream */}
        {logs.length > 0 && (
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
              Live Activity Stream
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {logs.map(log => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.8rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>{log.timestamp}</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{log.method}</span>
                    <span style={{ color: '#ffffff' }}>{log.endpoint}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ color: log.status === 200 || log.status === 201 ? 'var(--accent-emerald)' : 'var(--danger)', fontWeight: 700 }}>
                      {log.status}
                    </span>
                    <span style={{ color: 'var(--text-dim)' }}>{log.timeMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
