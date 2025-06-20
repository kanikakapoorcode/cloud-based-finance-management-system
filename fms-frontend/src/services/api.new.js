// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    // Skip auth for public endpoints
    const publicEndpoints = ['/auth/', '/public/'];
    if (publicEndpoints.some(endpoint => config.url.includes(endpoint))) {
      return config;
    }

    // Add auth token if available
    const token = localStorage.getItem('fms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (window.location.pathname !== '/login') {
      window.location.href = '/login';
      return Promise.reject(new Error('No auth token'));
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with token refresh logic
API.interceptors.response.use(
  (response) => response.data || response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is not a 401 or there's no original request, reject
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Prevent infinite loops in case of repeated 401s
    if (originalRequest._retry) {
      // Clear tokens and redirect to login
      localStorage.removeItem('fms_user');
      localStorage.removeItem('fms_token');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }

    // Mark the request as retried
    originalRequest._retry = true;

    try {
      // Try to refresh the token if possible
      const userJson = localStorage.getItem('fms_user');
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user?.refreshToken) {
          // Try to refresh the token
          const response = await API.post('/auth/refresh-token', {
            refreshToken: user.refreshToken
          });

          if (response.data?.token) {
            // Update the stored token
            localStorage.setItem('fms_token', response.data.token);
            
            // Update the authorization header
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
            
            // Retry the original request
            return API(originalRequest);
          }
        }
      }
      
      // If we get here, token refresh failed - redirect to login
      localStorage.removeItem('fms_user');
      localStorage.removeItem('fms_token');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
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
  login: (data) => API.post('/auth/login', data),
  signup: (data) => API.post('/auth/signup', data),
  verifyOtp: (data) => API.post('/auth/verify-otp', data),
  refreshToken: (refreshToken) => API.post('/auth/refresh-token', { refreshToken })
};

// Transaction API methods
export const transactionAPI = {
  add: (data) => API.post('/transactions', data),
  getAll: (userId) => API.get(`/transactions?userId=${userId}`),
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
  getAll: () => API.get('/categories'),
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
