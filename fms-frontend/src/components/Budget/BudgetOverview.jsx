// src/components/Budget/BudgetOverview.jsx
import { useState, useEffect } from 'react';
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

export default function BudgetOverview() {
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('05-2025'); // May 2025
  const { enqueueSnackbar } = useSnackbar();

  const months = [
    '04-2025', '05-2025', '06-2025'
  ];

  useEffect(() => {
    // Mock data - replace with actual API call
    const fetchBudgetData = async () => {
      try {
        // Simulate API call
        setTimeout(() => {
          const mockData = {
            totalBudget: 3000,
            totalSpent: 1850.75,
            remainingBudget: 1149.25,
            savingsGoal: 500,
            currentSavings: 425,
            categories: [
              { category: 'Housing', budget: 1200, spent: 1200 },
              { category: 'Groceries', budget: 400, spent: 310.50 },
              { category: 'Utilities', budget: 300, spent: 165.75 },
              { category: 'Transportation', budget: 200, spent: 75 },
              { category: 'Entertainment', budget: 150, spent: 100 },
              { category: 'Healthcare', budget: 250, spent: 0 },
              { category: 'Personal', budget: 200, spent: 0 },
              { category: 'Other', budget: 300, spent: 0 }
            ]
          };
          setBudgetData(mockData);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching budget data:', error);
        enqueueSnackbar('Failed to load budget data', { variant: 'error' });
        setLoading(false);
      }
    };

    setLoading(true);
    fetchBudgetData();
  }, [selectedMonth, enqueueSnackbar]);

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  const budgetProgress = (budgetData.totalSpent / budgetData.totalBudget) * 100;
  const savingsProgress = (budgetData.currentSavings / budgetData.savingsGoal) * 100;

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
                ₹{budgetData.totalBudget.toFixed(2)}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={budgetProgress} 
                color={budgetProgress > 90 ? "error" : budgetProgress > 75 ? "warning" : "primary"}
                sx={{ height: 8, borderRadius: 5, mb: 1 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Spent: ₹{budgetData.totalSpent.toFixed(2)}
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
              <Typography variant="h4" component="div" color={budgetData.remainingBudget < 0 ? "error.main" : "success.main"}>
                ₹{budgetData.remainingBudget.toFixed(2)}
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
                  Daily budget remaining: ₹{(budgetData.remainingBudget / 10).toFixed(2)}
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
                ₹{budgetData.currentSavings.toFixed(2)}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={savingsProgress} 
                color="success" 
                sx={{ height: 8, borderRadius: 5, mb: 1 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Goal: ₹{budgetData.savingsGoal.toFixed(2)}
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
            <BudgetChart data={budgetData.categories} />
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