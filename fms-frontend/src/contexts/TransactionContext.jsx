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
    console.log('=== fetchTransactions called ===');
    console.log('Current user:', user);
    
    if (!user) {
      console.log('User not yet available, will retry when user is available');
      setLoading(false);
      return;
    }
    
    // Get user ID from user object or localStorage
    const userId = user.id || user._id || JSON.parse(localStorage.getItem('fms_user') || '{}')?._id;
    console.log('User ID:', userId);
    
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
      
      const transactions = await getTransactions(userId);
      console.log('Fetched transactions:', transactions);
      
      if (!transactions) {
        console.warn('No transactions data received');
        setTransactions([]);
        return;
      }
      
      // Ensure we have an array of transactions
      const transactionsArray = Array.isArray(transactions) ? transactions : [transactions];
      
      console.log(`Setting ${transactionsArray.length} transactions`);
      setTransactions(transactionsArray);
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
    console.log('=== TransactionContext useEffect triggered ===');
    console.log('Current user in effect:', user);
    
    // Only try to fetch if we have a user
    if (user) {
      setLoading(true);
      fetchTransactions().catch(error => {
        console.error('Error in fetchTransactions:', error);
        setError(error.message || 'Failed to fetch transactions');
        setLoading(false);
      });
    }
  }, [fetchTransactions, user]);

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
