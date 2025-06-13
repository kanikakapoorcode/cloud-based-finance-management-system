import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
  IconButton,
  Paper,
  InputAdornment,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add, Remove, Save, Cancel, ArrowBack } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';

export default function BudgetSetup() {
  const [budgetData, setBudgetData] = useState({
    monthlyIncome: 3500,
    savingsGoal: 500,
    categories: [
      { id: 1, name: 'Housing', amount: 1200 },
      { id: 2, name: 'Groceries', amount: 400 },
      { id: 3, name: 'Utilities', amount: 300 },
      { id: 4, name: 'Transportation', amount: 200 },
      { id: 5, name: 'Entertainment', amount: 150 },
      { id: 6, name: 'Healthcare', amount: 250 },
      { id: 7, name: 'Personal', amount: 200 },
      { id: 8, name: 'Other', amount: 300 }
    ]
  });
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    // Calculate totals whenever budgetData changes
    const allocated = budgetData.categories.reduce((sum, cat) => sum + cat.amount, 0);
    setTotalAllocated(allocated);
    setRemaining(budgetData.monthlyIncome - allocated - budgetData.savingsGoal);
  }, [budgetData]);

  const handleIncomeChange = (e) => {
    setBudgetData({ ...budgetData, monthlyIncome: parseFloat(e.target.value) || 0 });
  };

  const handleSavingsChange = (e) => {
    setBudgetData({ ...budgetData, savingsGoal: parseFloat(e.target.value) || 0 });
  };

  const handleCategoryChange = (id, field, value) => {
    setBudgetData({
      ...budgetData,
      categories: budgetData.categories.map(cat =>
        cat.id === id ? { ...cat, [field]: parseFloat(value) || 0 } : cat
      )
    });
  };

  const handleAddCategory = () => {
    if (!newCategory || !newAmount) {
      enqueueSnackbar('Please enter both category name and amount', { variant: 'warning' });
      return;
    }

    setBudgetData({
      ...budgetData,
      categories: [
        ...budgetData.categories,
        {
          id: Date.now(),
          name: newCategory,
          amount: parseFloat(newAmount) || 0
        }
      ]
    });

    setNewCategory('');
    setNewAmount('');
  };

  const handleRemoveCategory = (id) => {
    setBudgetData({
      ...budgetData,
      categories: budgetData.categories.filter(cat => cat.id !== id)
    });
  };

  const handleSubmit = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      enqueueSnackbar('Budget saved successfully!', { variant: 'success' });
      setLoading(false);
      navigate('/dashboard/budget');
    }, 1000);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton component={Link} to="/dashboard/budget" sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          Budget Setup
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Income and Savings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Income
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={budgetData.monthlyIncome}
                onChange={handleIncomeChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
              />

              <Typography variant="h6" gutterBottom>
                Savings Goal
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={budgetData.savingsGoal}
                onChange={handleSavingsChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                variant="outlined"
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Budget Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Budget Summary
              </Typography>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2">Monthly Income:</Typography>
                <Typography variant="h6">₹{budgetData.monthlyIncome.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2">Total Allocated:</Typography>
                <Typography variant="h6" color={totalAllocated > budgetData.monthlyIncome ? 'error.main' : 'text.primary'}>
                  ₹{totalAllocated.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2">Savings Goal:</Typography>
                <Typography variant="h6">₹{budgetData.savingsGoal.toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box>
                <Typography variant="body2">Remaining:</Typography>
                <Typography variant="h6" color={remaining < 0 ? 'error.main' : 'success.main'}>
                  ₹{remaining.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Budget Categories */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Budget Categories
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {budgetData.categories.map((category) => (
              <Grid container spacing={2} key={category.id} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Category Name"
                    value={category.name}
                    onChange={(e) => handleCategoryChange(category.id, 'name', e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={9} sm={4}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={category.amount}
                    onChange={(e) => handleCategoryChange(category.id, 'amount', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={3} sm={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<Remove />}
                    onClick={() => handleRemoveCategory(category.id)}
                    size="small"
                  >
                    Remove
                  </Button>
                </Grid>
              </Grid>
            ))}

            <Divider sx={{ my: 3 }} />

            {/* Add New Category */}
            <Typography variant="subtitle1" gutterBottom>
              Add New Category
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Category Name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={9} sm={4}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={3} sm={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddCategory}
                  size="small"
                >
                  Add
                </Button>
              </Grid>
            </Grid>

            {remaining < 0 && (
              <Alert severity="error" sx={{ mt: 3 }}>
                Warning: Your total allocated budget exceeds your monthly income by ₹{Math.abs(remaining).toFixed(2)}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              component={Link}
              to="/dashboard/budget"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSubmit}
              disabled={loading || remaining < 0}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Budget'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}