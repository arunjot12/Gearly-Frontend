import axios from 'axios';
import { getToken } from './api';

const PRODUCT_BASE_URL = import.meta.env.VITE_PRODUCT_API_URL || 'https://gearly-product.onrender.com';

const productClient = axios.create({
  baseURL: PRODUCT_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token dynamically from localStorage
productClient.interceptors.request.use(
  (config) => {
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
};

export default productApi;
