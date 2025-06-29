// src/components/Transactions/TransactionList.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Button,
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
  Chip,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
  CardContent,
  Grid,
  useMediaQuery,
  useTheme,
  Fade,
  Zoom,
  Tooltip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as BalanceIcon,
  Category as CategoryIcon,
  CalendarMonth as CalendarIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Receipt as ReceiptIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useTransactions } from '../../contexts/TransactionContext';

const TransactionList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { 
    transactions, 
    loading, 
    error, 
    deleteTransaction, 
    refreshTransactions 
  } = useTransactions();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate summary data
  const { totalIncome, totalExpense, balance, recentTransactions } = useMemo(() => {
    const filtered = transactions.filter(t => {
      const matchesSearch = !searchTerm || 
        (t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         t.amount?.toString().includes(searchTerm) ||
         (t.category && typeof t.category === 'string' && t.category.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesCategory = filterCategory === 'all' || 
        t.category?.name?.toLowerCase() === filterCategory.toLowerCase() ||
        (t.category && typeof t.category === 'string' && t.category.toLowerCase() === filterCategory.toLowerCase());
      
      return matchesSearch && matchesCategory;
    });

    const income = filtered
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
    const expense = filtered
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    return {
      totalIncome: income.toFixed(2),
      totalExpense: expense.toFixed(2),
      balance: (income - expense).toFixed(2),
      recentTransactions: filtered.slice(0, 5)
    };
  }, [transactions, searchTerm, filterCategory]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshTransactions();
      enqueueSnackbar('Transactions refreshed', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to refresh transactions', { variant: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    enqueueSnackbar('Export functionality coming soon!', { variant: 'info' });
  };

  // Categories for filter
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'income', name: 'Income' },
    { id: 'expense', name: 'Expense' },
    { id: 'food', name: 'Food & Dining' },
    { id: 'shopping', name: 'Shopping' },
    { id: 'transportation', name: 'Transportation' },
    { id: 'bills', name: 'Bills & Utilities' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'other', name: 'Other' }
  ];

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: 'error' });
    }
  }, [error, enqueueSnackbar]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (id) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    
    try {
      await deleteTransaction(transactionToDelete);
      enqueueSnackbar('Transaction deleted successfully', { variant: 'success' });
      await refreshTransactions();
      
      // Reset pagination if we're on a page that no longer exists
      const newTotalPages = Math.ceil((transactions.length - 1) / rowsPerPage);
      if (page > newTotalPages - 1 && newTotalPages > 0) {
        setPage(newTotalPages - 1);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      enqueueSnackbar(error.message || 'Failed to delete transaction', { variant: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  const handleEdit = (id) => {
    navigate(`/dashboard/transactions/edit/${id}`);
  };

  // Show loading state
  if (loading) {
    console.log('🔃 [TransactionList] Loading state - Loading transactions...');
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="textSecondary" mt={2}>
          Loading your transactions...
        </Typography>
        <Typography variant="body2" color="textSecondary" mt={1}>
          Please wait while we fetch your data
        </Typography>
      </Box>
    );
  }
  
  // Show empty state when no transactions
  if (!loading && !error && transactions.length === 0) {
    return (
      <Box textAlign="center" p={4}>
        <Box mb={2}>
          <MoneyIcon color="action" style={{ fontSize: 60, opacity: 0.5 }} />
        </Box>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No transactions found
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          You don't have any transactions yet. Add your first transaction to get started!
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/dashboard/transactions/new')}
          sx={{ mt: 2 }}
        >
          Add Transaction
        </Button>
      </Box>
    );
  }

  // Show error message if there's an error
  if (error) {
    console.error('❌ [TransactionList] Error state:', error);
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          variant="outlined"
          sx={{ mb: 3 }}
          action={
            <Button 
              color="error" 
              size="small" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Retrying...' : 'Retry'}
            </Button>
          }
        >
          <AlertTitle>Error loading transactions</AlertTitle>
          {error.message || 'Failed to load transactions. Please try again.'}
        </Alert>
      </Box>
    );
  }

  // Show empty state if no transactions
  if (transactions.length === 0) {
    console.log('ℹ️ [TransactionList] No transactions found');
    return (
      <Box textAlign="center" py={6} px={2}>
        <Box 
          component="img"
          src="/empty-state.svg"
          alt="No transactions"
          sx={{ 
            width: 200, 
            height: 200, 
            opacity: 0.7,
            mb: 2 
          }}
        />
        <Typography variant="h5" color="textSecondary" gutterBottom>
          No transactions yet
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Get started by adding your first transaction
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate('/dashboard/transactions/add')}
          sx={{ mt: 2 }}
        >
          Add Your First Transaction
        </Button>
        <Box mt={3}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Box>
    );
  }

  // Filter transactions based on search term and category
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = (transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         transaction.amount?.toString().includes(searchTerm) ||
                         transaction.category?.name?.toLowerCase().includes(searchTerm?.toLowerCase() || '')) ||
                         (transaction.category && typeof transaction.category === 'string' && 
                          transaction.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || 
                           transaction.category?.name?.toLowerCase() === filterCategory.toLowerCase() ||
                           transaction.type?.toLowerCase() === filterCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getCategoryColor = (categoryName) => {
    const colors = {
      'food': '#FF6B6B',
      'shopping': '#FFD166',
      'transportation': '#4ECDC4',
      'bills': '#118AB2',
      'entertainment': '#9C27B0',
      'income': '#06D6A0',
      'expense': '#EF476F',
      'other': '#6C757D'
    };
    return colors[categoryName?.toLowerCase()] || '#6C757D';
  };

  if (loading && transactions.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
        <Box ml={2}>Loading transactions...</Box>
      </Box>
    );
  }

  const SummaryCard = ({ title, value, icon: Icon, color }) => (
    <Fade in={!loading}>
      <Card sx={{ height: '100%', bgcolor: color ? `${color}.light` : 'background.paper' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h5" component="div">
                ${value}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 1.5,
                borderRadius: '50%',
                bgcolor: color ? `${color}.main` : 'action.selected',
                color: color ? `${color}.contrastText` : 'text.primary',
              }}
            >
              <Icon />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  return (
    <Box sx={{ pb: 4 }}>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Total Balance" 
            value={balance} 
            icon={BalanceIcon} 
            color="primary" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Income" 
            value={totalIncome} 
            icon={TrendingUpIcon} 
            color="success" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Expenses" 
            value={totalExpense} 
            icon={TrendingDownIcon} 
            color="error" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard 
            title="Recent Transactions" 
            value={recentTransactions.length} 
            icon={ReceiptIcon} 
            color="info" 
          />
        </Grid>
      </Grid>

      {/* Actions Bar */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <Typography variant="h6" component="h2" sx={{ mr: 'auto' }}>
          Transaction History
        </Typography>
        
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Export">
          <IconButton onClick={handleExport}>
            <ExportIcon />
          </IconButton>
        </Tooltip>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/dashboard/transactions/add')}
          size={isMobile ? 'small' : 'medium'}
        >
          {isMobile ? 'Add' : 'Add Transaction'}
        </Button>
      </Paper>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Search transactions..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Category"
              variant="outlined"
              size="small"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CategoryIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Date Range"
              variant="outlined"
              size="small"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<FilterIcon />}
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
                setDateRange('all');
              }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Transactions Table */}
      <Paper sx={{ mb: 3, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: '60vh' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((transaction) => (
                    <TableRow 
                      key={transaction._id}
                      hover
                      sx={{ '&:last-child td': { borderBottom: 0 } }}
                    >
                      <TableCell>
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {transaction.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={typeof transaction.category === 'object' 
                            ? transaction.category.name 
                            : transaction.category || 'Uncategorized'}
                          size="small"
                          sx={{ 
                            textTransform: 'capitalize',
                            bgcolor: getCategoryColor(
                              typeof transaction.category === 'object' 
                                ? transaction.category.name 
                                : transaction.category
                            ) + '1a',
                            color: getCategoryColor(
                              typeof transaction.category === 'object' 
                                ? transaction.category.name 
                                : transaction.category
                            )
                          }}
                        />
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{
                          color: transaction.type === 'income' ? 'success.main' : 'error.main',
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                          fontSize: '0.95rem'
                        }}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={transaction.type}
                          color={transaction.type === 'income' ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            textTransform: 'capitalize',
                            fontWeight: 'medium',
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          {isMobile ? (
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(transaction._id);
                              }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          ) : (
                            <>
                              <Tooltip title="Edit">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleEdit(transaction._id)}
                                  sx={{
                                    color: 'primary.main',
                                    '&:hover': {
                                      backgroundColor: 'primary.light',
                                      color: 'primary.contrastText'
                                    }
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton 
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(transaction._id);
                                  }}
                                  sx={{
                                    color: 'error.main',
                                    '&:hover': {
                                      backgroundColor: 'error.light',
                                      color: 'error.contrastText'
                                    }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Box textAlign="center">
                      <FilterIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1, opacity: 0.5 }} />
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        No transactions found
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {searchTerm || filterCategory !== 'all' || dateRange !== 'all' 
                          ? 'No transactions match your current filters.'
                          : 'Start by adding your first transaction.'}
                      </Typography>
                      <Button 
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/dashboard/transactions/add')}
                        sx={{ mr: 2 }}
                      >
                        Add Transaction
                      </Button>
                      {(searchTerm || filterCategory !== 'all' || dateRange !== 'all') && (
                        <Button 
                          variant="outlined"
                          onClick={() => {
                            setSearchTerm('');
                            setFilterCategory('all');
                            setDateRange('all');
                          }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {filteredTransactions.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTransactions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              '& .MuiTablePagination-toolbar': {
                px: 2
              }
            }}
          />
        )}
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Delete Transaction
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this transaction? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionList;
