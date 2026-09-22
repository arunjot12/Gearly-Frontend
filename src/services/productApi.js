import axios from 'axios';
import { getToken } from './api';

/**
 * Intelligent runtime & build-time Product API Base URL resolver.
 * 1. Prioritizes explicit VITE_PRODUCT_API_URL if set during build.
 * 2. If running in browser on localhost / 127.0.0.1, routes to local port 3000.
 * 3. On ANY deployed domain (*.onrender.com, Vercel, Netlify, custom domain),
 *    AUTOMATICALLY routes to production backend 'https://gearly-product.onrender.com'.
 *    Never defaults to localhost in a deployed environment!
 */
export const getProductBaseUrl = () => {
  const envUrl = import.meta.env.VITE_PRODUCT_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim();
  }

  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'http://localhost:3000';
    }
    return 'https://gearly-product.onrender.com';
  }

  return import.meta.env.PROD ? 'https://gearly-product.onrender.com' : 'http://localhost:3000';
};

const productClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic BaseURL & JWT Interceptor
productClient.interceptors.request.use(
  (config) => {
    config.baseURL = getProductBaseUrl();

    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const productApi = {
  // Public Marketplace Catalog (No JWT required or Customer browse)
  getPublicProducts: async ({ limit = 20, offset = 0 } = {}) => {
    return await productClient.get('/products/public', {
      params: { limit, offset }
    });
  },

  // Shopkeeper Store Inventory (Requires JWT with shopkeeper role)
  getProducts: async ({ limit = 20, offset = 0 } = {}) => {
    return await productClient.get('/get_products', {
      params: { limit, offset }
    });
  },

  getProductById: async (id) => {
    return await productClient.get(`/get_product/${id}`);
  },

  createProduct: async (productData) => {
    return await productClient.post('/create_product', productData);
  },

  updateProduct: async (id, productData) => {
    return await productClient.put(`/update_product/${id}`, productData);
  },

  deleteProduct: async (id) => {
    return await productClient.post(`/delete_product/${id}`);
  },

  checkHealth: async () => {
    return await productClient.get('/health');
  },
};

export default productApi;
