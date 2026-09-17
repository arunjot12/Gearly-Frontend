import axios from 'axios';
import { getToken } from './api';

const PRODUCT_BASE_URL = import.meta.env.VITE_PRODUCT_API_URL || 'http://localhost:3000';

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
  getProducts: async () => {
    return await productClient.get('/get_products');
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
