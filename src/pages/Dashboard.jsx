import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Copy, RefreshCw, CheckCircle, XCircle, ShieldCheck, Key, 
  Package, Plus, Search, Edit3, Trash2, Layers, DollarSign, X,
  UserCheck, Cpu, ShoppingBag, Store, Check,
  ChevronLeft, ChevronRight, Filter, Car, Zap, Tag, Eye,
  ArrowUpDown, Truck, Sparkles, AlertTriangle
} from 'lucide-react';
import { authApi, getToken, clearToken } from '../services/api';
import { productApi } from '../services/productApi';

// Intelligent automotive category detection based on keywords
function getCategoryInfo(name = '', descri = '') {
  const text = `${name} ${descri}`.toLowerCase();
  if (/brake|pad|rotor|caliper|disc/i.test(text)) {
    return { name: 'Brakes', icon: Zap, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
  }
  if (/engine|spark|piston|filter|oil|timing|gasket|turbo|valve/i.test(text)) {
    return { name: 'Engine & Powertrain', icon: Car, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' };
  }
  if (/suspension|strut|shock|spring|arm|bushing|sway/i.test(text)) {
    return { name: 'Suspension', icon: Layers, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' };
  }
  if (/electric|sensor|battery|alternator|starter|ecu|relay|wire|light/i.test(text)) {
    return { name: 'Electrical & Sensors', icon: Cpu, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' };
  }
  return { name: 'OEM Replacement', icon: Package, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [token] = useState(getToken());

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

  const isShopkeeper = claims?.roles?.toLowerCase() === 'shopkeeper';
  
  // Navigation View: 'marketplace' | 'inventory' | 'security'
  const [activeView, setActiveView] = useState(isShopkeeper ? 'inventory' : 'marketplace');

  // Products Data States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'price_asc' | 'price_desc' | 'name_asc'
  const [statusMessage, setStatusMessage] = useState(null);

  // Pagination State
  const [limit, setLimit] = useState(12);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Cart Drawer State (Prepares for gearly-order microservice)
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('gearly_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentEditId, setCurrentEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    part_number: '',
    price: '',
    descri: ''
  });

  // Quick View Modal
  const [viewingProduct, setViewingProduct] = useState(null);
  const [quickViewQty, setQuickViewQty] = useState(1);

  // Delete Confirmation Modal
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  // SKU Copy Feedback Tracker (sku => boolean)
  const [copiedSku, setCopiedSku] = useState(null);

  // Security Test State
  const [logs, setLogs] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const showToast = (text, type = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleLogout = () => {
    clearToken();
    navigate('/');
  };

  // Load products based on active view and pagination
  useEffect(() => {
    fetchProducts();
  }, [activeView, offset, limit]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let res;
      if (activeView === 'inventory' && isShopkeeper) {
        // Fetch shopkeeper's store inventory with pagination
        res = await productApi.getProducts({ limit, offset });
      } else {
        // Fetch public marketplace catalog across all stores with pagination
        res = await productApi.getPublicProducts({ limit, offset });
      }
      const data = Array.isArray(res.data) ? res.data : [];
      setProducts(data);
      setHasMore(data.length === limit);
    } catch (err) {
      if (err.response?.status === 401) {
        showToast('Your session has expired. Please sign in again.', 'error');
        setTimeout(() => handleLogout(), 1800);
      } else {
        showToast(
          err.response?.data?.message || err.message || 'Failed to connect to gearly-product on port 3000.',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Cart Actions ---
  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      let updated;
      if (existing) {
        updated = prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        updated = [...prev, { ...product, quantity }];
      }
      localStorage.setItem('gearly_cart', JSON.stringify(updated));
      return updated;
    });
    showToast(`Added ${quantity > 1 ? `${quantity}x ` : ''}"${product.name}" to cart! 🛒`, 'success');
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) => {
      const updated = prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
      localStorage.setItem('gearly_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem('gearly_cart', JSON.stringify(updated));
      return updated;
    });
    showToast('Item removed from cart.', 'info');
  };

  const clearEntireCart = () => {
    setCart([]);
    localStorage.removeItem('gearly_cart');
    showToast('Cart cleared.', 'info');
  };

  const handleCheckoutSimulated = () => {
    if (cart.length === 0) return;
    showToast('🚀 Order request routed! Ready for gearly-order microservice dispatch.', 'success');
    setIsCartOpen(false);
    clearEntireCart();
  };

  // --- SKU 1-Click Copy ---
  const handleCopySku = (sku, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // --- Product Mutation Actions (Shopkeepers Only) ---
  const openCreateModal = () => {
    setModalMode('create');
    setCurrentEditId(null);
    setProductForm({ name: '', part_number: '', price: '', descri: '' });
    setIsProductModalOpen(true);
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
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setProductForm({ name: '', part_number: '', price: '', descri: '' });
    setCurrentEditId(null);
  };

  // Quick Preset autofill for demo / ease of use
  const applyPreset = (preset) => {
    setProductForm(preset);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: productForm.name.trim(),
      part_number: productForm.part_number.trim().toUpperCase(),
      price: parseInt(productForm.price, 10),
      descri: productForm.descri.trim()
    };

    if (isNaN(payload.price) || payload.price <= 0) {
      showToast('Please enter a valid price greater than ₹0.', 'error');
      setSubmitting(false);
      return;
    }

    try {
      if (modalMode === 'create') {
        await productApi.createProduct(payload);
        showToast(`Spare part "${payload.name}" listed successfully!`, 'success');
      } else {
        await productApi.updateProduct(currentEditId, payload);
        showToast(`Part "${payload.name}" updated successfully!`, 'success');
      }
      closeProductModal();
      fetchProducts();
    } catch (err) {
      if (err.response?.status === 403) {
        showToast('RBAC Guard: Only registered shopkeepers are permitted to list products.', 'error');
      } else {
        const errMsg = err.response?.data?.message || err.response?.data || err.message || 'Operation failed';
        showToast(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deleteCandidate) return;
    try {
      await productApi.deleteProduct(deleteCandidate.id);
      showToast(`Part "${deleteCandidate.name}" removed from inventory!`, 'success');
      setDeleteCandidate(null);
      fetchProducts();
    } catch (err) {
      if (err.response?.status === 403) {
        showToast('RBAC Guard: Only the authorized shopkeeper can remove this part.', 'error');
      } else {
        showToast(err.response?.data || err.message || 'Failed to delete part', 'error');
      }
    }
  };

  // --- Filtering & Sorting Pipeline ---
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.part_number && p.part_number.toLowerCase().includes(q)) ||
        (p.descri && p.descri.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      list = list.filter(p => {
        const cat = getCategoryInfo(p.name, p.descri);
        return cat.name.toLowerCase().includes(selectedCategory.toLowerCase());
      });
    }

    // Sort order
    if (sortBy === 'price_asc') {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'name_asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return list;
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Inventory KPI metrics
  const totalValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  }, [products]);

  const avgPrice = useMemo(() => {
    if (!products.length) return 0;
    return Math.round(totalValue / products.length);
  }, [products, totalValue]);

  // Cart Totals
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * item.quantity), 0);
  }, [cart]);
  const cartGst = Math.round(cartSubtotal * 0.18);
  const cartGrandTotal = cartSubtotal + cartGst;
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Pagination navigation
  const currentPage = Math.floor(offset / limit) + 1;
  const handlePrevPage = () => {
    if (offset >= limit) {
      setOffset(offset - limit);
    }
  };
  const handleNextPage = () => {
    if (hasMore) {
      setOffset(offset + limit);
    }
  };

  // --- Security & Verification Helpers ---
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

  const testAuthDashboard = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await executeApiAndLog('GET', 'gearly-login :8000/dashboard', () => authApi.getDashboard());
    setTestResult({ name: 'Auth /dashboard', ...result });
    setTesting(false);
  };

  const testPublicProducts = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await executeApiAndLog('GET', 'gearly-product :3000/products/public', () => productApi.getPublicProducts());
    setTestResult({ name: 'Public Marketplace', ...result });
    setTesting(false);
  };

  const testProtectedProducts = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await executeApiAndLog('GET', 'gearly-product :3000/get_products', () => productApi.getProducts());
    setTestResult({ name: 'Shopkeeper /get_products', ...result });
    setTesting(false);
  };

  const testHealthProbe = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await executeApiAndLog('GET', 'gearly-product :3000/health', async () => {
      const res = await fetch('http://localhost:3000/health');
      return { status: res.status, data: await res.json() };
    });
    setTestResult({ name: 'Health Probe', ...result });
    setTesting(false);
  };

  const userRole = claims?.roles || 'Customer';
  const userName = claims?.sub ? `${userRole} #${claims.sub}` : 'User';

  const categoryFilters = [
    { label: 'All', icon: Package },
    { label: 'Brakes', icon: Zap },
    { label: 'Engine', icon: Car },
    { label: 'Suspension', icon: Layers },
    { label: 'Electrical', icon: Cpu },
  ];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '90px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <header className="glass-panel" style={{ borderRadius: 0, padding: '0.85rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40, borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }} onClick={() => setActiveView('marketplace')}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(6, 182, 212, 0.45)' }}>
              <Car size={22} color="#ffffff" />
            </div>
            <div>
              <span className="text-gradient" style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '1px', display: 'block', lineHeight: 1.1 }}>GEARLY</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '0.6px', textTransform: 'uppercase', fontWeight: 700 }}>Auto Marketplace</span>
            </div>
          </div>

          {/* Navigation Mode Selector */}
          <nav style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => { setActiveView('marketplace'); setOffset(0); }} 
              className={activeView === 'marketplace' ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderRadius: '7px', border: 'none' }}
            >
              <Store size={15} />
              <span>Catalog</span>
            </button>
            
            {isShopkeeper && (
              <button 
                onClick={() => { setActiveView('inventory'); setOffset(0); }} 
                className={activeView === 'inventory' ? 'btn-primary' : 'btn-ghost'}
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderRadius: '7px', border: 'none' }}
              >
                <Package size={15} />
                <span>My Inventory</span>
              </button>
            )}

            <button 
              onClick={() => setActiveView('security')} 
              className={activeView === 'security' ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderRadius: '7px', border: 'none' }}
            >
              <ShieldCheck size={15} />
              <span>Diagnostics</span>
            </button>
          </nav>
        </div>

        {/* Right Section: Cart, Profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          
          {/* Interactive Cart Button */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="btn-ghost"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.6rem', 
              padding: '0.45rem 0.95rem', 
              borderRadius: '20px', 
              borderColor: cartItemsCount > 0 ? 'var(--accent-cyan)' : 'var(--border-color)',
              background: cartItemsCount > 0 ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              cursor: 'pointer' 
            }}
            title="Open Cart Drawer"
          >
            <ShoppingBag size={17} color={cartItemsCount > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
            <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>Cart</span>
            {cartItemsCount > 0 && (
              <span style={{ background: 'var(--accent-cyan)', color: '#000', fontSize: '0.72rem', fontWeight: 800, padding: '1px 7px', borderRadius: '10px' }}>
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* User Profile Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.8rem', borderLeft: '1px solid var(--border-color)' }}>
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=06b6d4&color=000&bold=true`} 
              alt="Avatar" 
              style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1.5px solid rgba(6, 182, 212, 0.45)' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{userName}</span>
              <span style={{ 
                fontSize: '0.68rem', 
                color: isShopkeeper ? '#60a5fa' : '#34d399', 
                fontWeight: 700, 
                textTransform: 'uppercase' 
              }}>
                {isShopkeeper ? '🏪 Shopkeeper' : '👤 Customer'}
              </span>
            </div>
          </div>

          <button 
            onClick={handleLogout} 
            className="btn-danger-ghost" 
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', borderRadius: '8px' }}
            title="Sign Out"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1320px', width: '100%', margin: '1.8rem auto', padding: '0 1.5rem', flex: 1 }}>

        {/* Floating Toast Notification */}
        {statusMessage && (
          <div className="animate-fade-in" style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 100,
            padding: '0.95rem 1.4rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.96)' : 'rgba(16, 185, 129, 0.96)',
            backdropFilter: 'blur(12px)',
            color: '#ffffff',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}>
            {statusMessage.type === 'error' ? <XCircle size={19} /> : <CheckCircle size={19} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 1: INNOVATIVE PUBLIC MARKETPLACE CATALOG                        */}
        {/* ==================================================================== */}
        {activeView === 'marketplace' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
            
            {/* Innovative Automotive Hero Banner */}
            <div className="glass-panel card-sheen" style={{ 
              padding: '2.4rem 2.8rem', 
              position: 'relative', 
              overflow: 'hidden', 
              background: 'linear-gradient(135deg, rgba(16, 24, 40, 0.85) 0%, rgba(10, 14, 24, 0.95) 100%)', 
              border: '1px solid rgba(6, 182, 212, 0.25)',
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}>
              <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(6, 182, 212, 0.14)', border: '1px solid rgba(6, 182, 212, 0.35)', borderRadius: '20px', padding: '4px 14px', color: 'var(--accent-cyan)', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '1rem' }}>
                  <span className="pulse-dot"></span>
                  LIVE PUBLIC MARKETPLACE &bull; ZERO-AUTH ACCESS &bull; GET /products/public
                </div>
                <h2 style={{ fontSize: '2.25rem', margin: '0 0 0.6rem 0', fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1.15 }}>
                  Precision Engineered <span className="text-gradient">Automotive Parts</span>
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', margin: 0, lineHeight: 1.6, maxWidth: '680px' }}>
                  Direct procurement from certified auto shopkeepers. Every component verified for OEM tolerances, factory SKU specs, and guaranteed vehicle fitment.
                </p>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#67e8f9' }}>
                    <ShieldCheck size={16} /> Genuine OEM Certification
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#34d399' }}>
                    <Truck size={16} /> Pan-India Express Delivery
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#fbbf24' }}>
                    <Sparkles size={16} /> 100% Fitment Guarantee
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Search, Categories & Filter Control Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                
                {/* Search Bar with clear button */}
                <div style={{ position: 'relative', flex: '1 1 380px', maxWidth: '560px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)' }} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by part name, SKU (e.g. BRM-9921), or specs..."
                    style={{ width: '100%', paddingLeft: '3rem', paddingRight: '2.5rem' }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Right controls: Sort, Per Page, Refresh */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                  
                  {/* Sort By Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    <ArrowUpDown size={14} color="var(--accent-cyan)" />
                    <span>Sort:</span>
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{ padding: '0.45rem 0.8rem', fontSize: '0.84rem', width: '150px', borderRadius: '8px' }}
                    >
                      <option value="default">Featured</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="name_asc">Part Name: A → Z</option>
                    </select>
                  </div>

                  {/* Limit per page */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    <span>Per page:</span>
                    <select 
                      value={limit} 
                      onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0); }}
                      style={{ padding: '0.45rem 0.6rem', fontSize: '0.84rem', width: '70px', borderRadius: '8px' }}
                    >
                      <option value={8}>8</option>
                      <option value={12}>12</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <button 
                    onClick={fetchProducts} 
                    disabled={loading}
                    className="btn-ghost" 
                    style={{ padding: '0.5rem 0.95rem', fontSize: '0.84rem' }}
                    title="Reload from backend"
                  >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    <span>Sync</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Category Chips Carousel */}
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Filter size={14} /> Domain:
                </span>
                {categoryFilters.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = selectedCategory === cat.label;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => setSelectedCategory(cat.label)}
                      className={`category-pill ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={14} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}

                {(selectedCategory !== 'All' || searchQuery) && (
                  <button 
                    onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '0.5rem' }}
                  >
                    <X size={13} /> Reset filters
                  </button>
                )}
              </div>
            </div>

            {/* Product Cards Grid with Innovative Design */}
            {loading && products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 1.2rem auto', color: 'var(--accent-cyan)' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Fetching parts from gearly-product backend on port 3000...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4.5rem 2rem' }}>
                <Package size={52} style={{ margin: '0 auto 1rem auto', opacity: 0.25, color: 'var(--accent-cyan)' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>No automotive parts match your criteria</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 1.5rem auto', fontSize: '0.92rem' }}>
                  We couldn't find any products matching your search or active category filters. Try clearing your search or browsing all categories.
                </p>
                <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} className="btn-ghost" style={{ fontSize: '0.88rem' }}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.6rem' }}>
                {filteredProducts.map((p) => {
                  const catInfo = getCategoryInfo(p.name, p.descri);
                  const CategoryIcon = catInfo.icon;
                  const price = Number(p.price) || 0;
                  const msrp = Math.round(price * 1.18);
                  const isCopied = copiedSku === p.part_number;

                  return (
                    <div key={p.id} className="product-card-modern card-sheen">
                      
                      {/* Top Header: Category Tag & Stock Pulse */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: catInfo.bg, color: catInfo.color, padding: '3px 9px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, border: `1px solid ${catInfo.color}40` }}>
                          <CategoryIcon size={13} />
                          <span>{catInfo.name}</span>
                        </div>
                        <span className="badge-stock">
                          <span className="pulse-dot"></span>
                          In Stock
                        </span>
                      </div>

                      {/* Part Name */}
                      <h3 style={{ fontSize: '1.18rem', fontWeight: 700, margin: '0 0 0.45rem 0', color: '#ffffff', lineHeight: 1.35 }}>
                        {p.name}
                      </h3>

                      {/* Interactive SKU with 1-Click Copy */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                        <button
                          onClick={(e) => handleCopySku(p.part_number, e)}
                          title="Click to copy SKU"
                          style={{
                            background: isCopied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.12)',
                            border: `1px solid ${isCopied ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.3)'}`,
                            color: isCopied ? '#34d399' : '#60a5fa',
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
                          {isCopied ? <Check size={12} /> : <Copy size={12} />}
                          <span>#{p.part_number}</span>
                          {isCopied && <span style={{ fontSize: '0.7rem' }}>Copied!</span>}
                        </button>

                        <span className="badge-oem">OEM Genuine</span>
                      </div>

                      {/* Technical Description Snippet */}
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1.2rem 0', lineHeight: 1.5, minHeight: '40px' }}>
                        {p.descri || 'Direct replacement automotive component engineered to OEM specifications with complete warranty.'}
                      </p>

                      {/* Seller Tag & Fitment Verification */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', padding: '0.5rem 0.8rem', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          Verified Store #{p.shopkeeper_id || claims?.sub || '1'}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#67e8f9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <ShieldCheck size={13} /> 100% Fit
                        </span>
                      </div>

                      {/* Price Section & Action Buttons */}
                      <div style={{ paddingTop: '1.1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
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

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => { setViewingProduct(p); setQuickViewQty(1); }} 
                            className="btn-ghost" 
                            style={{ padding: '0.55rem 0.75rem', borderRadius: '8px' }}
                            title="Quick View Specs"
                          >
                            <Eye size={17} />
                          </button>
                          
                          <button 
                            onClick={() => addToCart(p, 1)} 
                            className="btn-emerald" 
                            style={{ padding: '0.55rem 1rem', fontSize: '0.86rem', borderRadius: '8px', gap: '0.45rem' }}
                          >
                            <ShoppingBag size={15} />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.6rem', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Page <strong style={{ color: '#ffffff' }}>{currentPage}</strong> &bull; Showing {filteredProducts.length} items &bull; Offset <strong>{offset}</strong>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button 
                  onClick={handlePrevPage} 
                  disabled={offset === 0 || loading}
                  className="btn-ghost" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                <button 
                  onClick={handleNextPage} 
                  disabled={!hasMore || loading}
                  className="btn-ghost" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 2: SHOPKEEPER STORE INVENTORY MANAGEMENT                        */}
        {/* ==================================================================== */}
        {activeView === 'inventory' && isShopkeeper && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
            
            {/* KPI Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.4rem' }}>
              <div className="glass-panel card-sheen" style={{ padding: '1.6rem', display: 'flex', alignItems: 'center', gap: '1.2rem', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                  <Package size={26} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.6px' }}>Store Listed Parts</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>{products.length} Parts</div>
                </div>
              </div>

              <div className="glass-panel card-sheen" style={{ padding: '1.6rem', display: 'flex', alignItems: 'center', gap: '1.2rem', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
                  <DollarSign size={26} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.6px' }}>Total Stock Valuation</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>₹{totalValue.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="glass-panel card-sheen" style={{ padding: '1.6rem', display: 'flex', alignItems: 'center', gap: '1.2rem', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                  <Layers size={26} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.6px' }}>Average Unit Price</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>₹{avgPrice.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            {/* Store Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '480px' }}>
                <Search size={18} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter store inventory by name or SKU..."
                  style={{ width: '100%', paddingLeft: '2.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button 
                  onClick={fetchProducts} 
                  disabled={loading}
                  className="btn-ghost" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  <span>Sync Store</span>
                </button>

                <button 
                  onClick={openCreateModal} 
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Plus size={18} />
                  <span>Register New Spare Part</span>
                </button>
              </div>
            </div>

            {/* Shopkeeper Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4.5rem 2rem' }}>
                <Store size={52} style={{ margin: '0 auto 1.2rem auto', opacity: 0.3, color: 'var(--accent-primary)' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>Your store has no parts listed</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.8rem', fontSize: '0.94rem', maxWidth: '450px', margin: '0 auto 1.8rem auto' }}>
                  List your automotive spare parts to immediately distribute them across the public Gearly marketplace.
                </p>
                <button onClick={openCreateModal} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={16} />
                  <span>Add First Spare Part</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.6rem' }}>
                {filteredProducts.map((product) => {
                  const catInfo = getCategoryInfo(product.name, product.descri);
                  const CategoryIcon = catInfo.icon;

                  return (
                    <div key={product.id} className="glass-panel glass-panel-hover" style={{ padding: '1.6rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: catInfo.bg, color: catInfo.color, padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                            <CategoryIcon size={12} />
                            <span>{catInfo.name}</span>
                          </div>
                          <span className="badge-sku">#{product.part_number}</span>
                        </div>

                        <h3 style={{ margin: '0 0 0.6rem 0', fontSize: '1.2rem', fontWeight: 700 }}>{product.name}</h3>
                        
                        <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.8rem' }}>
                          ₹{Number(product.price).toLocaleString('en-IN')}
                        </div>

                        <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0, lineHeight: 1.5, minHeight: '42px' }}>
                          {product.descri || 'No description provided.'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.4rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <button 
                          onClick={() => openEditModal(product)} 
                          className="btn-ghost" 
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <Edit3 size={14} />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => setDeleteCandidate(product)} 
                          className="btn-danger-ghost" 
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.6rem', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Page <strong style={{ color: '#ffffff' }}>{currentPage}</strong> &bull; Showing {filteredProducts.length} items &bull; Offset <strong>{offset}</strong>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button onClick={handlePrevPage} disabled={offset === 0} className="btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.84rem' }}>
                  Previous
                </button>
                <button onClick={handleNextPage} disabled={!hasMore} className="btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.84rem' }}>
                  Next
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 3: SECURITY & MICROSERVICES VERIFICATION                        */}
        {/* ==================================================================== */}
        {activeView === 'security' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
            
            {/* Identity & Claims Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              
              {/* Claims Card */}
              <div className="glass-panel" style={{ padding: '1.8rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <UserCheck size={20} color="var(--accent-cyan)" />
                  <span>Decoded Identity Claims</span>
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
                        {claims.roles || 'USER'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Issued At (iat)</span>
                      <span style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{claims.iat ? new Date(claims.iat * 1000).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Expires (exp)</span>
                      <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: claims.exp * 1000 > Date.now() ? 'var(--accent-emerald)' : 'var(--danger)' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
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
                  This token is passed as an <code style={{ color: 'var(--accent-cyan)' }}>Authorization: Bearer &lt;token&gt;</code> header to both <code style={{ color: '#60a5fa' }}>gearly-login</code> (8000) and <code style={{ color: '#34d399' }}>gearly-product</code> (3000).
                </p>
              </div>
            </div>

            {/* Backend Verification Triggers */}
            <section className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Cpu size={20} color="var(--accent-cyan)" />
                <span>Microservice Route Diagnostics</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1.5rem 0' }}>
                Trigger live HTTP calls across your Rust microservices to verify routing, authorization, and latency.
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

              {/* Live Request Activity Logs */}
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
                          <span>{log.endpoint}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <span style={{ color: log.status === 200 ? 'var(--accent-emerald)' : 'var(--danger)', fontWeight: 700 }}>
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
        )}
      </main>

      {/* ==================================================================== */}
      {/* SLIDE-OVER CART DRAWER (Microservices Order Preparation)              */}
      {/* ==================================================================== */}
      {isCartOpen && (
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
          onClick={(e) => { if (e.target === e.currentTarget) setIsCartOpen(false); }}
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
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Your Parts Cart</h3>
                <span style={{ background: 'var(--accent-cyan)', color: '#000', fontSize: '0.72rem', fontWeight: 800, padding: '1px 6px', borderRadius: '10px' }}>
                  {cartItemsCount}
                </span>
              </div>
              <button onClick={() => setIsCartOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1.6rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                  <ShoppingBag size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.25, color: 'var(--accent-cyan)' }} />
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Your cart is empty</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Browse the public catalog and add spare parts to initiate an order.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ flex: 1, paddingRight: '0.8rem' }}>
                      <span className="badge-sku" style={{ fontSize: '0.7rem' }}>#{item.part_number}</span>
                      <h4 style={{ margin: '0.3rem 0 0.2rem 0', fontSize: '0.96rem', fontWeight: 700 }}>{item.name}</h4>
                      <div style={{ fontSize: '0.94rem', color: 'var(--accent-emerald)', fontWeight: 800 }}>
                        ₹{(Number(item.price) || 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <button 
                          onClick={() => updateCartQty(item.id, -1)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '4px 8px', cursor: 'pointer' }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateCartQty(item.id, 1)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '4px 8px', cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.id)}
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

            {/* Cart Footer & Checkout Action */}
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
                  <button onClick={clearEntireCart} className="btn-ghost" style={{ flex: 1, fontSize: '0.85rem' }}>
                    Clear
                  </button>
                  <button onClick={handleCheckoutSimulated} className="btn-emerald" style={{ flex: 2, fontSize: '0.9rem' }}>
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
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: ADD / EDIT SPARE PART WITH QUICK PRESETS                    */}
      {/* ==================================================================== */}
      {isProductModalOpen && (
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
          onClick={(e) => { if (e.target === e.currentTarget) closeProductModal(); }}
        >
          <div className="glass-panel animate-scale-up" style={{ width: '100%', maxWidth: '540px', padding: '2.2rem', background: 'var(--bg-panel-solid)', boxShadow: '0 24px 60px rgba(0,0,0,0.85)', border: '1px solid rgba(6, 182, 212, 0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Package className="text-gradient" size={24} />
                {modalMode === 'create' ? 'Register New Spare Part' : 'Edit Spare Part Specs'}
              </h3>
              <button onClick={closeProductModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Quick Presets for fast testing */}
            {modalMode === 'create' && (
              <div style={{ marginBottom: '1.2rem', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>
                  ⚡ Quick Auto Presets:
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button 
                    type="button"
                    onClick={() => applyPreset({
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
                    onClick={() => applyPreset({
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
                    onClick={() => applyPreset({
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

            <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label>Part Name *</label>
                <input 
                  type="text" 
                  required
                  value={productForm.name} 
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Brembo Ceramic Front Brake Pads"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Part Number (SKU) *</label>
                  <input 
                    type="text" 
                    required
                    value={productForm.part_number} 
                    onChange={(e) => setProductForm({ ...productForm, part_number: e.target.value })}
                    placeholder="e.g. BRM-9921"
                  />
                </div>

                <div>
                  <label>Price (₹) *</label>
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
                <label>Technical Description & Vehicle Fitment *</label>
                <textarea 
                  rows="3"
                  required
                  value={productForm.descri} 
                  onChange={(e) => setProductForm({ ...productForm, descri: e.target.value })}
                  placeholder="e.g. High thermal tolerance ceramic compound. Compatible with Honda City / Civic 2018-2023..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
                <button type="button" onClick={closeProductModal} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ minWidth: '150px' }}>
                  {submitting ? <RefreshCw size={16} className="animate-spin" /> : (modalMode === 'create' ? 'List Spare Part' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: QUICK VIEW SPECS & AUTOMOTIVE FITMENT                       */}
      {/* ==================================================================== */}
      {viewingProduct && (
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
          onClick={(e) => { if (e.target === e.currentTarget) setViewingProduct(null); }}
        >
          <div className="glass-panel animate-scale-up" style={{ width: '100%', maxWidth: '600px', padding: '2.4rem', background: 'var(--bg-panel-solid)', boxShadow: '0 24px 60px rgba(0,0,0,0.85)', border: '1px solid rgba(6, 182, 212, 0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.2rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge-sku">#{viewingProduct.part_number}</span>
                  <span className="badge-oem">OEM Certified</span>
                  <span className="badge-seller">Seller #{viewingProduct.shopkeeper_id || '1'}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.45rem', color: '#ffffff', fontWeight: 800 }}>{viewingProduct.name}</h3>
              </div>
              <button onClick={() => setViewingProduct(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
              <div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Engineering Description & Specs</div>
                <p style={{ color: 'var(--text-main)', marginTop: '0.4rem', lineHeight: 1.6, fontSize: '0.94rem' }}>
                  {viewingProduct.descri || 'Genuine automotive replacement component engineered to OEM specifications with complete warranty.'}
                </p>
              </div>

              {/* Fitment Grid */}
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
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Compatible with standard Indian automotive specs. Cross-checked with Gearly Garage.</span>
                </div>
              </div>

              {/* Quantity selector & Add to Cart */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.2rem', borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total Price</span>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    ₹{(Number(viewingProduct.price) * quickViewQty).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <button 
                      onClick={() => setQuickViewQty(Math.max(1, quickViewQty - 1))}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '6px 12px', cursor: 'pointer', fontSize: '1rem' }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, minWidth: '28px', textAlign: 'center' }}>
                      {quickViewQty}
                    </span>
                    <button 
                      onClick={() => setQuickViewQty(quickViewQty + 1)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '6px 12px', cursor: 'pointer', fontSize: '1rem' }}
                    >
                      +
                    </button>
                  </div>

                  <button 
                    onClick={() => { addToCart(viewingProduct, quickViewQty); setViewingProduct(null); }} 
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
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: IN-APP DELETE CONFIRMATION DIALOG                           */}
      {/* ==================================================================== */}
      {deleteCandidate && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 130,
            padding: '1rem'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteCandidate(null); }}
        >
          <div className="glass-panel animate-scale-up" style={{ width: '100%', maxWidth: '440px', padding: '2rem', background: 'var(--bg-panel-solid)', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#f87171', marginBottom: '1rem' }}>
              <AlertTriangle size={26} />
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Remove from Inventory?</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete <strong style={{ color: '#ffffff' }}>"{deleteCandidate.name}"</strong> (SKU: {deleteCandidate.part_number})? It will be permanently delisted from the public marketplace.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
              <button onClick={() => setDeleteCandidate(null)} className="btn-ghost">
                Cancel
              </button>
              <button onClick={confirmDeleteProduct} className="btn-danger-ghost" style={{ background: 'rgba(239, 68, 68, 0.25)', color: '#ffffff', borderColor: '#ef4444' }}>
                <Trash2 size={15} />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
