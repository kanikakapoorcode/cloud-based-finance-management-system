/**
 * Get the authentication token from localStorage
 * @returns {string|null} The authentication token or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem('token') || null;
};

/**
 * Set the authentication token in localStorage
 * @param {string} token - The authentication token to store
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

/**
 * Remove the authentication token from localStorage
 */
export const removeAuthToken = () => {
  localStorage.removeItem('token');
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

export default {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  isAuthenticated
};
