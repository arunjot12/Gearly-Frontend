import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Copy, RefreshCw, CheckCircle, XCircle, ShieldCheck, Key, 
  Package, Plus, Search, Edit3, Trash2, Layers, DollarSign, AlertCircle, X,
  UserCheck, ShieldAlert, Cpu
} from 'lucide-react';
import { authApi, getToken, clearToken } from '../services/api';
import { productApi } from '../services/productApi';

export default function Dashboard() {
  const navigate = useNavigate();
  const [token] = useState(getToken());
  
  // Navigation Tabs: 'products' | 'security'
  const [activeTab, setActiveTab] = useState('products');

  // Products State
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
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
  const [testing, setTesting] = useState(false);

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

  const showToast = (text, type = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleLogout = () => {
    clearToken();
    navigate('/');
  };

  // Load products on mount
  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

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
          err.response?.data?.message || err.message || 'Failed to connect to gearly-product backend on port 3000.',
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

  // Inventory KPI statistics
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
    setTesting(true);
    setTestResult(null);
    const result = await executeApiAndLog('GET', 'gearly-login :8000/dashboard', () => authApi.getDashboard());
    setTestResult({ type: 'with-jwt', ...result });
    setTesting(false);
  };

  const testWithoutJwt = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await executeApiAndLog('GET', 'gearly-login :8000/dashboard', () => 
      authApi.getDashboard({ headers: { Authorization: '' } })
    );
    setTestResult({ type: 'without-jwt', ...result });
    setTesting(false);
  };

  const testProductsService = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await executeApiAndLog('GET', 'gearly-product :3000/get_products', () => productApi.getProducts());
    setTestResult({ type: 'product-svc', ...result });
    setTesting(false);
  };

  const userRole = claims?.roles || 'Shopkeeper';
  const userName = claims?.sub ? `Account #${claims.sub}` : 'Shopkeeper';

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <header className="glass-panel" style={{ borderRadius: 0, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <h1 style={{ fontSize: '1.4rem', margin: 0, letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="text-gradient" style={{ fontWeight: 800 }}>GEARLY</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.8rem' }}>
              Unified Portal
            </span>
          </h1>

          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setActiveTab('products')} 
              className={activeTab === 'products' ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Package size={16} />
              <span>Inventory</span>
            </button>
            <button 
              onClick={() => setActiveTab('security')} 
              className={activeTab === 'security' ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ShieldCheck size={16} />
              <span>Auth & Security</span>
            </button>
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff`} 
              alt="Avatar" 
              style={{ width: '32px', height: '32px', borderRadius: '50%' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{userName}</span>
              <span style={{ 
                fontSize: '0.7rem', 
                color: userRole.toLowerCase() === 'shopkeeper' ? '#60a5fa' : '#34d399', 
                fontWeight: 600, 
                textTransform: 'uppercase' 
              }}>
                {userRole}
              </span>
            </div>
          </div>

          <button 
            onClick={handleLogout} 
            className="btn-ghost" 
            style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger-color)' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', width: '100%', margin: '2rem auto', padding: '0 1.5rem', flex: 1 }}>

        {/* Toast Notification Banner */}
        {statusMessage && (
          <div style={{
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${statusMessage.type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)'}`,
            color: statusMessage.type === 'success' ? '#34d399' : '#f87171',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {statusMessage.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{statusMessage.text}</span>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 1: PRODUCTS INVENTORY MANAGEMENT */}
        {/* ==================================================================== */}
        {activeTab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* KPI Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                  <Package size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Parts</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{products.length}</div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                  <DollarSign size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Inventory Value</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>₹{totalValue.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f472b6' }}>
                  <Layers size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Average Price</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>₹{avgPrice.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            {/* Controls Bar: Search & Add Product */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '450px' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search parts by name, code, or specs..."
                  style={{ width: '100%', paddingLeft: '2.8rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button 
                  onClick={fetchProducts} 
                  disabled={loadingProducts}
                  className="btn-ghost" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <RefreshCw size={16} className={loadingProducts ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>

                <button 
                  onClick={openCreateModal} 
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Plus size={18} />
                  <span>Add New Product</span>
                </button>
              </div>
            </div>

            {/* Products Grid */}
            {loadingProducts && products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: 'var(--primary-color)' }} />
                <p>Connecting to gearly-product backend on port 3000...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                <Package size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No products in inventory</h3>
                <p style={{ margin: '0 0 1.5rem 0' }}>Register your automotive spare parts to get started.</p>
                <button onClick={openCreateModal} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={16} />
                  <span>Add First Product</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {filteredProducts.map(product => (
                  <div key={product.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s ease' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem', gap: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>{product.name}</h3>
                        <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'monospace' }}>
                          {product.part_number}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-color)', marginBottom: '0.8rem' }}>
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </div>

                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5, minHeight: '40px' }}>
                        {product.descri || 'No description provided.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                      <button 
                        onClick={() => openEditModal(product)} 
                        className="btn-ghost" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Edit3 size={14} />
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id, product.name)} 
                        className="btn-ghost" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger-color)' }}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: SECURITY & MICROSERVICES VERIFICATION */}
        {/* ==================================================================== */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Identity & JWT Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              
              {/* Claims Card */}
              <div className="glass-panel" style={{ padding: '1.8rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <UserCheck size={20} color="var(--accent-color)" />
                  <span>Decoded Identity Claims</span>
                </h3>

                {claims ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Subject (User ID)</span>
                      <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{claims.sub}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Assigned Role</span>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '6px', 
                        fontSize: '0.8rem', 
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background: claims.roles === 'shopkeeper' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: claims.roles === 'shopkeeper' ? '#60a5fa' : '#34d399'
                      }}>
                        {claims.roles || 'USER'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Issued At (iat)</span>
                      <span style={{ fontSize: '0.85rem' }}>{claims.iat ? new Date(claims.iat * 1000).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Expires (exp)</span>
                      <span style={{ fontSize: '0.85rem', color: claims.exp * 1000 > Date.now() ? 'var(--accent-color)' : 'var(--danger-color)' }}>
                        {claims.exp ? new Date(claims.exp * 1000).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No claims found.</p>
                )}
              </div>

              {/* Raw Token Card */}
              <div className="glass-panel" style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Key size={18} color="var(--primary-color)" />
                    <span>Active JWT Token</span>
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
                  background: 'rgba(0, 0, 0, 0.3)', 
                  padding: '1rem', 
                  borderRadius: '8px', 
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

                <p style={{ margin: '0.8rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  This token is passed as an <code style={{ color: 'var(--accent-color)' }}>Authorization: Bearer &lt;token&gt;</code> header to both <code style={{ color: '#60a5fa' }}>gearly-login</code> (8000) and <code style={{ color: '#34d399' }}>gearly-product</code> (3000).
                </p>
              </div>
            </div>

            {/* Backend Verification Triggers */}
            <section className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Cpu size={20} color="var(--primary-color)" />
                <span>Microservice API Verifiers</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.5rem 0' }}>
                Directly ping both Rust backend microservices to test authentication layers and latency.
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <button 
                  onClick={testWithJwt} 
                  disabled={testing}
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}
                >
                  <ShieldCheck size={16} />
                  <span>Test Auth Backend (gearly-login :8000)</span>
                </button>

                <button 
                  onClick={testProductsService} 
                  disabled={testing}
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  <Package size={16} />
                  <span>Test Products Backend (gearly-product :3000)</span>
                </button>

                <button 
                  onClick={testWithoutJwt} 
                  disabled={testing}
                  className="btn-ghost" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--danger-color)' }}
                >
                  <ShieldAlert size={16} />
                  <span>Test Without Token &rarr; Expect 401</span>
                </button>
              </div>

              {/* Test Result Box */}
              {testResult && (
                <div style={{
                  background: testResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  borderRadius: '8px',
                  padding: '1rem 1.2rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: testResult.success ? 'var(--accent-color)' : 'var(--danger-color)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                    {testResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span>
                      {testResult.type === 'without-jwt'
                        ? (testResult.status === 401 ? 'PASS: Backend successfully rejected missing token with 401 Unauthorized' : `Status: ${testResult.status}`)
                        : (testResult.success ? `PASS: Response 200 OK (${testResult.status})` : `FAIL: Error ${testResult.status}`)}
                    </span>
                  </div>
                  <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {typeof testResult.data === 'string' ? testResult.data : JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Live Activity Logs */}
              {logs.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
                    Recent Microservice Requests
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {logs.map(log => (
                      <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{log.timestamp}</span>
                          <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{log.method}</span>
                          <span>{log.endpoint}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <span style={{ color: log.status === 200 ? 'var(--accent-color)' : 'var(--danger-color)', fontWeight: 600 }}>
                            {log.status}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>{log.timeMs}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* ADD / EDIT PRODUCT MODAL */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
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
                <button type="button" onClick={closeModal} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ minWidth: '140px' }}>
                  {submitting ? <RefreshCw size={16} className="animate-spin" /> : (modalMode === 'create' ? 'Save Product' : 'Update Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
