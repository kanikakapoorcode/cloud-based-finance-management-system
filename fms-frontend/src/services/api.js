// src/services/api.js
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('fms_user'));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Response interceptor to handle errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fms_user');
      window.location.href = '/auth/login';
    }
    toast.error(error.response?.data?.error || 'Something went wrong');
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  signup: (data) => API.post('/auth/signup', data),
  verifyOtp: (data) => API.post('/auth/verify-otp', data),
};

export const transactionAPI = {
  add: (data) => API.post('/transactions', data),
  getAll: (userId) => API.get(`/transactions?user_id=${userId}`),
  delete: (id) => API.delete(`/transactions/${id}`),
};

export const budgetAPI = {
  set: (data) => API.post('/budget/set', data),
  get: (userId) => API.get(`/budget/get?user_id=${userId}`),
};

export const reportAPI = {
  generate: (userId, type) => API.get(`/reports/generate?user_id=${userId}&type=${type}`),
};