// src/components/Budget/BudgetOverview.jsx
import { useState, useEffect } from 'react';
import { useBudget } from '../../contexts/BudgetContext';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Button,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  IconButton,
  MenuItem,
  TextField,
  CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import { Settings, Edit, TrendingUp, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../../utils/formatCurrency';

// Chart component
const BudgetChart = ({ data }) => {
  return (
    <Box sx={{ mt: 2, mb: 1 }}>
      {data.map((item) => (
        <Box key={item.category} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">{item.category}</Typography>
            <Typography variant="body2" fontWeight="medium">
              ₹{item.spent.toFixed(2)} / ₹{item.budget.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={Math.min((item.spent / item.budget) * 100, 100)} 
                color={item.spent > item.budget ? "error" : "primary"}
                sx={{ height: 8, borderRadius: 5 }}
              />
            </Box>
            <Box sx={{ minWidth: 35 }}>
              <Typography variant="body2" color="text.secondary">
                {Math.round((item.spent / item.budget) * 100)}%
              </Typography>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

// Mock spending data - in a real app, this would come from your transactions
const mockSpending = {
  'Housing': 1200,
  'Groceries': 310.50,
  'Utilities': 165.75,
  'Transportation': 75,
  'Entertainment': 100,
  'Healthcare': 0,
  'Personal': 0,
  'Other': 0
};

export default function BudgetOverview() {
  const { budgetData, loading: contextLoading } = useBudget();
  const [selectedMonth, setSelectedMonth] = useState('05-2025');
  const { enqueueSnackbar } = useSnackbar();

  const months = [
    '04-2025', '05-2025', '06-2025'
  ];

  // Format budget data for display
  const formattedData = budgetData ? {
    totalBudget: budgetData.monthlyIncome,
    totalSpent: budgetData.categories.reduce((sum, cat) => sum + (mockSpending[cat.name] || 0), 0),
    remainingBudget: budgetData.monthlyIncome - budgetData.savingsGoal - 
                    budgetData.categories.reduce((sum, cat) => sum + (mockSpending[cat.name] || 0), 0),
    savingsGoal: budgetData.savingsGoal,
    currentSavings: budgetData.savingsGoal * 0.85, // Mocked savings progress
    categories: budgetData.categories.map(cat => ({
      category: cat.name,
      budget: cat.amount,
      spent: mockSpending[cat.name] || 0
    }))
  } : null;

  // If we have no budget data but context is done loading, show the setup message
  const loading = contextLoading && !budgetData;

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!formattedData) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No budget data available
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          component={Link} 
          to="/dashboard/budget/setup"
          startIcon={<Settings />}
        >
          Set Up Budget
        </Button>
      </Box>
    );
  }

  const { 
    totalBudget, 
    totalSpent, 
    remainingBudget, 
    savingsGoal, 
    currentSavings, 
    categories 
  } = formattedData;

  const budgetProgress = (totalSpent / totalBudget) * 100;
  const savingsProgress = (currentSavings / savingsGoal) * 100;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Budget Overview
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            value={selectedMonth}
            onChange={handleMonthChange}
            size="small"
            sx={{ width: 120 }}
          >
            {months.map((month) => {
              try {
                const [monthNum, year] = month.split('-').map(Number);
                const date = new Date(year, monthNum - 1, 1);
                const formattedDate = date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric',
                  timeZone: 'Asia/Kolkata'
                });
                
                return (
                  <MenuItem key={month} value={month}>
                    {formattedDate}
                  </MenuItem>
                );
              } catch (error) {
                console.error('Error formatting date:', error);
                return (
                  <MenuItem key={month} value={month}>
                    {month}
                  </MenuItem>
                );
              }
            })}
          </TextField>
          <Button 
            variant="outlined" 
            startIcon={<Settings />} 
            component={Link} 
            to="/dashboard/budget/setup"
          >
            Budget Setup
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" gutterBottom>
                  Total Budget
                </Typography>
                <IconButton size="small">
                  <Edit fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                ₹{totalBudget.toFixed(2)}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={budgetProgress} 
                color={budgetProgress > 90 ? "error" : budgetProgress > 75 ? "warning" : "primary"}
                sx={{ height: 8, borderRadius: 5, mb: 1 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Spent: ₹{totalSpent.toFixed(2)}
                </Typography>
                <Typography 
                  variant="body2" 
                  color={budgetProgress > 90 ? "error.main" : "text.secondary"}
                  fontWeight="medium"
                >
                  {Math.round(budgetProgress)}% Used
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Remaining Budget
              </Typography>
              <Typography variant="h4" component="div" color={remainingBudget < 0 ? "error.main" : "success.main"}>
                ₹{remainingBudget.toFixed(2)}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {new Date().toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric',
                    timeZone: 'Asia/Kolkata'
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Daily budget remaining: ₹{(remainingBudget / 10).toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" gutterBottom>
                  Savings Goal
                </Typography>
                <IconButton size="small" color="primary">
                  <TrendingUp fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                ₹{currentSavings.toFixed(2)}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={savingsProgress} 
                color="success" 
                sx={{ height: 8, borderRadius: 5, mb: 1 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Goal: ₹{savingsGoal.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="success.main" fontWeight="medium">
                  {Math.round(savingsProgress)}% Saved
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Budget Breakdown */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Budget Breakdown
              </Typography>
              <Button 
                variant="text" 
                startIcon={<Edit />} 
                component={Link} 
                to="/dashboard/budget/setup"
              >
                Edit Categories
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <BudgetChart data={categories} />
          </Paper>
        </Grid>

        {/* Income vs Expenses Overview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Income vs Expenses
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ArrowUpward sx={{ color: 'success.main', mr: 1 }} />
                  <Typography>Income</Typography>
                </Box>
                <Typography variant="h6" color="success.main">₹3,500.00</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ArrowDownward sx={{ color: 'error.main', mr: 1 }} />
                  <Typography>Expenses</Typography>
                </Box>
                <Typography variant="h6" color="error.main">₹1,850.75</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontWeight="medium">Net Income</Typography>
                <Typography variant="h6" color="success.main">₹1,649.25</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Top Spending Categories
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {budgetData.categories
              .filter(cat => cat.spent > 0)
              .sort((a, b) => b.spent - a.spent)
              .slice(0, 5)
              .map((category, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography>{category.category}</Typography>
                  <Typography fontWeight="medium">₹{category.spent.toFixed(2)}</Typography>
                </Box>
              ))
            }
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}