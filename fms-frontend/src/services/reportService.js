import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_URL = 'http://localhost:5001/api/v1/reports';

// Create axios instance with auth token
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error:', error.response.data);
      return Promise.reject({
        status: error.response.status,
        message: error.response.data?.error || 'An error occurred',
        data: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.request);
      return Promise.reject({
        status: 0,
        message: 'Network Error: Please check your internet connection.'
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
      return Promise.reject({
        status: 0,
        message: error.message || 'An error occurred'
      });
    }
  }
);

/**
 * Get transactions report with filters
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.startDate] - Start date in YYYY-MM-DD format
 * @param {string} [filters.endDate] - End date in YYYY-MM-DD format
 * @param {string} [filters.category] - Category to filter by
 * @param {number} [filters.minAmount] - Minimum amount
 * @param {number} [filters.maxAmount] - Maximum amount
 * @param {string} [filters.type] - Transaction type (income/expense)
 * @returns {Promise<Object>} Report data
 */
export const getTransactionsReport = async (filters = {}) => {
  const params = new URLSearchParams();
  
  // Add filters to query params
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  
  const response = await api.get(`/transactions?${params.toString()}`);
  return response.data;
};

/**
 * Get budget vs actual report
 * @param {Object} options - Report options
 * @param {number} [options.month] - Month (1-12)
 * @param {number} [options.year] - Year (e.g., 2025)
 * @returns {Promise<Object>} Budget report data
 */
export const getBudgetReport = async ({ month, year } = {}) => {
  const params = new URLSearchParams();
  
  if (month) params.append('month', month);
  if (year) params.append('year', year);
  
  const response = await api.get(`/budget?${params.toString()}`);
  return response.data;
};

/**
 * Export report to a file
 * @param {string} reportType - Type of report to export
 * @param {string} format - Export format (pdf, csv, xlsx)
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Export result with download URL
 */
export const exportReport = async (reportType, format = 'pdf', filters = {}) => {
  const response = await api.post('/export', {
    reportType,
    format,
    ...filters
  });
  
  return response;
};

/**
 * Download a file from a URL
 * @param {string} url - File URL to download
 * @param {string} filename - Name to save the file as
 */
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default {
  getTransactionsReport,
  getBudgetReport,
  exportReport,
  downloadFile
};
