// src/components/Transactions/AddTransaction.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { 
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  InputAdornment,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Select,
  Switch,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatCurrency';
import { useTransactions } from '../../contexts/TransactionContext';
import { categoryAPI } from '../../services/api';

const AddTransaction = () => {
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();
  const { 
    isAuthenticated, 
    user, 
    authLoading, 
    authError,
    logout,
    updateUser: refreshUser
  } = useContext(AuthContext);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIncome, setIsIncome] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: ''
  });

  const { enqueueSnackbar } = useSnackbar();
  
  // Debug auth state
  console.log('=== AUTH STATE IN ADD TRANSACTION ===');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('User:', user);
  console.log('Auth Loading:', authLoading);
  console.log('Auth Error:', authError);
  
  // Debug token storage and auth state
  useEffect(() => {
    console.log('=== AUTH DEBUG ===');
    const token = localStorage.getItem('fms_token');
    const user = JSON.parse(localStorage.getItem('fms_user') || '{}');
    
    console.log('fms_token exists:', !!token);
    console.log('fms_token length:', token?.length || 0);
    console.log('fms_user exists:', !!user);
    console.log('User ID:', user?._id);
    console.log('Is authenticated:', isAuthenticated);
    console.log('Auth loading:', authLoading);
    console.log('==================');
    
    if (isAuthenticated && !token) {
      console.warn('User is authenticated but no token found in localStorage!');
    }
  }, [isAuthenticated, authLoading]);

  // Debug token storage
  useEffect(() => {
    console.log('=== TOKEN DEBUG ===');
    console.log('All localStorage keys:', Object.keys(localStorage));
    console.log('fms_token exists:', !!localStorage.getItem('fms_token'));
    console.log('Auth header:', localStorage.getItem('fms_token') ? `Bearer ${localStorage.getItem('fms_token')}` : 'No token');
    console.log('==================');
  }, []);

  // Function to validate and refresh token if needed
  const validateAndRefreshToken = async () => {
    try {
      const token = localStorage.getItem('fms_token');
      const user = JSON.parse(localStorage.getItem('fms_user') || '{}');
      
      console.log('Current token:', token ? 'Present' : 'Missing');
      console.log('User in storage:', user);
      
      if (!token && !user?.token) {
        throw new Error('No authentication token found');
      }
      
      // If we have a token, verify it's still valid
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        
        if (isExpired) {
          console.log('Token expired, attempting refresh...');
          // Try to refresh the token
          const refreshToken = user?.refreshToken;
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }
          
          const response = await authAPI.refreshToken({ refreshToken });
          if (response?.data?.token) {
            console.log('Token refreshed successfully');
            localStorage.setItem('fms_token', response.data.token);
            localStorage.setItem('fms_user', JSON.stringify({
              ...user,
              token: response.data.token
            }));
            return response.data.token;
          }
          throw new Error('Failed to refresh token');
        }
        return token;
      }
      
      // If no token but user object has one, use that
      if (user?.token) {
        localStorage.setItem('fms_token', user.token);
        return user.token;
      }
      
      throw new Error('No valid authentication found');
    } catch (error) {
      console.error('Token validation failed:', error);
      // Clear invalid auth data
      localStorage.removeItem('fms_token');
      localStorage.removeItem('fms_user');
      throw error;
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      enqueueSnackbar('Please log in to continue', { variant: 'error' });
      navigate('/auth/login', { 
        state: { from: window.location.pathname },
        replace: true 
      });
    }
  }, [isAuthenticated, authLoading, navigate, enqueueSnackbar]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Check if we have valid auth state
        if (!isAuthenticated || authLoading) {
          console.log('Not authenticated or still loading, skipping category fetch');
          return;
        }

        // Get categories from API
        setLoading(true);
        setCategoriesError(false);

        try {
          const response = await categoryAPI.getAll();
          console.log('Categories API response:', response);

          if (response && response.data) {
            console.log('Categories received:', response.data);
            setCategories(response.data);
          } else {
            console.log('No categories received from API, using fallback categories');
            const fallbackCategories = [
              { _id: '1', name: 'Food & Dining', type: 'expense' },
              { _id: '2', name: 'Shopping', type: 'expense' },
              { _id: '3', name: 'Transportation', type: 'expense' },
              { _id: '4', name: 'Bills & Utilities', type: 'expense' },
              { _id: '5', name: 'Salary', type: 'income' },
              { _id: '6', name: 'Freelance', type: 'income' },
            ];
            setCategories(fallbackCategories);
          }
        } catch (error) {
          console.error('Error fetching categories:', error);
          
          // Set fallback categories on any error
          const fallbackCategories = [
            { _id: '1', name: 'Food & Dining', type: 'expense' },
            { _id: '2', name: 'Shopping', type: 'expense' },
            { _id: '3', name: 'Transportation', type: 'expense' },
            { _id: '4', name: 'Bills & Utilities', type: 'expense' },
            { _id: '5', name: 'Salary', type: 'income' },
            { _id: '6', name: 'Freelance', type: 'income' },
          ];
          setCategories(fallbackCategories);

          enqueueSnackbar('Failed to load categories. Using fallback categories.', {
            variant: 'error',
            autoHideDuration: 5000
          });
        } finally {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in category fetch:', error);
        setCategoriesError(true);
        enqueueSnackbar('An error occurred. Please try again.', {
          variant: 'error',
          autoHideDuration: 5000
        });
      }
    };

    fetchCategories();
  }, [isAuthenticated, authLoading, navigate, enqueueSnackbar]);

  // Initialize form data with first category
  useEffect(() => {
    if (initialLoad && categories.length > 0 && !formData.category) {
      const defaultCategory = categories.find(cat => cat.type === 'expense') || categories[0];
      setFormData(prev => ({
        ...prev,
        category: defaultCategory._id
      }));
      setInitialLoad(false);
    }
  }, [initialLoad, categories, formData.category]);
  
  // Show loading state while checking auth
  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Box ml={2}>Loading...</Box>
      </Box>
    );
  }
  
  // Generate unique IDs for form fields
  const inputIds = {
    description: 'transaction-description',
    amount: 'transaction-amount',
    date: 'transaction-date',
    category: 'transaction-category',
    type: 'transaction-type'
  };
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Log categories when they change
  useEffect(() => {
    console.log('All categories updated:', categories);
    console.log('Current form data:', formData);
    console.log('API URL:', `${import.meta.env.VITE_API_URL}/categories`);
  }, [categories, formData]);

  // Process and normalize categories when they are loaded
  const processedCategories = React.useMemo(() => {
    console.log('=== PROCESSING CATEGORIES ===');
    console.log('Raw categories received:', categories);
    
    if (!Array.isArray(categories)) {
      console.error('Categories is not an array:', categories);
      return [];
    }
    
    const processed = categories
      .filter(cat => {
        const isValid = cat && typeof cat === 'object';
        if (!isValid) {
          console.warn('Invalid category object:', cat);
        }
        return isValid;
      })
      .map(cat => ({
        _id: String(cat._id || cat.id || '').trim(),
        name: String(cat.name || 'Uncategorized').trim(),
        type: String(cat.type || 'expense').toLowerCase().trim(),
        isDefault: Boolean(cat.isDefault)
      }))
      .filter(cat => {
        const hasId = !!cat._id;
        if (!hasId) {
          console.warn('Category missing _id:', cat);
        }
        return hasId;
      });
      
    console.log('Processed categories:', processed);
    return processed;
  }, [categories]);

  // Filter categories based on transaction type
  const filteredCategories = React.useMemo(() => {
    console.log('=== FILTERING CATEGORIES ===');
    console.log('Transaction type:', isIncome ? 'Income' : 'Expense');
    
    try {
      if (!Array.isArray(categories)) {
        console.error('Categories is not an array');
        return [];
      }

      console.log('Categories count:', categories.length);
      
      const filtered = categories.filter(cat => {
        if (!cat) return false;
        
        const catType = String(cat.type || '').toLowerCase().trim();
        
        if (isIncome) {
          return catType === 'income' || catType === 'both';
        } else {
          return catType === 'expense' || catType === 'both';
        }
      });
      
      console.log(`Filtered ${filtered.length} categories for ${isIncome ? 'income' : 'expense'}`);
      console.log('Filtered categories:', filtered);
      
      return filtered;
      
    } catch (error) {
      console.error('Error filtering categories:', error);
      console.error('Error details:', {
        errorMessage: error.message,
        errorStack: error.stack,
        categoriesType: typeof categories,
        categoriesLength: categories ? categories.length : 0,
        isIncome: isIncome
      });
      return [];
    }
  }, [categories, isIncome]);
  
  // Debug log for categories and form data
  useEffect(() => {
    console.log('=== CATEGORY DEBUG ===');
    console.log('All categories (count):', categories?.length || 0);
    console.log('Form data:', formData);
    console.log('Is Income:', isIncome);
    console.log('Filtered categories (count):', filteredCategories?.length || 0);
    console.log('Loading state:', loading);
    
    // Log the first few categories if they exist
    if (categories?.length > 0) {
      console.log('First 3 categories:', categories.slice(0, 3));
    }
    
    if (filteredCategories?.length > 0) {
      console.log('First 3 filtered categories:', filteredCategories.slice(0, 3));
    }
    
    console.log('======================');
  }, [categories, formData, isIncome, filteredCategories, loading]);
  
  // Set default category when filtered categories change
  useEffect(() => {
    if (filteredCategories.length > 0) {
      const currentCategoryValid = filteredCategories.some(
        cat => cat._id === formData.category
      );
      
      if (!currentCategoryValid && formData.category) {
        // Current category is no longer valid, clear it
        setFormData(prev => ({ ...prev, category: '' }));
      } else if (!currentCategoryValid) {
        // Set default category if none is selected
        const defaultCategory = filteredCategories[0]?._id || '';
        if (defaultCategory) {
          setFormData(prev => ({
            ...prev,
            category: defaultCategory
          }));
        }
      }
    } else if (formData.category) {
      // No categories available, clear selection
      setFormData(prev => ({ ...prev, category: '' }));
    }
  }, [filteredCategories, formData.category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleIncomeToggle = () => {
    const newIsIncome = !isIncome;
    setIsIncome(newIsIncome);
    // Reset category when switching between income and expense
    // The useEffect will set a default category from filteredCategories
    setFormData(prev => ({
      ...prev,
      category: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (isSubmitting) return;
    
    // Enhanced validation
    if (!formData.description?.trim()) {
      setError('Please enter a description.');
      return;
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid, positive amount.');
      return;
    }
    
    if (!formData.category) {
      setError('Please select a category.');
      return;
    }
    
    // Find the selected category to ensure it exists
    const selectedCategory = categories.find(cat => cat._id === formData.category);
    if (!selectedCategory) {
      setError('Please select a valid category.');
      return;
    }
    
    // Validate category type matches transaction type
    if ((isIncome && selectedCategory.type === 'expense') || 
        (!isIncome && selectedCategory.type === 'income')) {
      setError(`Selected category is for ${selectedCategory.type}s, but you're adding ${isIncome ? 'income' : 'an expense'}.`);
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmDialog(true);
  };
  
  const handleConfirmSubmit = async () => {
    if (isSubmitting) return;
    
    const token = localStorage.getItem('fms_token') || 
                   JSON.parse(localStorage.getItem('fms_user') || '{}')?.token;
                   
    if (!token) {
      const errorMsg = 'No active session found. Please log in again.';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { 
        variant: 'error',
        autoHideDuration: 3000,
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
      // Clear any existing auth data
      localStorage.removeItem('fms_user');
      localStorage.removeItem('fms_token');
      // Redirect to login after a short delay
      setTimeout(() => navigate('/auth/login'), 1500);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');
      setShowConfirmDialog(false);
      
      // Validate category
      const selectedCategory = categories.find(cat => cat._id === formData.category);
      if (!selectedCategory) {
        throw new Error('Selected category not found. Please try again.');
      }
      
      // Prepare transaction data
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }
      
      const transactionData = {
        description: formData.description.trim(),
        amount: amount.toFixed(2),
        date: formData.date,
        category: selectedCategory._id,
        type: isIncome ? 'income' : 'expense',
        notes: ''
      };
      
      console.log('Submitting transaction:', transactionData);
      
      // Call the API to add transaction
      const response = await addTransaction(transactionData);
      
      if (response && (response.success || response._id)) {
        const successMessage = `Successfully added ${isIncome ? 'income' : 'expense'} of ₹${amount.toFixed(2)}`;
        setSuccess(successMessage);
        enqueueSnackbar(successMessage, { 
          variant: 'success', 
          autoHideDuration: 3000, 
          anchorOrigin: { vertical: 'top', horizontal: 'center' } 
        });
        
        // Reset form but keep the transaction type
        setFormData(prev => ({
          ...prev,
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          category: filteredCategories[0]?._id || ''
        }));
        
        // Notify parent component if needed
        if (onTransactionAdded) {
          onTransactionAdded(response);
        }
        
        return response;
      } else {
        throw new Error(response?.error || 'Failed to add transaction');
      }
    } catch (err) {
      console.error('Error adding transaction:', {
        error: err,
        message: err.message,
        response: err.response?.data
      });
      
      let errorMessage = 'An error occurred while adding the transaction.';
      
      // Handle different types of errors
      if (err.response) {
        // Server responded with an error status code
        if (err.response.status === 401 || err.isAuthError) {
          // Authentication error
          errorMessage = 'Your session has expired. Please log in again.';
          localStorage.removeItem('fms_user');
          localStorage.removeItem('fms_token');
          setTimeout(() => navigate('/auth/login'), 1000);
        } else {
          errorMessage = err.response.data?.message || err.message || errorMessage;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      } else if (err.isAuthError) {
        // Authentication error
        errorMessage = 'Your session has expired. Please log in again.';
        localStorage.removeItem('fms_user');
        localStorage.removeItem('fms_token');
        setTimeout(() => navigate('/auth/login'), 1000);
      } else {
        // Other errors
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { 
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" component="h1">
            Add {isIncome ? "Income" : "Expense"}
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/dashboard/transactions')}
          >
            Back to Transactions
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    id={inputIds.type}
                    checked={isIncome}
                    onChange={handleIncomeToggle}
                    color="success"
                    inputProps={{
                      'aria-label': `Transaction type: ${isIncome ? 'Income' : 'Expense'}`,
                    }}
                  />
                }
                label={`Add as ${isIncome ? "Income" : "Expense"}`}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id={inputIds.description}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder={isIncome ? "e.g., Salary, Freelance Work" : "e.g., Groceries, Rent"}
                inputProps={{
                  'aria-label': 'Transaction description',
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id={inputIds.amount}
                label="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                required
                InputProps={{
                  'aria-label': 'Transaction amount',
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                placeholder="0.00"
                helperText={formData.amount ? `${formatCurrency(isIncome ? parseFloat(formData.amount) : -parseFloat(formData.amount))}` : ''}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id={inputIds.date}
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  'aria-label': 'Transaction date',
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="category-select-label">Category</InputLabel>
                <Select
                  labelId="category-select-label"
                  id={inputIds.category}
                  name="category"
                  value={formData.category || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log('Selected category:', value);
                    setFormData(prev => ({ ...prev, category: value }));
                  }}
                  disabled={loading || filteredCategories.length === 0}
                  inputProps={{ 
                    'aria-label': 'Transaction category',
                    'data-testid': 'category-select'
                  }}
                >
                  {loading ? (
                    <MenuItem value="" disabled>
                      <CircularProgress size={20} />
                      <span style={{ marginLeft: 8 }}>Loading categories...</span>
                    </MenuItem>
                  ) : filteredCategories.length === 0 ? (
                    <MenuItem value="" disabled>
                      <em>No {isIncome ? 'income' : 'expense'} categories found</em>
                    </MenuItem>
                  ) : (
                    <>
                      <MenuItem value="">
                        <em>Select a category</em>
                      </MenuItem>
                      {filteredCategories.map((category) => (
                        <MenuItem 
                          key={category._id} 
                          value={category._id}
                          data-testid={`category-option-${category._id}`}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{category.name}</span>
                            <Chip 
                              label={category.type} 
                              size="small" 
                              color={category.type === 'income' ? 'success' : 'error'}
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </>
                  )}  
                </Select>
                {loading ? (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="caption" color="text.secondary">
                      Loading categories...
                    </Typography>
                  </Box>
                ) : filteredCategories.length === 0 ? (
                  <Box sx={{ mt: 1 }}>
                    <FormHelperText error>
                      No {isIncome ? 'income' : 'expense'} categories found.
                    </FormHelperText>
                    <Button 
                      variant="text" 
                      size="small" 
                      sx={{ 
                        mt: 1, 
                        ml: 0.5, 
                        textTransform: 'none', 
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                      onClick={() => navigate('/dashboard/categories')}
                      startIcon={<span>➕</span>}
                    >
                      Add Categories
                    </Button>
                  </Box>
                ) : (
                  <FormHelperText>
                    Select a category for this {isIncome ? 'income' : 'expense'}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard/transactions')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color={isIncome ? "success" : "primary"}
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {isSubmitting ? 'Processing...' : `Add ${isIncome ? 'Income' : 'Expense'}`}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog 
        open={showConfirmDialog} 
        onClose={() => !isSubmitting && setShowConfirmDialog(false)}
        aria-labelledby="confirm-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="confirm-dialog-title" sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            {isIncome ? (
              <span style={{ color: '#2e7d32' }}>💵</span>
            ) : (
              <span style={{ color: '#d32f2f' }}>💸</span>
            )}
            <span>Confirm {isIncome ? 'Income' : 'Expense'}</span>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box mb={2}>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to add this {isIncome ? 'income' : 'expense'} of 
              <span style={{ 
                color: isIncome ? '#2e7d32' : '#d32f2f',
                fontWeight: 'bold',
                margin: '0 4px'
              }}>
                ₹{parseFloat(formData.amount || 0).toFixed(2)}
              </span>?
            </Typography>
          </Box>
          
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, mb: 2 }}>
            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  <strong>Category:</strong>
                </Typography>
                <Typography variant="body2">
                  {categories.find(c => c._id === formData.category)?.name || 'N/A'}
                </Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  <strong>Date:</strong>
                </Typography>
                <Typography variant="body2">
                  {formData.date ? new Date(formData.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }) : 'N/A'}
                </Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  <strong>Description:</strong>
                </Typography>
                <Typography variant="body2" sx={{ maxWidth: '60%', textAlign: 'right' }}>
                  {formData.description || 'No description'}
                </Typography>
              </Box>
            </Box>
          </Paper>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
          <Button 
            onClick={() => setShowConfirmDialog(false)} 
            disabled={isSubmitting}
            variant="outlined"
            color="inherit"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmSubmit}
            color={isIncome ? 'success' : 'primary'}
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ minWidth: 120 }}
          >
            {isSubmitting ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddTransaction;
