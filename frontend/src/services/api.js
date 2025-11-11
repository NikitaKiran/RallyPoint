import axios from 'axios';
import { logError } from '../utils/errorHandler';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rallypoint_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔵 ${config.method.toUpperCase()} ${config.url}`, config.data || '');
    }
    
    return config;
  },
  (error) => {
    logError(error, 'Request Interceptor');
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🟢 ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // Log error
    logError(error, 'API Response');

    // Handle specific error cases
    if (error.response) {
      const { status } = error.response;

      // Handle authentication errors
      if (status === 401) {
        // Token expired or invalid - clear storage and redirect to login
        const currentPath = window.location.pathname;
        
        // Only redirect if not already on login page
        if (currentPath !== '/login' && currentPath !== '/register') {
          localStorage.removeItem('rallypoint_token');
          localStorage.removeItem('rallypoint_user');
          
          // Store the intended destination
          localStorage.setItem('rallypoint_redirect', currentPath);
          
          window.location.href = '/login';
        }
      }

      // Handle forbidden errors
      if (status === 403) {
        console.warn('Access forbidden:', error.response.data);
      }

      // Handle server errors
      if (status >= 500) {
        console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error: No response from server');
    } else {
      // Something else happened
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
