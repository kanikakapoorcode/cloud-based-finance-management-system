import React from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const BudgetSavingsGraphs = ({ budgetData, transactions = [] }) => {
  const theme = useTheme();

  // Calculate budget usage
  const calculateBudgetUsage = () => {
    if (!budgetData || !transactions.length) return [];
    
    const expenseTransactions = transactions.filter(t => t.amount < 0);
    const categorySpending = {};
    
    // Initialize with budget categories
    if (budgetData.categories) {
      budgetData.categories.forEach(cat => {
        categorySpending[cat.name] = {
          budget: cat.amount,
          spent: 0
        };
      });
    }
    
    // Calculate actual spending
    expenseTransactions.forEach(transaction => {
      if (transaction.category && categorySpending[transaction.category]) {
        categorySpending[transaction.category].spent += Math.abs(transaction.amount);
      }
    });
    
    return Object.entries(categorySpending).map(([category, data]) => ({
      category,
      budget: data.budget,
      spent: data.spent,
      remaining: Math.max(0, data.budget - data.spent),
      percentage: Math.min(100, (data.spent / data.budget) * 100) || 0
    }));
  };

  // Calculate savings data
  const calculateSavingsData = () => {
    if (!transactions.length) return [];
    
    const monthlyData = {};
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    
    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(now.getMonth() - (5 - i));
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthYear] = { income: 0, expenses: 0 };
    }
    
    // Process transactions
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData[monthYear]) {
        if (transaction.amount > 0) {
          monthlyData[monthYear].income += transaction.amount;
        } else {
          monthlyData[monthYear].expenses += Math.abs(transaction.amount);
        }
      }
    });
    
    return Object.entries(monthlyData).map(([monthYear, data]) => ({
      month: new Date(monthYear).toLocaleString('default', { month: 'short' }),
      savings: data.income - data.expenses,
      income: data.income,
      expenses: data.expenses
    }));
  };

  const budgetUsageData = calculateBudgetUsage();
  const savingsData = calculateSavingsData();

  // Budget Doughnut Chart Data
  const budgetChartData = {
    labels: budgetUsageData.map(item => item.category),
    datasets: [
      {
        data: budgetUsageData.map(item => item.spent),
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
        ],
        borderWidth: 1,
      },
    ],
  };

  // Savings Bar Chart Data
  const savingsChartData = {
    labels: savingsData.map(item => item.month),
    datasets: [
      {
        label: 'Income',
        data: savingsData.map(item => item.income),
        backgroundColor: theme.palette.success.main,
      },
      {
        label: 'Expenses',
        data: savingsData.map(item => item.expenses),
        backgroundColor: theme.palette.error.main,
      },
      {
        label: 'Savings',
        data: savingsData.map(item => item.savings),
        backgroundColor: theme.palette.primary.main,
        type: 'line',
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
        pointBackgroundColor: theme.palette.primary.main,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ₹${context.raw.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {/* Budget Usage Doughnut Chart */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>
            Budget Usage
          </Typography>
          <Box sx={{ flex: 1, minHeight: '300px' }}>
            {budgetUsageData.length > 0 ? (
              <Doughnut data={budgetChartData} options={chartOptions} />
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: 'text.secondary'
              }}>
                No budget data available
              </Box>
            )}
          </Box>
          {budgetUsageData.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {budgetUsageData.map((item, index) => (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  mb: 1,
                  '&:last-child': { mb: 0 }
                }}>
                  <Typography variant="body2">
                    {item.category}:
                  </Typography>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" component="div">
                      ₹{item.spent.toLocaleString()} of ₹{item.budget.toLocaleString()}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color={item.percentage > 90 ? 'error' : 'text.secondary'}
                    >
                      {item.percentage.toFixed(1)}% used
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Grid>

      {/* Savings Trend Bar Chart */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>
            Savings Trend (Last 6 Months)
          </Typography>
          <Box sx={{ flex: 1, minHeight: '300px' }}>
            {savingsData.length > 0 ? (
              <Bar data={savingsChartData} options={chartOptions} />
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: 'text.secondary'
              }}>
                No transaction data available
              </Box>
            )}
          </Box>
          {savingsData.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Average Monthly Savings
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  ₹{(savingsData.reduce((sum, item) => sum + item.savings, 0) / savingsData.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Total Savings (6 Months)
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  ₹{savingsData.reduce((sum, item) => sum + item.savings, 0).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default BudgetSavingsGraphs;
