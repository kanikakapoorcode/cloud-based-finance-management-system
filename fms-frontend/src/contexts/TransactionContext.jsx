import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  getTransactions as getTransactionsApi, 
  createTransaction as createTransactionApi, 
  updateTransaction as updateTransactionApi,
  deleteTransaction as deleteTransactionApi 
} from '../services/transactionService';
import { useSnackbar } from 'notistack';

const TransactionContext = createContext();

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, logout } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const showError = useCallback((message) => {
    enqueueSnackbar(message, { variant: 'error' });
  }, [enqueueSnackbar]);

  const showSuccess = useCallback((message) => {
    enqueueSnackbar(message, { variant: 'success' });
  }, [enqueueSnackbar]);

  const fetchTransactions = useCallback(async () => {
    console.group('🔍 fetchTransactions');
    try {
      console.log('🔄 Fetching transactions');
      setLoading(true);
      setError(null);
      
      try {
        // Get transactions from API
        const transactionsData = await getTransactions();
        console.log('📥 Transactions data:', transactionsData);
        
        console.log(`✅ Found ${transactionsData.length} transactions`);
        
        // Sort transactions by date (newest first)
        const sortedTransactions = [...transactionsData].sort((a, b) => {
          const dateA = a.date ? new Date(a.date) : new Date(0);
          const dateB = b.date ? new Date(b.date) : new Date(0);
          return dateB - dateA;
        });
        
        console.log('📅 Sorted transactions:', sortedTransactions);
        setTransactions(sortedTransactions);
        setError(null);
      } catch (err) {
        console.error('❌ Error fetching transactions:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError(err.message || 'Failed to load transactions');
        setTransactions([]);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred while fetching transactions.';
      console.error('❌ Error in fetchTransactions:', {
        error: err,
        message: errorMessage,
        response: err.response?.data,
        stack: err.stack
      });
      setError(errorMessage);
      setTransactions([]); // Clear transactions on error
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    console.log('=== TransactionContext useEffect ===');
    console.log('Current user in effect:', currentUser);
    
    // Only try to fetch if we have a user
    if (currentUser) {
      setLoading(true);
      fetchTransactions().catch(error => {
        console.error('Error in fetchTransactions:', error);
        setError(error.message || 'Failed to fetch transactions');
        setLoading(false);
      });
    }
  }, [fetchTransactions, currentUser]);

  const addTransaction = async (transactionData) => {
    try {
      const response = await createTransactionApi(transactionData);
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
      const response = await deleteTransactionApi(id);
      if (response.success) {
        setTransactions(transactions.filter(t => t._id !== id));
        return response;
      }
      throw new Error(response.error || 'Failed to delete transaction');
    } catch (err) {
      throw err;
    }
  };

  const value = React.useMemo(() => ({
    transactions: Array.isArray(transactions) ? transactions : [],
    loading,
    error,
    addTransaction,
    deleteTransaction,
    refreshTransactions: fetchTransactions,
  }), [transactions, loading, error, addTransaction, deleteTransaction, fetchTransactions]);

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};
