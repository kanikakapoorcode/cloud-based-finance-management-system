// src/services/transactionService.js
import { transactionAPI } from './api';

/**
 * Fetches all transactions for the logged-in user.
 * @param {string} userId - The ID of the user to fetch transactions for
 * @returns {Promise<Array>} - Array of transaction objects
 */
export const getTransactions = async () => {
  console.log('🔍 [TransactionService] Fetching transactions');
  
  try {
    console.log('📡 [TransactionService] Sending request to fetch transactions');
    const response = await transactionAPI.getAll();
    console.log('📥 [TransactionService] Raw API Response:', response);
    
    // If no response, return empty array
    if (!response) {
      console.warn('⚠️ [TransactionService] Empty response received');
      return [];
    }

    // Handle different possible response structures
    let transactions = [];
    
    // Case 1: Response has data property (common API pattern)
    if (response.data !== undefined) {
      transactions = Array.isArray(response.data) ? response.data : [response.data];
    } 
    // Case 2: Response has transactions array
    else if (response.transactions) {
      transactions = Array.isArray(response.transactions) ? response.transactions : [response.transactions];
    }
    // Case 3: Response is already an array
    else if (Array.isArray(response)) {
      transactions = response;
    }
    // Case 4: Response is a single transaction object
    else if (typeof response === 'object' && response !== null) {
      transactions = [response];
    }
    
    console.log(`✅ [TransactionService] Successfully processed ${transactions.length} transactions`);
    return transactions || [];
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.status || error.response?.status,
      data: error.response?.data,
      stack: error.stack
    };
    
    console.error('❌ [TransactionService] Error fetching transactions:', errorDetails);
    
    // Re-throw with more context
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Failed to fetch transactions. Please try again later.';
    
    const enhancedError = new Error(errorMessage);
    enhancedError.details = errorDetails;
    throw enhancedError;
  }
};

/**
 * Adds a new transaction.
 * @param {object} transactionData - The data for the new transaction.
 * @returns {Promise<Object>} The created transaction
 */
export const createTransaction = async (transactionData) => {
  console.log('[TransactionService] Adding transaction:', transactionData);
  
  // Check for token first
  const token = localStorage.getItem('fms_token') || 
                JSON.parse(localStorage.getItem('fms_user') || '{}')?.token;
  
  if (!token) {
    console.error('[TransactionService] No authentication token found');
    throw { 
      message: 'Authentication required. Please log in again.',
      status: 401,
      redirect: true
    };
  }

  try {
    const response = await transactionAPI.add(transactionData);
    console.log('[TransactionService] Transaction added successfully');
    return response.data || response; // Handle both response formats
  } catch (error) {
    console.error('[TransactionService] Error adding transaction:', {
      message: error.message,
      status: error.status || error.response?.status,
      data: error.response?.data,
      requestData: transactionData,
      stack: error.stack
    });
    
    // If it's an authentication error, add redirect flag
    if (error.status === 401 || error.response?.status === 401) {
      error.redirect = true;
    }
    
    throw error;
  }
};

/**
 * Updates an existing transaction
 * @param {string} id - Transaction ID to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated transaction object
 */
export const updateTransaction = async (id, updates) => {
  try {
    // If amount is being updated, ensure it's a number
    if (updates.amount) {
      updates.amount = parseFloat(updates.amount);
    }
    
    const response = await api.put(`/api/transactions/${id}`, updates);
    return response.data?.data || null;
  } catch (error) {
    console.error(`Error updating transaction ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Deletes a transaction
 * @param {string} id - Transaction ID to delete
 * @returns {Promise<boolean>} True if successful
 */
export const deleteTransaction = async (id) => {
  try {
    await api.delete(`/api/transactions/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting transaction ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Gets transactions summary (totals by category, type, etc.)
 * @returns {Promise<Object>} Summary object
 */
export const getTransactionsSummary = async () => {
  try {
    const response = await api.get('/api/transactions/summary');
    return response.data?.data || {};
  } catch (error) {
    console.error('Error fetching transactions summary:', error.response?.data || error.message);
    throw error;
  }
};

// For backward compatibility
export const addTransaction = createTransaction;

export default {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsSummary,
  // Alias for backward compatibility
  addTransaction,
};
