import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Copy, RefreshCw, CheckCircle, XCircle, ShieldAlert, Key, Package, ExternalLink } from 'lucide-react';
import { authApi, getToken, clearToken } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState(getToken());
  const [logs, setLogs] = useState([]);
  const [testResult, setTestResult] = useState(null);
  
  // Custom wrapper for API calls to log them
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

  const addLog = (method, endpoint, status, timeMs) => {
    setLogs(prev => [{
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      method,
      endpoint,
      status,
      timeMs
    }, ...prev].slice(0, 10)); // keep last 10
  };

  const handleLogout = () => {
    clearToken();
    navigate('/');
  };

  const handleClearToken = () => {
    clearToken();
    setToken(null);
  };

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
    }
  };

  const testWithJwt = async () => {
    setTestResult(null);
    const result = await executeApiAndLog('GET', '/dashboard', () => authApi.getDashboard());
    setTestResult({
      type: 'with-jwt',
      ...result
    });
  };

  const testWithoutJwt = async () => {
    setTestResult(null);
    // Passing a custom header to override the interceptor
    const result = await executeApiAndLog('GET', '/dashboard', () => 
      authApi.getDashboard({ headers: { Authorization: '' } })
    );
    setTestResult({
      type: 'without-jwt',
      ...result
    });
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* Header */}
      <header className="glass-panel" style={{ borderRadius: 0, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0, letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            GEARLY <span className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 'normal', letterSpacing: 'normal' }}>Dashboard</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: token ? 'var(--success)' : 'var(--danger)' }}></span>
            {token ? 'Valid JWT Stored' : 'No JWT'}
          </div>
          <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="container" style={{ marginTop: '2rem' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* CARD 1: Auth Status */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <ShieldAlert size={20} className="text-gradient" /> Authentication Status
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              {token ? (
                <><CheckCircle size={32} className="status-success" /> <div><strong style={{ display: 'block' }}>Authenticated</strong><span className="text-muted">JWT stored securely</span></div></>
              ) : (
                <><XCircle size={32} className="status-danger" /> <div><strong style={{ display: 'block' }}>Not Authenticated</strong><span className="text-muted">No token found</span></div></>
              )}
            </div>
          </div>

          {/* CARD 2: JWT Token */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Key size={20} className="text-gradient" /> Current JWT Token
            </h3>
            <div className="code-block" style={{ height: '80px', marginBottom: '1rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {token ? token : 'No token currently stored...'}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={copyToken} className="btn btn-outline" style={{ flex: 1 }} disabled={!token}>
                <Copy size={16} /> Copy Token
              </button>
              <button onClick={handleClearToken} className="btn btn-outline" style={{ flex: 1, color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }} disabled={!token}>
                Clear Token
              </button>
            </div>
          </div>

          {/* CARD 3: Linked Microservice - Products App */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Package size={20} className="text-gradient" /> Products Microservice
              </h3>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                Manage parts inventory in the dedicated Gearly Products microservice.
              </p>
            </div>
            <a 
              href={`http://localhost:5173/?token=${encodeURIComponent(token || '')}`}
              target="_blank" 
              rel="noreferrer"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
            >
              Open Products App <ExternalLink size={16} />
            </a>
          </div>
          
        </div>

        {/* JWT Security Test Panel */}
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>JWT Security Test</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Verify your Axum backend middleware is actively protecting routes.</p>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button onClick={testWithJwt} className="btn btn-primary" style={{ flex: 1 }}>
              <CheckCircle size={18} /> Test With JWT
            </button>
            <button onClick={testWithoutJwt} className="btn btn-outline" style={{ flex: 1, borderColor: 'rgba(239, 68, 68, 0.5)' }}>
              <XCircle size={18} className="status-danger" /> Test Without JWT
            </button>
          </div>

          {testResult && (
            <div className="code-block animate-slide-up" style={{ padding: '1.5rem', background: 'var(--bg-panel-solid)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <strong>{testResult.type === 'with-jwt' ? 'TEST WITH JWT' : 'TEST WITHOUT JWT'}</strong>
                <span className={testResult.success ? 'status-success' : 'status-danger'}>
                  {testResult.success ? 'Access Granted' : 'Access Denied'}
                </span>
              </div>
              
              <div style={{ fontFamily: 'monospace', lineHeight: 1.6 }}>
                <div><span className="text-muted">Request:</span> GET /dashboard</div>
                <div><span className="text-muted">Authorization:</span> {testResult.type === 'with-jwt' ? `Bearer ${token?.substring(0, 15)}...` : 'None'}</div>
                <br />
                <div>
                  <span className="text-muted">Result: </span> 
                  <span style={{ color: testResult.success ? 'var(--success)' : 'var(--danger)' }}>
                    {testResult.success ? '🟢 200 OK' : `🔴 ${testResult.status} Unauthorized`}
                  </span>
                </div>
                <br />
                <div className="text-muted">Raw Backend Response:</div>
                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', marginTop: '0.5rem' }}>
                  {typeof testResult.data === 'string' ? testResult.data : JSON.stringify(testResult.data, null, 2)}
                </div>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* API Console fixed at bottom */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-panel-solid)', borderTop: '1px solid var(--border-color)', height: '200px', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '0.85rem', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={14} className="text-gradient" /> API CONSOLE
          </strong>
          <button onClick={() => setLogs([])} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Clear Logs">
            <RefreshCw size={14} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.25rem 0.5rem', color: 'var(--text-muted)' }}>TIME</th>
                <th style={{ padding: '0.25rem 0.5rem', color: 'var(--text-muted)' }}>METHOD</th>
                <th style={{ padding: '0.25rem 0.5rem', color: 'var(--text-muted)' }}>ENDPOINT</th>
                <th style={{ padding: '0.25rem 0.5rem', color: 'var(--text-muted)' }}>STATUS</th>
                <th style={{ padding: '0.25rem 0.5rem', color: 'var(--text-muted)', textAlign: 'right' }}>LATENCY</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="animate-slide-up">
                  <td style={{ padding: '0.25rem 0.5rem', color: 'var(--text-muted)' }}>{log.timestamp}</td>
                  <td style={{ padding: '0.25rem 0.5rem' }}>
                    <span style={{ color: log.method === 'GET' ? 'var(--success)' : 'var(--accent-primary)' }}>{log.method}</span>
                  </td>
                  <td style={{ padding: '0.25rem 0.5rem' }}>{log.endpoint}</td>
                  <td style={{ padding: '0.25rem 0.5rem' }}>
                    <span className={log.status >= 200 && log.status < 300 ? 'status-success' : 'status-danger'}>{log.status}</span>
                  </td>
                  <td style={{ padding: '0.25rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>{log.timeMs}ms</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recent API activity.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
