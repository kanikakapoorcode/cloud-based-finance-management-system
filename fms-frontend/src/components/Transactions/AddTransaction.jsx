// src/components/Transactions/AddTransaction.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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

// Define fallback categories outside the component
const fallbackCategories = [
  { _id: '1', name: 'Food & Dining', type: 'expense' },
  { _id: '2', name: 'Shopping', type: 'expense' },
  { _id: '3', name: 'Transportation', type: 'expense' },
  { _id: '4', name: 'Bills & Utilities', type: 'expense' },
  { _id: '5', name: 'Salary', type: 'income' },
  { _id: '6', name: 'Freelance', type: 'income' },
];

const AddTransaction = ({ onTransactionAdded }) => { // Added prop
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();
  const { 
    isAuthenticated, 
    user, 
    loading: authLoading,
    error: authError,
    logout,
    updateUser: refreshUser
  } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIncome, setIsIncome] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);
  const [formData, setFormData] = useState(() => ({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
  }));

  const { enqueueSnackbar } = useSnackbar();
  
  // Simplify category fetching
  useEffect(() => {
    const fetchCategories = async () => {
      if (!isAuthenticated || authLoading) return;
      setLoading(true);
      setCategoriesError(false);
      try {
        const response = await categoryAPI.getAll();
        setCategories(response?.data || fallbackCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategoriesError(true);
        setCategories(fallbackCategories);
        enqueueSnackbar('Failed to load categories. Using fallback categories.', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [isAuthenticated, authLoading, enqueueSnackbar]);

  // Process and normalize categories
  const processedCategories = useMemo(() => {
    return (Array.isArray(categories) && categories.length > 0 ? categories : fallbackCategories).map(cat => ({
      _id: String(cat._id || '').trim(),
      name: String(cat.name || 'Uncategorized').trim(),
      type: String(cat.type || 'expense').toLowerCase().trim(),
    }));
  }, [categories]);

  // Filter categories based on transaction type
  const filteredCategories = useMemo(() => {
    const targetType = isIncome ? 'income' : 'expense';
    return processedCategories.filter(cat => cat.type === targetType || cat.type === 'both');
  }, [processedCategories, isIncome]);

  // Update category when filtered categories change
  useEffect(() => {
    if (filteredCategories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: filteredCategories[0]._id }));
    }
  }, [filteredCategories, setFormData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleIncomeToggle = () => {
    setIsIncome(prev => !prev);
    setFormData(prev => ({
      ...prev,
      category: filteredCategories[0]?._id || '', // Reset category
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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

    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');
    setShowConfirmDialog(false);

    try {
      const selectedCategory = processedCategories.find(cat => cat._id === formData.category);
      if (!selectedCategory) {
        throw new Error('Selected category not found. Please try again.');
      }

      const transactionData = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount).toFixed(2),
        date: formData.date,
        category: selectedCategory._id,
        type: isIncome ? 'income' : 'expense',
        notes: ''
      };

      const response = await addTransaction(transactionData);

      if (response && (response.success || response._id)) {
        const successMessage = `Successfully added ${isIncome ? 'income' : 'expense'} of ${formatCurrency(parseFloat(formData.amount))}`;
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
                {loading ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <CircularProgress size={24} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Loading categories...
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Select
                      labelId="category-select-label"
                      id={inputIds.category}
                      name="category"
                      value={formData.category || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          category: value
                        }));
                      }}
                      disabled={filteredCategories.length === 0}
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected) return <em>Select a category</em>;
                        const selectedCategory = filteredCategories.find(cat => String(cat._id) === String(selected));
                        return selectedCategory ? selectedCategory.name : <em>Invalid selection</em>;
                      }}
                      inputProps={{ 
                        'aria-label': 'Transaction category',
                        'data-testid': 'category-select'
                      }}
                    >
                      {filteredCategories.length === 0 ? (
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
                    
                    {filteredCategories.length === 0 ? (
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
                  </>
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
  );
};

export default AddTransaction;
};

export default AddTransaction;
          >
            {isSubmitting ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddTransaction;
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
                {loading ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <CircularProgress size={24} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Loading categories...
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Select
                      labelId="category-select-label"
                      id={inputIds.category}
                      name="category"
                      value={formData.category || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        console.log('Selected category:', value);
                        setFormData(prev => ({
                          ...prev,
                          category: value
                        }));
                      }}
                      disabled={filteredCategories.length === 0}
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected) return <em>Select a category</em>;
                        const selectedCategory = filteredCategories.find(cat => String(cat._id) === String(selected));
                        return selectedCategory ? selectedCategory.name : <em>Invalid selection</em>;
                      }}
                      inputProps={{ 
                        'aria-label': 'Transaction category',
                        'data-testid': 'category-select'
                      }}
                    >
                      {filteredCategories.length === 0 ? (
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
                    
                    {filteredCategories.length === 0 ? (
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
                  </>
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
