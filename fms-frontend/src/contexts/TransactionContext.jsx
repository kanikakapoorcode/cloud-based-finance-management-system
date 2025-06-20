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
    
    // Get user ID from user object or localStorage
    const userId = user.id || user._id || JSON.parse(localStorage.getItem('fms_user') || '{}')?.id;
    
    if (!userId) {
      const errorMsg = 'User ID not available';
      console.error(errorMsg, { user });
      setError(errorMsg);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching transactions for user ID:', userId);
      
      const response = await getTransactions(userId);
      console.log('Transactions API response:', response);
      
      if (!response) {
        throw new Error('No response from server');
      }
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.status === 401) {
        throw new Error('Unauthorized: Please log in again');
      }
      
      if (response.status !== 200) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      
      if (response.data) {
        console.log('Setting transactions:', response.data);
        setTransactions(Array.isArray(response.data) ? response.data : []);
      } else {
        console.error('Invalid response format:', response);
        setError('Invalid response format from server');
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
