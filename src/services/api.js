import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000';

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

export const setToken = (token) => {
  localStorage.setItem('jwt_token', token);
  localStorage.setItem('gearly_token', token);
};

export const getToken = () => {
  return localStorage.getItem('jwt_token') || localStorage.getItem('gearly_token');
};

export const clearToken = () => {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('gearly_token');
};

// API Methods
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
    // customConfig allows us to override headers for testing (e.g. removing the token)
    return await apiClient.get('/dashboard', customConfig);
  }
};

export default apiClient;
