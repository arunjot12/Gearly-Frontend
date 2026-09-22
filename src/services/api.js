import axios from 'axios';
import { sanitizeToken, decodeJwt, extractRole } from '../utils/jwt';

/**
 * Intelligent runtime & build-time API Base URL resolver.
 * 1. Prioritizes explicit VITE_API_BASE_URL if set during build.
 * 2. If running in a browser on localhost / 127.0.0.1, routes to local port 8000.
 * 3. On ANY deployed domain (*.onrender.com, Vercel, Netlify, custom domain),
 *    AUTOMATICALLY routes to production backend 'https://gearly-login.onrender.com'.
 *    Never defaults to localhost in a deployed environment!
 */
export const getAuthBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim();
  }

  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'http://localhost:8000';
    }
    return 'https://gearly-login.onrender.com';
  }

  return import.meta.env.PROD ? 'https://gearly-login.onrender.com' : 'http://localhost:8000';
};

const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic BaseURL & JWT Interceptor
apiClient.interceptors.request.use(
  (config) => {
    config.baseURL = getAuthBaseUrl();

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
  if (!token || !token.includes('.')) return;

  localStorage.setItem('jwt_token', token);
  localStorage.setItem('gearly_token', token);

  // Decode token to extract verified role
  const claims = decodeJwt(token);
  const normalizedRole = extractRole(claims, explicitRole);
  localStorage.setItem('gearly_role', normalizedRole);
};

export const getToken = () => {
  const raw = localStorage.getItem('jwt_token') || localStorage.getItem('gearly_token');
  const token = sanitizeToken(raw);
  if (token && token.includes('.')) {
    return token;
  }
  return '';
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

// API Methods for Auth Microservice
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
