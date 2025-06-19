// src/services/api.js
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    try {
      const userJson = localStorage.getItem('fms_user');
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user?.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      // Clear invalid user data
      localStorage.removeItem('fms_user');
      localStorage.removeItem('fms_token');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
API.interceptors.response.use(
  (response) => {
    // Handle successful responses
    if (response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // Handle error responses
    const errorMessage = error.response?.data?.error || 'Something went wrong';
    const status = error.response?.status;
    
    if (status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('fms_user');
      localStorage.removeItem('fms_token');
      window.location.href = '/auth/login';
    }
    
    // Log error details for debugging
    console.error('API Error:', {
      message: errorMessage,
      status: status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data,
      response: error.response?.data
    });
    
    // Show error toast
    toast.error(errorMessage);
    
    return Promise.reject({
      message: errorMessage,
      status: status,
      data: error.response?.data
    });
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
};

// Transaction API methods
export const transactionAPI = {
  add: (data) => {
    console.log('Sending transaction data:', data);
    return API.post('/transactions', data);
  },
  getAll: (userId) => API.get(`/transactions?user_id=${userId}`),
  delete: (id) => API.delete(`/transactions/${id}`),
};

// Budget API methods
export const budgetAPI = {
  set: (data) => API.post('/budget/set', data),
  get: (userId) => API.get(`/budget/get?user_id=${userId}`),
};

// Report API methods
export const reportAPI = {
  generate: (userId, type) => API.get(`/reports/generate?user_id=${userId}&type=${type}`),
};

// User API methods
export const userAPI = {
  getProfile: () => API.get('/users/me'),
  updateProfile: (data) => API.put('/users/me', data),
  updatePassword: (currentPassword, newPassword) => 
    API.put('/users/update-password', { currentPassword, newPassword }),
};