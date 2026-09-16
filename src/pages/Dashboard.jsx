import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Copy, RefreshCw, CheckCircle, XCircle, ShieldAlert, Key, 
  Package, Plus, Search, Edit3, Trash2, Layers, DollarSign, AlertCircle, X, Check
} from 'lucide-react';
import { authApi, getToken, clearToken } from '../services/api';
import { productApi } from '../services/productApi';

export default function Dashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState(getToken());
  
  // Tabs: 'products' (default) or 'security'
  const [activeTab, setActiveTab] = useState('products');

  // Products State
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentEditId, setCurrentEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    part_number: '',
    price: '',
    descri: ''
  });

  // Security Test State
  const [logs, setLogs] = useState([]);
  const [testResult, setTestResult] = useState(null);

  // Parse JWT claims
  const claims = useMemo(() => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(base64));
    } catch {
      return null;
    }
  }, [token]);

  // Load products on mount
  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  const showToast = (text, type = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleLogout = () => {
    clearToken();
    navigate('/');
  };

  // --- Product API Actions ---
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await productApi.getProducts();
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err.response?.status === 401) {
        showToast('Your session has expired. Please sign in again.', 'error');
        setTimeout(() => handleLogout(), 2000);
      } else {
        showToast(
          err.response?.data?.message || err.message || 'Failed to connect to gearly-product on port 3000.',
          'error'
        );
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentEditId(null);
    setProductForm({ name: '', part_number: '', price: '', descri: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setModalMode('edit');
    setCurrentEditId(product.id);
    setProductForm({
      name: product.name || '',
      part_number: product.part_number || '',
      price: product.price ? product.price.toString() : '',
      descri: product.descri || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setProductForm({ name: '', part_number: '', price: '', descri: '' });
    setCurrentEditId(null);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: productForm.name.trim(),
      part_number: productForm.part_number.trim(),
      price: parseInt(productForm.price, 10),
      descri: productForm.descri.trim()
    };

    if (isNaN(payload.price) || payload.price <= 0) {
      showToast('Please enter a valid price greater than 0.', 'error');
      setSubmitting(false);
      return;
    }

    try {
      if (modalMode === 'create') {
        await productApi.createProduct(payload);
        showToast(`Product "${payload.name}" created successfully!`, 'success');
      } else {
        await productApi.updateProduct(currentEditId, payload);
        showToast(`Product "${payload.name}" updated successfully!`, 'success');
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      if (err.response?.status === 401) {
        showToast('JWT Authentication failed. Please log in again.', 'error');
      } else {
        const errMsg = err.response?.data?.message || err.response?.data || err.message || 'Operation failed';
        showToast(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) return;

    try {
      await productApi.deleteProduct(id);
      showToast(`Product "${name}" deleted!`, 'success');
      fetchProducts();
    } catch (err) {
      if (err.response?.status === 401) {
        showToast('JWT Authentication failed. Please log in again.', 'error');
      } else {
        showToast(err.response?.data || err.message || 'Failed to delete product', 'error');
      }
    }
  };

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.part_number && p.part_number.toLowerCase().includes(q)) ||
      (p.descri && p.descri.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  // Inventory stats
  const totalValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  }, [products]);

  const avgPrice = useMemo(() => {
    if (!products.length) return 0;
    return Math.round(totalValue / products.length);
  }, [products, totalValue]);

  // --- Security Testing Helpers ---
  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      showToast('JWT copied to clipboard!', 'success');
    }
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

  const testWithJwt = async () => {
    setTestResult(null);
    const result = await executeApiAndLog('GET', '/dashboard', () => authApi.getDashboard());
    setTestResult({ type: 'with-jwt', ...result });
  };

  const testWithoutJwt = async () => {
    setTestResult(null);
    const result = await executeApiAndLog('GET', '/dashboard', () => 
      authApi.getDashboard({ headers: { Authorization: '' } })
    );
    setTestResult({ type: 'without-jwt', ...result });
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <header className="glass-panel" style={{ borderRadius: 0, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <h1 style={{ fontSize: '1.4rem', margin: 0, letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="text-gradient" style={{ fontWeight: 800 }}>GEARLY</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.8rem' }}>
              Microservice Portal
            </span>
          </h1>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
            <button 
              onClick={() => setActiveTab('products')}
              className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Package size={16} /> Products Catalog
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Key size={16} /> Token & Security
            </button>
          </div>
        </div>

        {/* User Profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: token ? 'var(--success)' : 'var(--danger)' }}></span>
            <span style={{ color: 'var(--text-muted)' }}>
              {claims?.roles ? `${claims.roles.toUpperCase()} #${claims.sub}` : 'Authenticated'}
            </span>
          </div>
          <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <LogOut size={16} /> Log out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="container" style={{ marginTop: '2rem', flexGrow: 1 }}>

        {/* Toast / Notification Banner */}
        {statusMessage && (
          <div 
            className={`glass-panel animate-slide-up ${statusMessage.type === 'success' ? 'bg-success' : 'bg-danger'}`} 
            style={{ padding: '0.9rem 1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '8px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' }}>
              {statusMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* --- VIEW 1: PRODUCTS CATALOG MANAGEMENT --- */}
        {activeTab === 'products' && (
          <div>
            {/* KPI Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
              <div className="glass-panel" style={{ padding: '1.2rem' }}>
                <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Products</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{products.length}</h2>
                  <Package size={28} className="text-gradient" />
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.2rem' }}>
                <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Catalog Total Value</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.8rem', margin: 0 }}>₹{totalValue.toLocaleString()}</h2>
                  <DollarSign size={28} className="text-gradient" />
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.2rem' }}>
                <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Part Price</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.8rem', margin: 0 }}>₹{avgPrice.toLocaleString()}</h2>
                  <Layers size={28} className="text-gradient" />
                </div>
              </div>
            </div>

            {/* Controls Bar: Search & Add Product */}
            <div className="glass-panel" style={{ padding: '1.2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flexGrow: 1, maxWidth: '450px' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name, part number, description..."
                  style={{ paddingLeft: '2.8rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button 
                  onClick={fetchProducts} 
                  className="btn btn-outline" 
                  disabled={loadingProducts}
                  title="Reload inventory from gearly-product backend"
                >
                  <RefreshCw size={16} className={loadingProducts ? 'animate-spin' : ''} /> Refresh
                </button>
                <button 
                  onClick={openCreateModal} 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Plus size={18} /> Add New Product
                </button>
              </div>
            </div>

            {/* Products Grid */}
            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
                <p>Connecting to <code>gearly-product</code> microservice...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <Package size={48} className="text-muted" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h3>No Products Found</h3>
                <p className="text-muted" style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
                  {searchQuery ? `No products match your search "${searchQuery}".` : 'You haven\'t added any products to your catalog yet.'}
                </p>
                <button onClick={openCreateModal} className="btn btn-primary">
                  <Plus size={16} /> Create Your First Product
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {filteredProducts.map((p) => (
                  <div key={p.id} className="glass-panel glass-panel-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{p.name}</h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                            {p.part_number}
                          </span>
                        </div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
                          ₹{Number(p.price).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem', minHeight: '40px', lineHeight: 1.4 }}>
                        {p.descri}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        ID: #{p.id} • Shop #{p.shopkeeper_id}
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => openEditModal(p)}
                          className="btn btn-outline" 
                          style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="btn btn-outline" 
                          style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- VIEW 2: JWT & SECURITY INSPECTOR --- */}
        {activeTab === 'security' && (
          <div className="animate-slide-up">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              
              {/* CARD: Auth Status & Claims */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <ShieldAlert size={20} className="text-gradient" /> Verified JWT Claims
                </h3>
                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <div><strong>Subject (User ID):</strong> {claims?.sub || 'N/A'}</div>
                  <div><strong>Role:</strong> {claims?.roles || 'N/A'}</div>
                  <div><strong>Issued At:</strong> {claims?.iat ? new Date(claims.iat * 1000).toLocaleString() : 'N/A'}</div>
                  <div><strong>Expires:</strong> {claims?.exp ? new Date(claims.exp * 1000).toLocaleString() : 'N/A'}</div>
                </div>
              </div>

              {/* CARD: Raw JWT Token */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Key size={20} className="text-gradient" /> Current JWT String
                </h3>
                <div className="code-block" style={{ height: '80px', marginBottom: '1rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.8rem' }}>
                  {token || 'No token found...'}
                </div>
                <button onClick={copyToken} className="btn btn-outline" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Copy size={16} /> Copy Token for cURL Testing
                </button>
              </div>
            </div>

            {/* Test Protected API Panel */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '0.5rem' }}>Axum Middleware Verification Test</h2>
              <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
                Verify that your Rust backend actively accepts the valid JWT and rejects unauthenticated requests.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={testWithJwt} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={18} /> Test GET /dashboard With JWT
                </button>
                <button onClick={testWithoutJwt} className="btn btn-outline" style={{ flex: 1, borderColor: 'rgba(239, 68, 68, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <XCircle size={18} className="status-danger" /> Test Without JWT
                </button>
              </div>

              {testResult && (
                <div className="code-block animate-slide-up" style={{ padding: '1.5rem', background: 'var(--bg-panel-solid)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    <strong>{testResult.type === 'with-jwt' ? 'TEST WITH JWT' : 'TEST WITHOUT JWT'}</strong>
                    <span className={testResult.success ? 'status-success' : 'status-danger'}>
                      {testResult.success ? '🟢 Access Granted' : '🔴 Access Denied'}
                    </span>
                  </div>
                  
                  <div style={{ fontFamily: 'monospace', lineHeight: 1.6, fontSize: '0.85rem' }}>
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
          </div>
        )}

      </main>

      {/* --- ADD / EDIT PRODUCT MODAL --- */}
      {isModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '520px', padding: '2rem', background: 'var(--bg-panel-solid)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package className="text-gradient" size={22} />
                {modalMode === 'create' ? 'Add New Product' : 'Edit Product'}
              </h3>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Product Name *</label>
                <input 
                  type="text" 
                  required
                  value={productForm.name} 
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Brembo Front Brake Pads"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Part Number *</label>
                  <input 
                    type="text" 
                    required
                    value={productForm.part_number} 
                    onChange={(e) => setProductForm({ ...productForm, part_number: e.target.value })}
                    placeholder="e.g. BRM-9921"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Price (₹) *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={productForm.price} 
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="e.g. 4500"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Description *</label>
                <textarea 
                  rows="3"
                  required
                  value={productForm.descri} 
                  onChange={(e) => setProductForm({ ...productForm, descri: e.target.value })}
                  placeholder="Enter detailed automotive specs or vehicle compatibility..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button type="button" onClick={closeModal} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ minWidth: '140px' }}>
                  {submitting ? <span className="animate-spin"><RefreshCw size={16} /></span> : (modalMode === 'create' ? 'Save Product' : 'Update Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
