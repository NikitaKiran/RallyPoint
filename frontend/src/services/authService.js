import api from './api';

const TOKEN_KEY = 'rallypoint_token';

/**
 * Register a new user
 * @param {Object} userData - { name, email, password, role }
 * @returns {Promise<Object>} Response with token and user data
 */
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  
  if (response.data.success && response.data.data.token) {
    localStorage.setItem(TOKEN_KEY, response.data.data.token);
  }
  
  return response.data;
};

/**
 * Login user
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} Response with token and user data
 */
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  
  if (response.data.success && response.data.data.token) {
    localStorage.setItem(TOKEN_KEY, response.data.data.token);
  }
  
  return response.data;
};

/**
 * Logout user
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Get current user profile
 * @returns {Promise<Object>} User data
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * Get stored token
 * @returns {String|null} JWT token
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Check if user is authenticated
 * @returns {Boolean}
 */
export const isAuthenticated = () => {
  return !!getToken();
};
