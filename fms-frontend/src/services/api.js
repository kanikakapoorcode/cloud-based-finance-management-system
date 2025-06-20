// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for token injection
API.interceptors.request.use(
  (config) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('fms_token');
      
      // Get user data
      const user = JSON.parse(localStorage.getItem('fms_user') || '{}');
      
      console.log('=== API REQUEST INTERCEPTOR ===');
      console.log('Request URL:', config.url);
      console.log('Method:', config.method);
      console.log('Headers:', config.headers);
      console.log('Data:', config.data);
      console.log('Token from localStorage:', !!token);
      console.log('Token length:', token ? token.length : 0);
      console.log('User data:', user);
      
      // Skip auth for public endpoints
      const publicEndpoints = ['/auth/', '/public/'];
      const isPublic = publicEndpoints.some(endpoint => config.url.includes(endpoint));
      
      if (isPublic) {
        console.log('Skipping auth for public endpoint');
        return config;
      }

      // If we have a token from localStorage, use it
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Added Authorization header with token from localStorage');
        return config;
      }
      
      // If no token found, check if we have user data with token
      if (user && user.token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${user.token}`;
        console.log('Added Authorization header with token from user data');
        return config;
      }
      
      // If no token found, reject the request
      console.warn('No valid authentication token found');
      return Promise.reject({
        response: {
          status: 401,
          data: { message: 'Authentication required' }
        },
        isAxiosError: true,
        config
      });
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    try {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        // Clear existing auth data
        localStorage.removeItem('fms_token');
        localStorage.removeItem('fms_user');
        
        // Show error message
        enqueueSnackbar('Session expired. Please log in again.', {
          variant: 'error',
          autoHideDuration: 5000
        });
        
        // Redirect to login
        navigate('/auth/login');
        
        return Promise.reject(error);
      }
      
      return Promise.reject(error);
    } catch (error) {
      console.error('Response interceptor error:', error);
      return Promise.reject(error);
    }
  }
);

// Request interceptor
API.interceptors.request.use(
  (config) => {
    console.log('=== API REQUEST ===');
    console.log('URL:', config.url);
    console.log('Method:', config.method);
    
    // Skip auth for public endpoints
    const publicEndpoints = ['/auth/', '/public/'];
    const isPublic = publicEndpoints.some(endpoint => config.url.includes(endpoint));
    
    if (isPublic) {
      console.log('Skipping auth for public endpoint');
      return config;
    }

    // Get token from localStorage or user object
    const token = localStorage.getItem('fms_token') || 
                 JSON.parse(localStorage.getItem('fms_user') || '{}')?.token;
    
    console.log('Auth token found:', !!token);
    console.log('Token length:', token ? token.length : 0);
    
    if (!token) {
      console.warn('No auth token found, rejecting request');
      return Promise.reject({
        response: {
          status: 401,
          data: { message: 'Authentication required' }
        },
        isAxiosError: true,
        config
      });
    }
    
    // Add token to request headers
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Added Authorization header to request');
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with token refresh logic
API.interceptors.response.use(
  (response) => response.data || response,
  async (error) => {
    const originalRequest = error.config;
    
    // If there's no response or it's not a 401, or no original request, reject
    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Prevent infinite loops in case of repeated 401s
    if (originalRequest._retry) {
      console.log('Already retried the request, logging out...');
      // Clear tokens
      localStorage.removeItem('fms_user');
      localStorage.removeItem('fms_token');
      
      // Don't redirect here, let the component handle it
      return Promise.reject({
        ...error,
        isAuthError: true,
        message: 'Session expired. Please log in again.'
      });
    }

    // Mark the request as retried
    originalRequest._retry = true;

    try {
      console.log('Attempting to refresh token...');
      // Try to refresh the token if possible
      const userJson = localStorage.getItem('fms_user');
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user?.refreshToken) {
          // Try to refresh the token
          const response = await API.post('/auth/refresh-token', {
            refreshToken: user.refreshToken
          });

          if (response?.token) {
            console.log('Token refreshed successfully');
            // Update the stored token
            localStorage.setItem('fms_token', response.token);
            
            // Update the authorization header
            originalRequest.headers.Authorization = `Bearer ${response.token}`;
            
            // Retry the original request
            return API(originalRequest);
          }
        }
      }
      
      // If we get here, token refresh failed
      console.log('Token refresh failed, logging out...');
      localStorage.removeItem('fms_user');
      localStorage.removeItem('fms_token');
      
      return Promise.reject({
        ...error,
        isAuthError: true,
        message: 'Session expired. Please log in again.'
      });
    } catch (refreshError) {
      console.error('Error refreshing token:', refreshError);
      localStorage.removeItem('fms_user');
      localStorage.removeItem('fms_token');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      
      return Promise.reject(refreshError);
    }
  }
);

// Auth API methods
export const authAPI = {
  login: async (data) => {
    try {
      console.log('Sending login request with data:', data);
      const response = await API.post('/auth/login', data);
      console.log('Raw login response:', response);
      return response;
    } catch (error) {
      console.error('Login API error:', error.response || error);
      throw error;
    }
  },
  signup: (data) => API.post('/auth/signup', data),
  verifyOtp: (data) => API.post('/auth/verify-otp', data),
  refreshToken: (refreshToken) => API.post('/auth/refresh-token', { refreshToken })
};

// Transaction API methods
export const transactionAPI = {
  add: (data) => {
    console.log('Sending transaction data:', data);
    return API.post('/transactions', data);
  },
  getAll: (userId) => {
    const params = userId ? { userId } : {};
    return API.get('/transactions', { params });
  },
  getById: (id) => API.get(`/transactions/${id}`),
  update: (id, data) => API.patch(`/transactions/${id}`, data),
  delete: (id) => API.delete(`/transactions/${id}`),
  getByDateRange: (startDate, endDate) => 
    API.get(`/transactions/range?start=${startDate}&end=${endDate}`)
};

// Budget API methods
export const budgetAPI = {
  set: (data) => API.post('/budget', data),
  get: (userId) => API.get(`/budget?userId=${userId}`),
  update: (id, data) => API.patch(`/budget/${id}`, data),
  delete: (id) => API.delete(`/budget/${id}`)
};

// Report API methods
export const reportAPI = {
  generate: (userId, type) => API.get(`/reports/generate?userId=${userId}&type=${type}`),
  getSpendingByCategory: (startDate, endDate) => 
    API.get(`/reports/spending-by-category?start=${startDate}&end=${endDate}`),
  getIncomeVsExpense: (startDate, endDate) =>
    API.get(`/reports/income-vs-expense?start=${startDate}&end=${endDate}`)
};

// Categories API methods
export const categoryAPI = {
  getAll: async () => {
    try {
      const response = await API.get('/categories');
      return response;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
  getById: (id) => API.get(`/categories/${id}`),
  create: (data) => API.post('/categories', data),
  update: (id, data) => API.patch(`/categories/${id}`, data),
  delete: (id) => API.delete(`/categories/${id}`),
  getByType: (type) => API.get(`/categories/type/${type}`)
};

// User API methods
export const userAPI = {
  getProfile: () => API.get('/users/me'),
  updateProfile: (data) => API.patch('/users/me', data),
  updatePassword: (currentPassword, newPassword) => 
    API.patch('/users/update-password', { currentPassword, newPassword }),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return API.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export default API;