// src/services/transactionService.js
import { transactionAPI } from './api';

/**
 * Fetches all transactions for the logged-in user.
 * The user ID is retrieved from localStorage by the API interceptor.
 */
export const getTransactions = async () => {
  try {
    const response = await transactionAPI.getAll();
    return response.data; // The interceptor ensures this is the success data
  } catch (error) {
    // The interceptor in api.js already handles toast notifications for errors.
    // We just need to re-throw the error so the calling component knows about it.
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

/**
 * Adds a new transaction.
 * @param {object} transactionData - The data for the new transaction.
 */
export const addTransaction = async (transactionData) => {
  try {
    const response = await transactionAPI.add(transactionData);
    return response.data;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

/**
 * Deletes a transaction by its ID.
 * @param {string} id - The ID of the transaction to delete.
 */
export const deleteTransaction = async (id) => {
  try {
    const response = await transactionAPI.delete(id);
    return response.data;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export default {
  getTransactions,
  addTransaction,
  deleteTransaction
};
