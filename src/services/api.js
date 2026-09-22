import axios from 'axios';
import { sanitizeToken, decodeJwt, extractRole } from '../utils/jwt';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT
apiClient.interceptors.request.use(
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

export const setToken = (rawToken, explicitRole = null) => {
  const token = sanitizeToken(rawToken);
  if (!token) return;

  localStorage.setItem('jwt_token', token);
  localStorage.setItem('gearly_token', token);

  // Decode token to extract verified role
  const claims = decodeJwt(token);
  const normalizedRole = extractRole(claims, explicitRole);
  localStorage.setItem('gearly_role', normalizedRole);
};

export const getToken = () => {
  const raw = localStorage.getItem('jwt_token') || localStorage.getItem('gearly_token');
  return sanitizeToken(raw);
};

export const getStoredRole = () => {
  return localStorage.getItem('gearly_role') || null;
};

export const clearToken = () => {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('gearly_token');
  localStorage.removeItem('gearly_role');
};

export const getCurrentUser = () => {
  const token = getToken();
  if (!token) return null;

  const claims = decodeJwt(token);
  const role = extractRole(claims, getStoredRole());
  const isShopkeeper = role === 'shopkeeper';

  return {
    token,
    claims,
    id: claims?.sub || null,
    role,
    isShopkeeper,
    displayName: isShopkeeper ? `Shopkeeper #${claims?.sub || 'Store'}` : `Customer #${claims?.sub || 'Buyer'}`,
  };
};

// API Methods for Auth Microservice (:8000)
export const authApi = {
  signupUser: async (payload) => {
    return await apiClient.post('/signup_user', payload);
  },
  signupShopkeeper: async (payload) => {
    return await apiClient.post('/signup_shopkeeper', payload);
  },
  loginUser: async (payload) => {
    return await apiClient.post('/login_user', payload);
  },
  loginShopkeeper: async (payload) => {
    return await apiClient.post('/login_shopkeeper', payload);
  },
  getDashboard: async (customConfig = {}) => {
    return await apiClient.get('/dashboard', customConfig);
  },
  checkHealth: async () => {
    return await apiClient.get('/health');
  },
};

export default apiClient;
