// src/services/transactionService.js
import { transactionAPI } from './api';

/**
 * Fetches all transactions for the logged-in user.
 * The user ID is retrieved from the auth token by the API interceptor.
 */
export const getTransactions = async () => {
  try {
    console.log('Fetching transactions...');
    const response = await transactionAPI.getAll();
    console.log('Transactions fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getTransactions:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

/**
 * Adds a new transaction.
 * @param {object} transactionData - The data for the new transaction.
 */
export const addTransaction = async (transactionData) => {
  try {
    console.log('Adding transaction with data:', transactionData);
    const response = await transactionAPI.add(transactionData);
    console.log('Transaction added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in addTransaction:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      requestData: transactionData
    });
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
