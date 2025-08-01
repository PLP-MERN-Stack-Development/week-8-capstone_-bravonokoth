import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  console.error('🚨 Error: VITE_API_URL environment variable is not set');
  throw new Error('VITE_API_URL is not defined');
}

console.log('API Base URL:', API_BASE_URL); // Debug

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('Request URL:', config.url); // Debug
    const token = localStorage.getItem('fishDeliveryToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fishDeliveryToken');
      window.location.href = '/login';
    } else if (error.response?.status === 404) {
      console.error('Route not found:', error.response.data.message);
      throw new Error('API route not found');
    } else if (error.response?.status === 409) {
      console.error('Registration error:', error.response.data.message);
      throw new Error(error.response.data.message || 'User with this email already exists');
    } else if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data.message);
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data.message);
      throw new Error(error.response.data.message || 'Server error');
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', { ...credentials, email: credentials.email.toLowerCase() }),
  verifyToken: (token) => api.post('/auth/verify-token', { token }),
  updateProfile: (updateData) => api.put('/users/me', updateData),
};

// Fish API calls
export const fishAPI = {
  getAll: (params = {}) => api.get('/fish', { params }),
  getById: (id) => api.get(`/fish/${id}`),
  create: (fishData) => api.post('/fish', fishData),
  update: (id, fishData) => api.put(`/fish/${id}`, fishData),
  delete: (id) => api.delete(`/fish/${id}`),
  getTypesSummary: () => api.get('/fish/types/summary'),
};

// Orders API calls
export const ordersAPI = {
  create: (orderData) => api.post('/orders', orderData),
  getAll: (params = {}) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  update: (id, orderData) => api.put(`/orders/${id}`, orderData),
  delete: (id) => api.delete(`/orders/${id}`),
};

export default api;