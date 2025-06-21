// src/services/api.js
import axios from 'axios';

// Determine the base URL based on the environment
const getBaseUrl = () => {
  // In development, use the full URL including /api/v1
  if (import.meta.env.DEV) {
    return 'http://localhost:5001/api/v1';
  }
  // In production, use the environment variable or default to relative path with /api/v1
  return (import.meta.env.VITE_API_URL || '') + '/api/v1';
};

const API = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Log API configuration on startup
console.log('API Base URL:', API.defaults.baseURL);
console.log('Environment:', import.meta.env.MODE);

// Request interceptor for token injection
API.interceptors.request.use(
  (config) => {
    // Skip auth for public endpoints
    const publicEndpoints = ['/auth/', '/public/'];
    const isPublic = publicEndpoints.some(endpoint => config.url.includes(endpoint));
    
    if (isPublic) {
      console.log('Skipping auth for public endpoint:', config.url);
      return config;
    }

    try {
      // Get token from localStorage
      let token = localStorage.getItem('fms_token');
      
      // If no token in fms_token, try to get it from fms_user
      if (!token) {
        try {
          const userStr = localStorage.getItem('fms_user');
          if (userStr) {
            const user = JSON.parse(userStr);
            token = user?.token;
          }
        } catch (e) {
          console.error('Error parsing user data from localStorage:', e);
        }
      }
      
      console.log('=== API REQUEST ===');
      console.log('URL:', config.url);
      console.log('Method:', config.method);
      console.log('Has token:', !!token);
      console.log('Token length:', token ? token.length : 0);
      
      // If we have a token, add it to the request
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Added Authorization header');
      } else {
        console.warn('No auth token available for protected endpoint');
      }
      
      return config;
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
        
        // Show error message using toast
        console.error('Session expired. Please log in again.');
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        
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
      console.log('🔐 Sending login request to:', API.defaults.baseURL + '/auth/login');
      console.log('📤 Request data:', { 
        email: data.email, 
        hasPassword: !!data.password
      });
      
      const response = await API.post('/auth/login', data, {
        // Ensure we get the full response for auth endpoints
        transformResponse: (res) => res
      });
      
      console.log('✅ Login response received:', {
        url: response.config?.url,
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'no data'
      });
      
      // Log the response data structure for debugging
      console.log('🔍 Response data structure:', {
        url: response.config?.url,
        status: response.status,
        hasData: !!response.data,
        isString: typeof response.data === 'string',
        dataType: response.data ? typeof response.data : 'null',
        dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'not an object'
      });
      
      // Parse JSON if the response is a string
      try {
        if (typeof response.data === 'string') {
          response.data = JSON.parse(response.data);
        }
        
        // Log the parsed response data for debugging
        console.log('🔍 Response data structure:', {
          hasData: !!response.data,
          isString: typeof response.data === 'string',
          dataType: response.data ? typeof response.data : 'null',
          dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'not an object'
        });
      } catch (e) {
        console.error('❌ Error parsing response data:', e);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Login request failed:', {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data
      });
      throw error;
    }
  },
  signup: (data) => API.post('/auth/signup', data),
  verifyOtp: (data) => API.post('/auth/verify-otp', data),
  refreshToken: (refreshToken) => {
    console.log('🔄 Refreshing token...');
    return API.post('/auth/refresh-token', { refreshToken });
  },
  verifyToken: async (token) => {
    console.log('🔒 Verifying token...');
    try {
      const response = await API.get('/auth/verify-token', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Token verification successful');
      return response;
    } catch (error) {
      console.error('❌ Token verification failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }
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