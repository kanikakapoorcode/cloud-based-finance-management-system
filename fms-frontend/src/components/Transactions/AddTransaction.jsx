// src/components/Transactions/AddTransaction.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FormControlLabel,
  Switch,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatCurrency';
import { useTransactions } from '../../contexts/TransactionContext';

const AddTransaction = () => {
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIncome, setIsIncome] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  
  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories...');
        const token = localStorage.getItem('fms_token');
        console.log('Token from localStorage:', token ? 'Token exists' : 'No token found');
        
        if (!token) {
          console.error('No authentication token found');
          enqueueSnackbar('Please log in to access categories', { variant: 'error' });
          setLoading(false);
          return;
        }

        const apiUrl = 'http://localhost:5001/api/v1/categories';
        console.log('Making request to:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include' // Include cookies for session-based auth if needed
        });

        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Categories data received:', data);
          setCategories(data.data || []);
        } else {
          let errorMessage = 'Failed to load categories';
          try {
            const errorData = await response.json();
            console.error('Error response:', errorData);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error('Failed to parse error response:', e);
          }
          enqueueSnackbar(errorMessage, { variant: 'error' });
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        enqueueSnackbar('Error connecting to the server', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, [enqueueSnackbar]);
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: ''
  });

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

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(category => 
    isIncome ? category.type === 'income' : category.type === 'expense'
  );
  
  // Set default category when filtered categories change
  useEffect(() => {
    if (filteredCategories.length > 0 && !formData.category) {
      setFormData(prev => ({
        ...prev,
        category: filteredCategories[0]?._id || ''
      }));
    }
  }, [filteredCategories]);

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
    
    if (!formData.description || !formData.amount || !formData.category) {
      setError('Please fill out all required fields: Description, Amount, and Category.');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid, positive amount.');
      return;
    }
    
    // Find the selected category to ensure it exists
    const selectedCategory = categories.find(cat => cat._id === formData.category);
    
    if (!selectedCategory) {
      setError('Please select a valid category.');
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmDialog(true);
  };
  
  const handleConfirmSubmit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);

      // Find the selected category
      const selectedCategory = categories.find(cat => cat._id === formData.category);

      if (!selectedCategory) {
        throw new Error('Selected category not found');
      }

      // Format the transaction data to match backend expectations
      const transactionData = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        date: formData.date,
        category: selectedCategory._id, // Use the category ID
        type: isIncome ? 'income' : 'expense'
      };
      
      console.log('Submitting transaction data:', transactionData);

      const response = await addTransaction(transactionData);
      if (response.success) {
        setSuccess('Transaction added successfully!');
        setTimeout(() => {
          navigate('/dashboard/transactions');
        }, 1500);
      } else {
        // This case should ideally not be hit if the context throws an error
        setError(response.error || 'An unexpected error occurred.');
      }
    } catch (err) { 
      const errorMessage = err.message || 'Failed to add transaction. Please check your inputs.';
      setError(errorMessage);
      console.error('Error adding transaction:', err);
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
              <TextField
                select
                fullWidth
                id={inputIds.category}
                label="Category"
                name="category"
                value={formData.category || ''}
                onChange={handleChange}
                required
                disabled={loading}
                helperText={loading ? 'Loading categories...' : ''}
                inputProps={{
                  'aria-label': 'Transaction category',
                }}
              >
                <MenuItem value="">Select a category</MenuItem>
                {filteredCategories.map((category) => (
                  <MenuItem 
                    key={category._id} 
                    value={category._id}
                    style={{ color: category.color || 'inherit' }}
                  >
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
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
      >
        <DialogTitle id="confirm-dialog-title">
          Confirm {isIncome ? 'Income' : 'Expense'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to add this {isIncome ? 'income' : 'expense'} of ₹{formData.amount}?
          </Typography>
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              <strong>Category:</strong> {formData.category}<br />
              <strong>Date:</strong> {new Date(formData.date).toLocaleDateString()}<br />
              <strong>Description:</strong> {formData.description}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowConfirmDialog(false)} 
            disabled={isSubmitting}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmSubmit}
            variant="contained"
            color={isIncome ? "success" : "primary"}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSubmitting ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddTransaction;
