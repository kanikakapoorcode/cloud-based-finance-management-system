import React, { useMemo, useState, Suspense, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Skeleton, 
  Alert, 
  AlertTitle, 
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  useMediaQuery,
  IconButton,
  Tooltip,
  Fade,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import BudgetSavingsGraphs from '../components/Dashboard/BudgetSavingsGraphs';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTransactions } from '../contexts/TransactionContext';
import { useAuth } from '../hooks/useAuth';
import { useBudget } from '../contexts/BudgetContext';
import { formatCurrency } from '../utils/formatCurrency';
import { 
  AccountBalance as AccountBalanceIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Add as AddIcon
} from '@mui/icons-material';
import CountUp from 'react-countup';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const containerVariants = {
  hidden: {
    opacity: 0,
    x: '100vw',
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 60,
      damping: 10,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    x: '-100vw',
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 60,
      damping: 10,
      delay: 0.5,
    },
  },
};

// Custom card component for metrics with animations
const MetricCard = ({ title, value, icon, color, trend, trendText, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ 
      y: -5,
      transition: { duration: 0.2 }
    }}
  >
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        background: theme => `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: theme => alpha(theme.palette.divider, 0.1),
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
        },
        '&:hover': {
          boxShadow: theme => `0 16px 48px 0 ${alpha(theme.palette.primary.main, 0.15)}`,
        },
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <CardContent sx={{ 
        flexGrow: 1,
        p: 3,
        '&:last-child': {
          pb: 3
        }
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography 
              variant="subtitle2" 
              color="text.secondary" 
              gutterBottom
              sx={{
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              component="div" 
              sx={{ 
                fontWeight: 700, 
                color: 'text.primary',
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                lineHeight: 1.2,
                mb: 1,
                '& .countup': {
                  background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }
              }}
            >
              {typeof value === 'number' ? (
                <CountUp 
                  end={value} 
                  prefix="₹" 
                  separator="," 
                  decimals={2}
                  duration={1.5}
                  className="countup"
                />
              ) : (
                <span className="countup">{value}</span>
              )}
            </Typography>
          </Box>
          <Box 
            sx={{ 
              backgroundColor: theme => alpha(color, 0.1), 
              borderRadius: 3, 
              width: 56, 
              height: 56, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: color,
              fontSize: 28,
              boxShadow: `0 4px 20px 0 ${alpha(color, 0.2)}`,
              transition: 'all 0.3s ease-in-out',
            }}
          >
            {icon}
          </Box>
        </Box>
        {trend !== undefined && (
          <Box 
            display="flex" 
            alignItems="center" 
            mt={1.5}
            sx={{
              padding: '6px 10px',
              borderRadius: 4,
              backgroundColor: theme => 
                trend > 0 
                  ? alpha(theme.palette.success.main, 0.1) 
                  : alpha(theme.palette.error.main, 0.1),
              alignSelf: 'flex-start',
              display: 'inline-flex',
            }}
          >
            <Box 
              component="span" 
              sx={{ 
                color: trend > 0 ? 'success.main' : 'error.main',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            >
              {trend > 0 ? (
                <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
              ) : (
                <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
              )} 
              {Math.abs(trend)}%
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ ml: 1, fontWeight: 500 }}
              >
                {trendText}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

// Helper function to generate chart data
const generateChartData = (transactions) => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      labels: [],
      income: [],
      expenses: [],
      balance: []
    };
  }

  // Group transactions by month
  const monthlyData = transactions.reduce((acc, transaction) => {
    if (!transaction || !transaction.date) return acc;
    
    const date = new Date(transaction.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const amount = parseFloat(transaction.amount) || 0;
    
    if (!acc[monthYear]) {
      acc[monthYear] = { income: 0, expenses: 0 };
    }
    
    if (amount > 0) {
      acc[monthYear].income += amount;
    } else {
      acc[monthYear].expenses += Math.abs(amount);
    }
    
    return acc;
  }, {});
  
  // Sort months chronologically
  const sortedMonths = Object.keys(monthlyData).sort();
  
  // Calculate running balance
  let balance = 0;
  const balanceData = sortedMonths.map(month => {
    balance += (monthlyData[month].income - monthlyData[month].expenses);
    return balance;
  });
  
  return {
    labels: sortedMonths.map(month => {
      const [year, m] = month.split('-');
      return new Date(year, m - 1).toLocaleString('default', { month: 'short' }) + ' ' + year;
    }),
    income: sortedMonths.map(month => monthlyData[month].income),
    expenses: sortedMonths.map(month => monthlyData[month].expenses),
    balance: balanceData
  };
};

const DashboardHome = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { transactions = [], loading, error, refreshTransactions } = useTransactions();
  const { user } = useAuth();
  const { budgetData } = useBudget();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  
  // Debug logging
  useEffect(() => {
    console.log('=== Dashboard Debug ===');
    console.log('User:', user);
    console.log('Transactions:', transactions);
    console.log('Loading:', loading);
    console.log('Error:', error);
    console.log('Transactions length:', transactions?.length || 0);
    console.log('Is authenticated:', !!user);
    console.log('========================');
    
    // Set local loading state based on context loading and user authentication
    if (user) {
      setLocalLoading(loading);
    } else {
      setLocalLoading(true);
    }
  }, [user, transactions, loading, error]);
  
  // Handle refresh
  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    try {
      setIsRefreshing(true);
      setLocalLoading(true);
      await refreshTransactions();
    } catch (err) {
      console.error('Error refreshing transactions:', err);
    } finally {
      setIsRefreshing(false);
      setLocalLoading(false);
    }
  };
  
  // Show loading state
  if (localLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Loading your financial data...
        </Typography>
      </Box>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        flexDirection: 'column',
        gap: 2,
        p: 3
      }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2, maxWidth: 600, width: '100%' }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              startIcon={isRefreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
            >
              {isRefreshing ? 'Refreshing...' : 'Retry'}
            </Button>
          }
        >
          <AlertTitle>Error Loading Data</AlertTitle>
          {typeof error === 'string' ? error : 'Failed to load transactions. Please try again.'}
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/transactions')}
          startIcon={<AccountBalanceIcon />}
        >
          Go to Transactions
        </Button>
      </Box>
    );
  }

  // Calculate totals
  const { totalBalance, monthlyIncome, monthlyExpenses, recentTransactions, hasTransactions } = useMemo(() => {
    try {
      if (!Array.isArray(transactions) || transactions.length === 0) {
        return { 
          totalBalance: 0, 
          monthlyIncome: 0, 
          monthlyExpenses: 0,
          recentTransactions: [],
          hasTransactions: false
        };
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = transactions.reduce((acc, transaction) => {
        if (!transaction) return acc;
        
        const amount = parseFloat(transaction.amount) || 0;
        const transactionDate = new Date(transaction.date || now);
        
        // Skip invalid dates
        if (isNaN(transactionDate.getTime())) return acc;
        
        const isCurrentMonth = 
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear;
        
        // Update total balance (sum all transactions)
        acc.totalBalance += amount;
        
        // Update monthly income/expenses
        if (isCurrentMonth) {
          if (amount > 0) {
            acc.monthlyIncome += amount;
          } else {
            acc.monthlyExpenses += Math.abs(amount);
          }
        }

        // Add to recent transactions (last 30 days)
        if (transactionDate >= thirtyDaysAgo) {
          acc.recentTransactions.push({
            ...transaction,
            amount,
            date: transactionDate
          });
        }
        
        return acc;
      }, { 
        totalBalance: 0, 
        monthlyIncome: 0, 
        monthlyExpenses: 0,
        recentTransactions: [],
        hasTransactions: transactions.length > 0
      });

      // Sort recent transactions by date (newest first)
      result.recentTransactions.sort((a, b) => b.date - a.date);
      
      return result;
    } catch (error) {
      console.error('Error calculating dashboard data:', error);
      return { 
        totalBalance: 0, 
        monthlyIncome: 0, 
        monthlyExpenses: 0,
        recentTransactions: []
      };
    }
  }, [transactions]);

  // Show loading state if either transactions are loading or user is not yet authenticated
  if (loading || (!user && !error)) {
    console.log('Showing loading state - loading:', loading, 'user:', user);
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard Overview
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {[1, 2, 3].map((item) => (
            <Grid item xs={12} md={4} key={item}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Skeleton variant="text" width="60%" height={30} />
                  <Skeleton variant="rectangular" width="80%" height={40} />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Show error if there's an error (only if we have a user or a specific error)
  if (error) {
    console.log('Showing error state - error:', error, 'user:', user);
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard Overview
        </Typography>
        <Alert severity="error" sx={{ mt: 2, mb: 4 }}>
          <AlertTitle>Failed to Load Data</AlertTitle>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              onClick={() => {
                window.location.reload();
              }} 
              color="inherit" 
              size="small"
            >
              <RefreshIcon sx={{ mr: 1 }} />
              Refresh Page
            </Button>
            <Button 
              onClick={handleRefresh} 
              color="inherit" 
              size="small"
              disabled={isRefreshing}
              startIcon={
                isRefreshing ? (
                  <CircularProgress size={20} />
                ) : (
                  <RefreshIcon />
                )
              }
            >
              Try Again
            </Button>
          </Box>
        </Alert>
      </Box>
    );
  }

  // Show empty state if no transactions
  if (!hasTransactions) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        textAlign: 'center',
        p: 3
      }}>
        <AccountBalanceIcon 
          sx={{ 
            fontSize: 80, 
            color: 'text.secondary',
            mb: 2,
            opacity: 0.7
          }} 
        />
        <Typography variant="h5" gutterBottom>
          Welcome to Your Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          It looks like you don't have any transactions yet.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/transactions/new')}
          startIcon={<AddIcon />}
          sx={{ mt: 2 }}
        >
          Add Your First Transaction
        </Button>
        <Button
          variant="outlined"
          onClick={handleRefresh}
          startIcon={<RefreshIcon />}
          disabled={isRefreshing}
          sx={{ mt: 2 }}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dashboard Overview
        </Typography>
        <Button
          variant="outlined"
          onClick={handleRefresh}
          disabled={isRefreshing}
          startIcon={
            isRefreshing ? (
              <CircularProgress size={20} />
            ) : (
              <RefreshIcon />
            )
          }
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </Box>
      
      <Grid container spacing={3} sx={{ mt: 0 }}>
        {/* Total Balance */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total Balance
                </Typography>
                <Typography 
                  variant="h4" 
                  color={totalBalance >= 0 ? "primary" : "error"}
                  fontWeight={700}
                >
                  {formatCurrency(totalBalance)}
                </Typography>
              </Box>
              <AccountBalanceIcon 
                color="primary" 
                sx={{ fontSize: 48, opacity: 0.2 }} 
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Monthly Income */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  This Month's Income
                </Typography>
                <Typography variant="h4" color="success.main" fontWeight={700}>
                  {formatCurrency(monthlyIncome)}
                </Typography>
              </Box>
              <ArrowUpwardIcon 
                color="success" 
                sx={{ fontSize: 48, opacity: 0.2 }} 
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Monthly Expenses */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  This Month's Expenses
                </Typography>
                <Typography variant="h4" color="error.main" fontWeight={700}>
                  {formatCurrency(monthlyExpenses)}
                </Typography>
              </Box>
              <ArrowDownwardIcon 
                color="error" 
                sx={{ fontSize: 48, opacity: 0.2 }} 
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Recent Transactions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="h2">
                Recent Transactions
              </Typography>
              <Button 
                variant="text" 
                color="primary" 
                size="small"
                onClick={() => navigate('/dashboard/transactions')}
              >
                View All
              </Button>
            </Box>
            
            {recentTransactions.length > 0 ? (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {recentTransactions.slice(0, 10).map((transaction) => (
                  <Box 
                    key={transaction._id}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      mb: 1,
                      borderRadius: 1,
                      backgroundColor: 'action.hover',
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" component="div">
                        {transaction.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(transaction.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="subtitle1" 
                      color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                      fontWeight={500}
                    >
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  backgroundColor: 'background.paper',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No recent transactions found
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="small"
                  onClick={() => navigate('/dashboard/transactions/add')}
                  sx={{ mt: 1 }}
                >
                  Add Your First Transaction
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Budget and Savings Graphs */}
      <Suspense fallback={<div>Loading charts...</div>}>
        <BudgetSavingsGraphs 
          budgetData={budgetData} 
          transactions={transactions} 
        />
      </Suspense>
    </Box>
  );
};

// Add custom CSS for the chart tooltip
const chartTooltipStyles = `
  .chartjs-tooltip {
    background: rgba(0, 0, 0, 0.8) !important;
    border-radius: 4px !important;
    padding: 8px 12px !important;
    color: #fff !important;
    font-size: 14px !important;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
    border: none !important;
  }
  
  .chartjs-tooltip-key {
    display: inline-block !important;
    width: 12px !important;
    height: 12px !important;
    margin-right: 8px !important;
    border-radius: 2px !important;
  }
`;

// Add the styles to the document head
const styleElement = document.createElement('style');
document.head.appendChild(styleElement);
styleElement.appendChild(document.createTextNode(chartTooltipStyles));

export default DashboardHome;
