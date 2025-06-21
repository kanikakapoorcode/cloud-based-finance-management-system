import API from './api';

const authService = {
  /**
   * Login user with email and password
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User's email
   * @param {string} credentials.password - User's password
   * @returns {Promise<Object>} Response data containing user and token
   */
  login: async ({ email, password }) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User's full name
   * @param {string} userData.email - User's email
   * @param {string} userData.password - User's password
   * @returns {Promise<Object>} Response data
   */
  signup: async (userData) => {
    try {
      const response = await API.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  /**
   * Logout the current user
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      // Clear local storage
      localStorage.removeItem('fms_user');
      localStorage.removeItem('fms_token');
      
      // Call logout API if needed
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, we still want to clear local storage
      localStorage.removeItem('fms_user');
      localStorage.removeItem('fms_token');
      throw error;
    }
  },

  /**
   * Get the current authenticated user
   * @returns {Promise<Object>} User data
   */
  getCurrentUser: async () => {
    try {
      const response = await API.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  /**
   * Refresh the access token
   * @param {string} refreshToken - The refresh token
   * @returns {Promise<Object>} New access token
   */
  refreshToken: async (refreshToken) => {
    try {
      const response = await API.post('/auth/refresh-token', { refreshToken });
      return response.data;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  },

  /**
   * Send password reset email
   * @param {string} email - User's email
   * @returns {Promise<Object>} Response data
   */
  forgotPassword: async (email) => {
    try {
      const response = await API.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  /**
   * Reset password with token
   * @param {string} token - Password reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} Response data
   */
  resetPassword: async (token, password) => {
    try {
      const response = await API.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }
};

export default authService;