import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTransactions, addTransaction as apiAddTransaction, deleteTransaction as apiDeleteTransaction } from '../services/transactionService';
import { useAuth } from '../hooks/useAuth';

const TransactionContext = createContext();

export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching transactions...');
      const response = await getTransactions();
      console.log('Transactions response:', response);
      if (response && response.success) {
        setTransactions(response.data || []);
      } else {
        const errorMessage = response?.error || 'Failed to fetch transactions';
        console.error('Error fetching transactions:', errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred while fetching transactions.';
      console.error('Error in fetchTransactions:', {
        error: err,
        message: errorMessage,
        response: err.response?.data
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (transactionData) => {
    try {
      const response = await apiAddTransaction(transactionData);
      if (response.success) {
        // Re-fetch transactions to get the updated list
        await fetchTransactions();
        return response;
      }
      throw new Error(response.error || 'Failed to add transaction');
    } catch (err) {
      throw err;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const response = await apiDeleteTransaction(id);
      if (response.success) {
        setTransactions(transactions.filter(t => t._id !== id));
        return response;
      }
      throw new Error(response.error || 'Failed to delete transaction');
    } catch (err) {
      throw err;
    }
  };

  const value = {
    transactions,
    loading,
    error,
    addTransaction,
    deleteTransaction,
    refreshTransactions: fetchTransactions, // Expose a refresh function
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};
