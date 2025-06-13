import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Divider, 
  Avatar, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Chip, 
  Button, 
  CircularProgress,
  LinearProgress 
} from '@mui/material';
import {
  AccountBalance as BalanceIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Savings as SavingsIcon,
  ShoppingBag as ShoppingIcon,
  Fastfood as FoodIcon,
  DirectionsCar as TransportIcon,
  HomeWork as HousingIcon,
  MoreHoriz as MoreIcon
} from '@mui/icons-material';
import { formatCurrency, formatAbbreviatedCurrency } from '../../utils/formatCurrency';

// Mock transaction data
const recentTransactions = [
  { 
    id: 1, 
    title: 'Grocery Shopping', 
    amount: -2450, 
    date: '21 May 2025',
    category: 'Shopping',
    icon: <ShoppingIcon />
  },
  { 
    id: 2, 
    title: 'Salary Credit', 
    amount: 45000, 
    date: '18 May 2025',
    category: 'Income',
    icon: <IncomeIcon />
  },
  { 
    id: 3, 
    title: 'Restaurant Bill', 
    amount: -1200, 
    date: '16 May 2025',
    category: 'Food',
    icon: <FoodIcon />
  },
  { 
    id: 4, 
    title: 'Petrol', 
    amount: -1500, 
    date: '14 May 2025',
    category: 'Transport',
    icon: <TransportIcon />
  },
  { 
    id: 5, 
    title: 'Rent Payment', 
    amount: -15000, 
    date: '10 May 2025',
    category: 'Housing',
    icon: <HousingIcon />
  }
];

const MainPanel = () => {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');
  
  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      // Try to get user name from localStorage
      const user = localStorage.getItem('fms_user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          if (userData.name) {
            setUserName(userData.name.split(' ')[0]); // Get first name
          }
        } catch (e) {
          console.error('Error parsing user data', e);
        }
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Calculate summary data
  const calculateSummary = () => {
    const income = recentTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = recentTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const balance = income - expenses;
    const savings = balance * 0.3; // Assuming 30% of balance is saved
    
    return [
      { 
        title: 'Total Balance', 
        value: formatCurrency(balance), 
        abbr: formatAbbreviatedCurrency(balance),
        icon: <BalanceIcon color="primary" fontSize="large" />,
        color: 'primary.main',
        bgColor: 'primary.lighter'
      },
      { 
        title: 'Income', 
        value: formatCurrency(income), 
        abbr: formatAbbreviatedCurrency(income),
        icon: <IncomeIcon color="success" fontSize="large" />,
        color: 'success.main',
        bgColor: 'success.lighter'
      },
      { 
        title: 'Expenses', 
        value: formatCurrency(expenses), 
        abbr: formatAbbreviatedCurrency(expenses),
        icon: <ExpenseIcon color="error" fontSize="large" />,
        color: 'error.main',
        bgColor: 'error.lighter'
      },
      { 
        title: 'Savings', 
        value: formatCurrency(savings), 
        abbr: formatAbbreviatedCurrency(savings),
        icon: <SavingsIcon color="info" fontSize="large" />,
        color: 'info.main',
        bgColor: 'info.lighter'
      }
    ];
  };

  const summaryData = calculateSummary();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Namaste, {userName}! 🙏
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's your financial summary for May 2025
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {summaryData.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper 
              elevation={2}
              sx={{ 
                p: 2.5, 
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: item.bgColor, 
                    color: item.color,
                    mr: 1.5
                  }}
                >
                  {item.icon}
                </Avatar>
                <Typography variant="h6" component="div" fontWeight="medium">
                  {item.title}
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" component="div" fontWeight="bold" gutterBottom>
                  {item.abbr}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.value}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Recent Transactions
              </Typography>
              <Button variant="text" endIcon={<MoreIcon />}>
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <List sx={{ width: '100%' }}>
              {recentTransactions.map((transaction) => (
                <React.Fragment key={transaction.id}>
                  <ListItem 
                    alignItems="flex-start"
                    secondaryAction={
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: transaction.amount < 0 ? 'error.main' : 'success.main'
                        }}
                      >
                        {formatCurrency(transaction.amount)}
                      </Typography>
                    }
                    sx={{ px: 2, py: 1.5 }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: transaction.amount < 0 ? 'error.lighter' : 'success.lighter',
                        color: transaction.amount < 0 ? 'error.main' : 'success.main'
                      }}>
                        {transaction.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="medium">
                            {transaction.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary" display="block">
                            {transaction.date}
                          </Typography>
                        }
                        sx={{ m: 0 }}
                      />
                      {/* Chip is now outside of Typography to avoid DOM nesting error */}
                      <Box sx={{ mt: 0.5 }}>
                        <Chip 
                          label={transaction.category} 
                          size="small" 
                          sx={{ fontSize: '0.7rem' }}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </ListItem>
                  {transaction.id !== recentTransactions.length && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Monthly Budget Overview
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Housing
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgressWithLabel value={75} color="primary" />
                  </Box>
                  <Typography variant="body2">
                    {formatCurrency(15000)} / {formatCurrency(20000)}
                  </Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Food & Groceries
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgressWithLabel value={40} color="success" />
                  </Box>
                  <Typography variant="body2">
                    {formatCurrency(3650)} / {formatCurrency(8000)}
                  </Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Transportation
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgressWithLabel value={60} color="warning" />
                  </Box>
                  <Typography variant="body2">
                    {formatCurrency(3000)} / {formatCurrency(5000)}
                  </Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Entertainment
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgressWithLabel value={90} color="error" />
                  </Box>
                  <Typography variant="body2">
                    {formatCurrency(4500)} / {formatCurrency(5000)}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" fullWidth>
                  Manage Budgets
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Custom Linear Progress with Label
function LinearProgressWithLabel(props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress 
          variant="determinate" 
          value={props.value} 
          color={props.color || 'primary'}
          sx={{ height: 8, borderRadius: 5 }} 
        />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}

export default MainPanel;
