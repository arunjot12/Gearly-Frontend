import axios from 'axios';
import { getToken } from './api';

const PRODUCT_BASE_URL = import.meta.env.VITE_PRODUCT_API_URL || 'http://localhost:3000';

const productClient = axios.create({
  baseURL: PRODUCT_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: dynamically attach JWT token from login
productClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const productApi = {
  // GET /get_products
  getProducts: async () => {
    return await productClient.get('/get_products');
  },

  // GET /get_product/:id
  getProduct: async (id) => {
    return await productClient.get(`/get_product/${id}`);
  },

  // POST /create_product
  createProduct: async (productData) => {
    return await productClient.post('/create_product', productData);
  },

  // PUT /update_product/:id
  updateProduct: async (id, productData) => {
    return await productClient.put(`/update_product/${id}`, productData);
  },

  // POST /delete_product/:id
  deleteProduct: async (id) => {
    return await productClient.post(`/delete_product/${id}`);
  },
};

export default productApi;
