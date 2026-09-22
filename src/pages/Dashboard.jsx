import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, RefreshCw, X, ChevronLeft, ChevronRight, 
  ArrowUpDown, Filter, Package, DollarSign, Layers, CheckCircle, XCircle, Store
} from 'lucide-react';
import { productApi } from '../services/productApi';
import { getToken, clearToken, getCurrentUser } from '../services/api';
import { getCategoryInfo } from '../utils/categories';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import CartDrawer from '../components/CartDrawer';
import ProductModal from '../components/ProductModal';
import DeleteModal from '../components/DeleteModal';
import QuickViewModal from '../components/QuickViewModal';
import DiagnosticsView from '../components/DiagnosticsView';

const CATEGORY_FILTERS = ['All', 'Brakes', 'Engine & Powertrain', 'Suspension', 'Electrical & Sensors', 'OEM Replacement'];

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Current user & authentication state
  const [currentUser] = useState(() => getCurrentUser());
  const token = currentUser?.token || getToken();
  const isShopkeeper = currentUser?.isShopkeeper || false;

  // View mode: 'marketplace' | 'inventory' | 'security'
  const [activeView, setActiveView] = useState(isShopkeeper ? 'inventory' : 'marketplace');

  // Keep activeView in sync with role
  useEffect(() => {
    if (!isShopkeeper && activeView === 'inventory') {
      setActiveView('marketplace');
    }
  }, [isShopkeeper, activeView]);

  // Products Data
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [statusMessage, setStatusMessage] = useState(null);

  // Pagination
  const [limit, setLimit] = useState(12);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Auto-reset offset when search or category changes
  useEffect(() => {
    setOffset(0);
  }, [searchQuery, selectedCategory, sortBy]);

  // Cart Drawer State
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
  const [modalMode, setModalMode] = useState('create');
  const [currentEditId, setCurrentEditId] = useState(null);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', part_number: '', price: '', descri: '' });

  // Quick View & Delete Modals
  const [viewingProduct, setViewingProduct] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (text, type = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleLogout = useCallback(() => {
    clearToken();
    navigate('/');
  }, [navigate]);

  // Fetch products depending on view mode
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (activeView === 'inventory' && isShopkeeper) {
        res = await productApi.getProducts({ limit, offset });
      } else {
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
          err.response?.data?.message || err.response?.data || err.message || 'Failed to connect to gearly-product on port 3000.',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [activeView, handleLogout, isShopkeeper, limit, offset]);

  // Trigger fetch on view/pagination change
  useEffect(() => {
    if (activeView !== 'security') {
      fetchProducts();
    }
  }, [activeView, fetchProducts]);

  // Cart operations
  const handleAddToCart = (product, quantity = 1) => {
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

  const handleUpdateCartQty = (id, delta) => {
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

  const handleRemoveFromCart = (id) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem('gearly_cart', JSON.stringify(updated));
      return updated;
    });
    showToast('Item removed from cart.', 'info');
  };

  const handleClearCart = () => {
    setCart([]);
    localStorage.removeItem('gearly_cart');
    showToast('Cart cleared.', 'info');
  };

  const handleCheckoutSimulated = () => {
    if (cart.length === 0) return;
    showToast('🚀 Order dispatched! Ready for gearly-order microservice dispatch.', 'success');
    setIsCartOpen(false);
    handleClearCart();
  };

  // Product CRUD (Shopkeepers Only)
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

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSubmittingProduct(true);

    const payload = {
      name: productForm.name.trim(),
      part_number: productForm.part_number.trim().toUpperCase(),
      price: parseInt(productForm.price, 10),
      descri: productForm.descri.trim()
    };

    if (isNaN(payload.price) || payload.price <= 0) {
      showToast('Please enter a valid price greater than ₹0.', 'error');
      setSubmittingProduct(false);
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
        showToast('RBAC Guard: Only registered shopkeepers can list products.', 'error');
      } else {
        const errMsg = err.response?.data?.message || err.response?.data || err.message || 'Operation failed';
        showToast(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), 'error');
      }
    } finally {
      setSubmittingProduct(false);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
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
    } finally {
      setDeleting(false);
    }
  };

  // Client-Side Search & Filtering Pipeline
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.part_number && p.part_number.toLowerCase().includes(q)) ||
        (p.descri && p.descri.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'All') {
      list = list.filter(p => {
        const cat = getCategoryInfo(p.name, p.descri);
        return cat.name.toLowerCase().includes(selectedCategory.toLowerCase());
      });
    }

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
  const totalStockValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  }, [products]);

  const avgUnitPrice = useMemo(() => {
    if (!products.length) return 0;
    return Math.round(totalStockValue / products.length);
  }, [products, totalStockValue]);

  // Cart total items
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Pagination navigation
  const currentPage = Math.floor(offset / limit) + 1;
  const handlePrevPage = () => {
    if (offset >= limit) setOffset(offset - limit);
  };
  const handleNextPage = () => {
    if (hasMore) setOffset(offset + limit);
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '90px', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      {/* Top Navbar */}
      <Navbar 
        activeView={activeView}
        setActiveView={(v) => { setActiveView(v); setOffset(0); }}
        isShopkeeper={isShopkeeper}
        currentUser={currentUser}
        cartCount={cartItemsCount}
        onOpenCart={() => setIsCartOpen(true)}
        onLogout={handleLogout}
        storeProductCount={isShopkeeper ? products.length : 0}
      />

      {/* Main Content Body */}
      <main style={{ maxWidth: '1320px', width: '100%', margin: '2rem auto', padding: '0 1.5rem', flex: 1 }}>
        
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

        {/* ================================================================ */}
        {/* VIEW 1: PUBLIC MARKETPLACE CATALOG                               */}
        {/* ================================================================ */}
        {activeView === 'marketplace' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
            
            {/* Hero Banner */}
            <div className="glass-panel card-sheen" style={{ 
              padding: '2.4rem 2.8rem', 
              position: 'relative', 
              overflow: 'hidden', 
              background: 'linear-gradient(135deg, rgba(16, 24, 40, 0.9) 0%, rgba(10, 14, 24, 0.98) 100%)', 
              border: '1px solid rgba(6, 182, 212, 0.25)',
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7)'
            }}>
              <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.6rem', 
                  background: 'rgba(6, 182, 212, 0.14)', 
                  border: '1px solid rgba(6, 182, 212, 0.35)', 
                  borderRadius: '20px', 
                  padding: '4px 14px', 
                  color: 'var(--accent-cyan)', 
                  fontSize: '0.76rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.6px', 
                  marginBottom: '1rem' 
                }}>
                  <span className="pulse-dot"></span>
                  LIVE PUBLIC MARKETPLACE &bull; GET /products/public
                </div>
                <h2 style={{ fontSize: '2.4rem', margin: '0 0 0.6rem 0', fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1.15, color: '#ffffff' }}>
                  Precision Engineered <span className="text-gradient">Automotive Parts</span>
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', margin: 0, lineHeight: 1.6, maxWidth: '680px' }}>
                  Direct procurement from certified auto shopkeepers. Every component verified for OEM tolerances, SKU specs, and guaranteed vehicle fitment.
                </p>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                
                {/* Search Box */}
                <div style={{ position: 'relative', flex: '1 1 380px', maxWidth: '560px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)' }} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by part name, SKU (e.g. BRM-9921), or description..."
                    style={{ width: '100%', paddingLeft: '3rem', paddingRight: '2.5rem' }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Controls: Sort, Per Page, Refresh */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
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

              {/* Dynamic Category Chips */}
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Filter size={14} /> Category:
                </span>
                {CATEGORY_FILTERS.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`category-pill ${isActive ? 'active' : ''}`}
                    >
                      <span>{cat}</span>
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

            {/* Product Cards Grid */}
            {loading && products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 1.2rem auto', color: 'var(--accent-cyan)' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Fetching parts from gearly-product backend on port 3000...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4.5rem 2rem' }}>
                <Package size={52} style={{ margin: '0 auto 1rem auto', opacity: 0.25, color: 'var(--accent-cyan)' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#ffffff' }}>No automotive parts match your criteria</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 1.5rem auto', fontSize: '0.92rem' }}>
                  No parts found matching "{searchQuery}". Try clearing search or selecting a different category.
                </p>
                <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} className="btn-ghost" style={{ fontSize: '0.88rem' }}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.6rem' }}>
                {filteredProducts.map((p) => (
                  <ProductCard 
                    key={p.id}
                    product={p}
                    viewMode="catalog"
                    onQuickView={(prod) => setViewingProduct(prod)}
                    onAddToCart={(prod) => handleAddToCart(prod, 1)}
                  />
                ))}
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

        {/* ================================================================ */}
        {/* VIEW 2: SHOPKEEPER STORE INVENTORY MANAGEMENT                    */}
        {/* ================================================================ */}
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
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff' }}>{products.length} Parts</div>
                </div>
              </div>

              <div className="glass-panel card-sheen" style={{ padding: '1.6rem', display: 'flex', alignItems: 'center', gap: '1.2rem', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
                  <DollarSign size={26} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.6px' }}>Total Stock Valuation</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>₹{totalStockValue.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="glass-panel card-sheen" style={{ padding: '1.6rem', display: 'flex', alignItems: 'center', gap: '1.2rem', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                  <Layers size={26} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.6px' }}>Average Unit Price</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff' }}>₹{avgUnitPrice.toLocaleString('en-IN')}</div>
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

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4.5rem 2rem' }}>
                <Store size={52} style={{ margin: '0 auto 1.2rem auto', opacity: 0.3, color: 'var(--accent-primary)' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', color: '#ffffff' }}>Your store has no parts listed</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.8rem', fontSize: '0.94rem', maxWidth: '450px', margin: '0 auto 1.8rem auto' }}>
                  Register your automotive components to immediately distribute them across the public Gearly marketplace.
                </p>
                <button onClick={openCreateModal} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={16} />
                  <span>Add First Spare Part</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.6rem' }}>
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    viewMode="inventory"
                    onEdit={(prod) => openEditModal(prod)}
                    onDelete={(prod) => setDeleteCandidate(prod)}
                  />
                ))}
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

        {/* ================================================================ */}
        {/* VIEW 3: SECURITY & MICROSERVICES DIAGNOSTICS                     */}
        {/* ================================================================ */}
        {activeView === 'security' && (
          <DiagnosticsView 
            token={token}
            claims={currentUser?.claims}
            isShopkeeper={isShopkeeper}
            showToast={showToast}
          />
        )}

      </main>

      {/* Slide-Over Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onCheckout={handleCheckoutSimulated}
      />

      {/* Product Create/Edit Modal */}
      <ProductModal 
        isOpen={isProductModalOpen}
        mode={modalMode}
        form={productForm}
        onChange={setProductForm}
        onApplyPreset={(preset) => setProductForm(preset)}
        onSubmit={handleProductSubmit}
        onClose={closeProductModal}
        submitting={submittingProduct}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal 
        isOpen={Boolean(deleteCandidate)}
        product={deleteCandidate}
        onConfirm={confirmDeleteProduct}
        onCancel={() => setDeleteCandidate(null)}
        submitting={deleting}
      />

      {/* Quick View Specs Modal */}
      <QuickViewModal 
        isOpen={Boolean(viewingProduct)}
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
        onAddToCart={(prod, qty) => handleAddToCart(prod, qty)}
      />
    </div>
  );
}
