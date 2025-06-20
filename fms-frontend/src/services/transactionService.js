// src/services/transactionService.js
import { transactionAPI } from './api';

/**
 * Fetches all transactions for the logged-in user.
 * The user ID is retrieved from the auth token by the API interceptor.
 */
export const getTransactions = async (userId) => {
  console.log('[TransactionService] Fetching transactions for user:', userId);
  
  // Check for token first
  const token = localStorage.getItem('fms_token') || 
                JSON.parse(localStorage.getItem('fms_user') || '{}')?.token;
  
  if (!token) {
    const error = new Error('Authentication required. Please log in again.');
    console.error('[TransactionService] No authentication token found');
    throw error;
  }
  
  if (!userId) {
    const error = new Error('User ID is required to fetch transactions');
    console.error('[TransactionService] No user ID provided');
    throw error;
  }

  try {
    const response = await transactionAPI.getAll(userId);
    console.log('[TransactionService] Transactions fetched successfully');
    return response.data || response; // Handle both response formats
  } catch (error) {
    console.error('[TransactionService] Error fetching transactions:', {
      message: error.message,
      status: error.status || error.response?.status,
      data: error.response?.data,
      stack: error.stack
    });
    
    // Re-throw with more context if needed
    throw new Error(error.message || 'Failed to fetch transactions');
  }
};

/**
 * Adds a new transaction.
 * @param {object} transactionData - The data for the new transaction.
 */
export const addTransaction = async (transactionData) => {
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
 * Deletes a transaction by its ID.
 * @param {string} id - The ID of the transaction to delete.
 */
export const deleteTransaction = async (id) => {
  try {
    console.log(`Deleting transaction with ID: ${id}`);
    const response = await transactionAPI.delete(id);
    console.log('Transaction deleted successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in deleteTransaction:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      transactionId: id
    });
    throw error;
  }
};

export default {
  getTransactions,
  addTransaction,
  deleteTransaction,
};
