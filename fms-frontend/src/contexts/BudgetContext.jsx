import { createContext, useState, useContext, useEffect } from 'react';
import { useSnackbar } from 'notistack';

const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  // Load budget data from localStorage on initial load
  useEffect(() => {
    const loadBudgetData = () => {
      try {
        const savedBudget = localStorage.getItem('budgetData');
        if (savedBudget) {
          setBudgetData(JSON.parse(savedBudget));
        }
      } catch (error) {
        console.error('Error loading budget data:', error);
        enqueueSnackbar('Error loading budget data', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadBudgetData();
  }, [enqueueSnackbar]);

  const updateBudget = (newBudgetData) => {
    try {
      setBudgetData(newBudgetData);
      localStorage.setItem('budgetData', JSON.stringify(newBudgetData));
      enqueueSnackbar('Budget updated successfully!', { variant: 'success' });
      return true;
    } catch (error) {
      console.error('Error updating budget:', error);
      enqueueSnackbar('Failed to update budget', { variant: 'error' });
      return false;
    }
  };

  // Make sure to expose the loading state
  const value = {
    budgetData,
    loading,
    updateBudget
  };

  return (
    <BudgetContext.Provider value={value}>
      {!loading && children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return {
    budgetData: context.budgetData,
    loading: context.loading,
    updateBudget: context.updateBudget
  };
};

export default BudgetContext;
