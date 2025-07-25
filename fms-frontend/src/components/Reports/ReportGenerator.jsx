import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip as MuiTooltip,
  Tabs,
  Tab,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
  Collapse,
  Fade,
  Zoom,
  Pagination // Import Pagination
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Legend as RechartsLegend, 
  BarChart, 
  Bar, 
  CartesianGrid, 
  XAxis, 
  YAxis,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';
import { 
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  GridOn as GridOnIcon,
  TableChart as TableChartIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Close as CloseIcon,
  SaveAlt as SaveAltIcon,
  AttachMoney as AttachMoneyIcon,
  Category as CategoryIcon,
  DateRange as DateRangeIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Equalizer as EqualizerIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatCurrency';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getTransactionsReport, 
  getBudgetReport, 
  exportReport 
} from '../../services/reportService';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// TabPanel component for tabs
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

// Custom components
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 2, border: '1px solid #ddd' }} elevation={3}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography 
            key={`tooltip-${index}`} 
            variant="body2"
            sx={{ color: entry.color }}
          >
            {`${entry.name}: ${formatCurrency(entry.value)}`}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

const DateRangePreset = ({ label, onClick }) => (
  <Chip
    label={label}
    onClick={onClick}
    variant="outlined"
    size="small"
    sx={{ m: 0.5, cursor: 'pointer' }}
  />
);

const ExportMenu = ({ onExport }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format) => {
    onExport(format);
    handleClose();
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<DownloadIcon />}
        onClick={handleClick}
        aria-controls={open ? 'export-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        Export
      </Button>
      <Menu
        id="export-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'export-button',
        }}
      >
        <MenuItem onClick={() => handleExport('pdf')}>
          <ListItemIcon>
            <PdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv')}>
          <ListItemIcon>
            <TableChartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('excel')}>
          <ListItemIcon>
            <GridOnIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as Excel</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

const ReportGenerator = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Report state
  const [reportType, setReportType] = useState('transactions');
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date()
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    categories: [],
    minAmount: '',
    maxAmount: '',
    transactionType: 'all', // 'all', 'income', 'expense'
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [availableCategories, setAvailableCategories] = useState([]);
  
  // Date presets
  const datePresets = [
    { label: 'Today', getRange: () => ({ startDate: new Date(), endDate: new Date() }) },
    { label: 'Yesterday', getRange: () => ({ startDate: subDays(new Date(), 1), endDate: subDays(new Date(), 1) }) },
    { label: 'Last 7 Days', getRange: () => ({ startDate: subDays(new Date(), 6), endDate: new Date() }) },
    { label: 'Last 30 Days', getRange: () => ({ startDate: subDays(new Date(), 29), endDate: new Date() }) },
    { label: 'This Month', getRange: () => ({ startDate: startOfMonth(new Date()), endDate: new Date() }) },
    { label: 'Last Month', getRange: () => ({
      startDate: startOfMonth(subMonths(new Date(), 1)),
      endDate: endOfMonth(subMonths(new Date(), 1))
    }) },
    { label: 'This Year', getRange: () => ({ startDate: startOfYear(new Date()), endDate: new Date() }) },
    { label: 'Custom', getRange: null }
  ];
  
  // Chart types for different report types
  const chartTypes = {
    transactions: ['bar', 'line'],
    income: ['pie', 'bar', 'area'],
    expenses: ['pie', 'bar', 'radial'],
    budget: ['bar', 'line']
  };
  
  const [selectedChartType, setSelectedChartType] = useState('bar');
  
  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Replace with actual API call to fetch categories
        const mockCategories = [
          'Housing', 'Food', 'Transport', 'Utilities', 'Entertainment', 
          'Shopping', 'Healthcare', 'Education', 'Insurance', 'Investments',
          'Salary', 'Freelance', 'Business', 'Gifts', 'Other'
        ];
        setAvailableCategories(mockCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Apply date range preset
  const applyDatePreset = (preset) => {
    if (preset.getRange) {
      const range = preset.getRange();
      setDateRange(range);
    }
  };

  // Generate report with API call
  const handleGenerateReport = async () => {
    if (!currentUser) {
      navigate('/login', { state: { from: '/reports' } });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { startDate, endDate } = dateRange;
      const { search, categories, minAmount, maxAmount, transactionType, sortBy, sortOrder } = filters;
      
      // Validate dates
      if (startDate > endDate) {
        throw new Error('Start date cannot be after end date');
      }
      
      // Prepare API parameters
      const params = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        sortBy,
        sortOrder,
        search: search || undefined,
        categories: categories.length ? categories.join(',') : undefined,
        minAmount: minAmount || undefined,
        maxAmount: maxAmount || undefined,
        type: transactionType !== 'all' ? transactionType : undefined
      };
      
      let response;
      
      // Call appropriate API based on report type
      switch (reportType) {
        case 'transactions':
        case 'income':
        case 'expenses':
          response = await getTransactionsReport(params);
          break;
          
        case 'budget':
          response = await getBudgetReport({
            month: startDate.getMonth() + 1,
            year: startDate.getFullYear()
          });
          break;
          
        default:
          throw new Error('Invalid report type');
      }
      
      // Process and set report data
      setReportData(processReportData(response.data, reportType));
      
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };
  
  // Process raw API data into formatted report data
  const processReportData = (data, type) => {
    if (!data) return null;
    
    switch (type) {
      case 'transactions':
        return {
          ...data,
          summary: {
            ...data.summary,
            netAmount: data.summary.totalIncome - data.summary.totalExpenses
          }
        };
        
      case 'income':
        return {
          ...data,
          summary: {
            totalIncome: data.summary?.total || 0,
            incomeByCategory: data.summary?.byCategory || {}
          }
        };
        
      case 'expenses':
        return {
          ...data,
          summary: {
            totalExpenses: data.summary?.total || 0,
            expensesByCategory: data.summary?.byCategory || {},
            chartData: Object.entries(data.summary?.byCategory || {}).map(([name, value]) => ({
              name,
              value: Math.abs(value)
            }))
          }
        };
        
      case 'budget':
        return {
          ...data,
          summary: {
            totalBudget: data.summary?.totalBudget || 0,
            totalActual: data.summary?.totalActual || 0,
            remaining: (data.summary?.totalBudget || 0) - (data.summary?.totalActual || 0)
          },
          data: data.data.map(item => ({
            ...item,
            remaining: item.budget - item.actual,
            percentUsed: (item.actual / item.budget) * 100
          }))
        };
        
      default:
        return data;
    }
  };
  
  // Export report in different formats
  const handleExportReport = async (format) => {
    if (!reportData) {
      setError('No report data available to export');
      return;
    }
    
    try {
      setLoading(true);
      
      const { startDate, endDate } = dateRange;
      const filename = `${reportType}_report_${format(startDate, 'yyyyMMdd')}_to_${format(endDate, 'yyyyMMdd')}`;
      
      switch (format) {
        case 'pdf':
          exportToPDF(reportData, filename);
          break;
          
        case 'csv':
          exportToCSV(reportData, filename);
          break;
          
        case 'excel':
          exportToExcel(reportData, filename);
          break;
          
        default:
          throw new Error('Unsupported export format');
      }
      
    } catch (err) {
      console.error('Export error:', err);
      setError(`Failed to export report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Export to PDF
  const exportToPDF = (data, filename) => {
    if (!data) return null; // Add null check to prevent errors
    if (!data) return;
    try {
      setLoading(true);
      
      // Format dates for filename
      const startDateStr = formatDate(dateRange.startDate).replace(/\s/g, '-');
      const endDateStr = formatDate(dateRange.endDate).replace(/\s/g, '-');
      filename = filename || `${reportType}-${startDateStr}-to-${endDateStr}`;
      
      // Create PDF document in landscape orientation for better tables
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add company header
      doc.setFillColor(41, 98, 255); // Blue header
      doc.rect(0, 0, 297, 15, 'F');
      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Finance Management System', 148.5, 10, { align: 'center' });
      
      // Add report title
      const reportTitle = {
        transactions: 'Transaction Report',
        income: 'Income Analysis',
        expenses: 'Expense Analysis',
        budget: 'Budget vs Actual'
      }[reportType] || 'Report';
      
      doc.setTextColor(0, 0, 0); // Black text
      doc.setFontSize(18);
      doc.text(reportTitle, 148.5, 25, { align: 'center' });
      
      // Add date range
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Period: ${format(dateRange.startDate, 'MMM d, yyyy')} to ${format(dateRange.endDate, 'MMM d, yyyy')}`, 
        148.5, 
        32, 
        { align: 'center' }
      );
      
      // Add generation timestamp
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Generated on: ${new Date().toLocaleString('en-IN')}`, 
        148.5, 
        38, 
        { align: 'center' }
      );
      
      // Add summary section with colored box
      doc.setFillColor(240, 240, 240); // Light gray background
      doc.rect(15, 45, 267, 40, 'F');
      
      if (reportType === 'transactions') {
        // Left align all summary items vertically with consistent formatting
        const yStart = 60;
        const lineHeight = 7;
        
        // Keep font consistent for all summary items
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        doc.text(`Total Transactions: ${data.summary?.totalTransactions || 0}`, 20, yStart);
        doc.text(`Total Income: ${formatCurrency(data.summary?.totalIncome || 0)}`, 20, yStart + lineHeight);
        doc.text(`Total Expenses: ${formatCurrency(data.summary?.totalExpenses || 0)}`, 20, yStart + lineHeight * 2);
        doc.text(`Net Amount: ${formatCurrency((data.summary?.totalIncome || 0) + (data.summary?.totalExpenses || 0))}`, 20, yStart + lineHeight * 3);
        
        // Add profit/loss indicator
        const netAmount = (data.summary?.totalIncome || 0) + (data.summary?.totalExpenses || 0);
        let profitLossText = '';
        
        if (netAmount > 0) {
          profitLossText = `PROFIT: ${formatCurrency(netAmount)}`;
          doc.setTextColor(0, 128, 0); // Green for profit
        } else if (netAmount < 0) {
          profitLossText = `LOSS: ${formatCurrency(Math.abs(netAmount))}`;
          doc.setTextColor(255, 0, 0); // Red for loss
        } else {
          profitLossText = 'BREAK-EVEN';
          doc.setTextColor(0, 0, 255); // Blue for break-even
        }
        
        // Add a highlighted box for profit/loss
        if (netAmount !== 0) {
          // Calculate profit/loss percentage
          const totalExpenses = Math.abs(data.summary?.totalExpenses || 0);
          const profitLossPercentage = totalExpenses > 0 
            ? ((Math.abs(netAmount) / totalExpenses) * 100).toFixed(1) 
            : 0;
            
          profitLossText += ` (${profitLossPercentage}%)`;
        }
        
        // Create a highlighted box for profit/loss
        const textWidth = doc.getTextWidth(profitLossText);
        if (netAmount > 0) {
          doc.setFillColor(230, 255, 230); // Light green background
        } else if (netAmount < 0) {
          doc.setFillColor(255, 230, 230); // Light red background
        } else {
          doc.setFillColor(230, 230, 255); // Light blue background
        }
        
        // Position the profit/loss indicator below the summary items
        doc.roundedRect(20, yStart + lineHeight * 4, textWidth + 10, 8, 1, 1, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(profitLossText, 25, yStart + lineHeight * 4 + 5);
        
        // Reset text color and font
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
      } else if (reportType === 'income') {
        doc.text(`Total Income: ${formatCurrency(data.summary?.totalIncome || 0)}`, 20, 60);
        
        let xPos = 20;
        let yPos = 68;
        doc.text('Income by Category:', xPos, yPos);
        yPos += 6;
        
        if (data.summary?.incomeByCategory) {
          Object.entries(data.summary.incomeByCategory).forEach(([category, amount], index) => {
            doc.text(`${category}: ${formatCurrency(amount)}`, xPos, yPos);
            yPos += 6;
            
            // Create a new column after every 3 items
            if ((index + 1) % 3 === 0 && index < Object.entries(data.summary.incomeByCategory).length - 1) {
              xPos += 90;
              yPos = 68 + 6;
            }
          });
        }
      } else if (reportType === 'expenses') {
        doc.text(`Total Expenses: ${formatCurrency(data.summary?.totalExpenses || 0)}`, 20, 60);
        
        let xPos = 20;
        let yPos = 68;
        doc.text('Expenses by Category:', xPos, yPos);
        yPos += 6;
        
        if (data.summary?.expensesByCategory) {
          Object.entries(data.summary.expensesByCategory).forEach(([category, amount], index) => {
            doc.text(`${category}: ${formatCurrency(amount)}`, xPos, yPos);
            yPos += 6;
            
            // Create a new column after every 3 items
            if ((index + 1) % 3 === 0 && index < Object.entries(data.summary.expensesByCategory).length - 1) {
              xPos += 90;
              yPos = 68 + 6;
            }
          });
        }
      } else if (reportType === 'budget') {
        // Left align all summary items vertically with consistent formatting
        const yStart = 60;
        const lineHeight = 7;
        
        // Keep font consistent for all summary items
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        doc.text(`Total Budget: ${formatCurrency(data.summary?.totalBudget || 0)}`, 20, yStart);
        doc.text(`Total Spent: ${formatCurrency(data.summary?.totalActual || 0)}`, 20, yStart + lineHeight);
        doc.text(`Remaining: ${formatCurrency((data.summary?.totalBudget || 0) - (data.summary?.totalActual || 0))}`, 20, yStart + lineHeight * 2);
        doc.text(`Utilization: ${data.summary?.totalBudget ? ((data.summary.totalActual / data.summary.totalBudget) * 100).toFixed(1) : 0}%`, 20, yStart + lineHeight * 3);
        
        // Add profit/loss indicator for budget
        const remaining = (data.summary?.totalBudget || 0) - (data.summary?.totalActual || 0);
        let budgetStatusText = '';
        
        if (remaining > 0) {
          budgetStatusText = `UNDER BUDGET: ${formatCurrency(remaining)}`;
          doc.setTextColor(0, 128, 0); // Green for under budget
        } else if (remaining < 0) {
          budgetStatusText = `OVER BUDGET: ${formatCurrency(Math.abs(remaining))}`;
          doc.setTextColor(255, 0, 0); // Red for over budget
        } else {
          budgetStatusText = 'ON BUDGET';
          doc.setTextColor(0, 0, 255); // Blue for on budget
        }
        
        // Add a highlighted box for budget status
        if (remaining !== 0) {
          // Calculate over/under budget percentage
          const totalBudget = data.summary?.totalBudget || 0;
          const budgetVariancePercentage = totalBudget > 0 
            ? ((Math.abs(remaining) / totalBudget) * 100).toFixed(1) 
            : 0;
            
          budgetStatusText += ` (${budgetVariancePercentage}%)`;
        }
        
        // Create a highlighted box for budget status
        const textWidth = doc.getTextWidth(budgetStatusText);
        if (remaining > 0) {
          doc.setFillColor(230, 255, 230); // Light green background
        } else if (remaining < 0) {
          doc.setFillColor(255, 230, 230); // Light red background
        } else {
          doc.setFillColor(230, 230, 255); // Light blue background
        }
        
        // Position the budget status indicator below the summary items
        doc.roundedRect(20, yStart + lineHeight * 4, textWidth + 10, 8, 1, 1, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(budgetStatusText, 25, yStart + lineHeight * 4 + 5);
        
        // Reset text color and font
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
      }
      
      // Add data tables
      let tableY = 95;
      
      // Add transactions table
      if ((reportType === 'transactions' || reportType === 'income' || reportType === 'expenses') && data.data?.length) {
        // Add table header
        doc.setFillColor(41, 98, 255);
        doc.rect(15, tableY, 267, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('Date', 20, tableY + 5);
        doc.text('Description', 50, tableY + 5);
        doc.text('Category', 120, tableY + 5);
        doc.text('Amount', 250, tableY + 5, { align: 'right' });
        
        // Add table rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        tableY += 10;
        
        data.data.forEach((item, index) => {
          // Check if we need a new page
          if (tableY > 180) {
            doc.addPage();
            doc.setPage(doc.internal.getNumberOfPages());
            tableY = 20;
          }
          
          // Alternate row colors
          if (index % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(15, tableY - 2, 267, 8, 'F');
          }
          
          // Set text color based on amount
          if (item.amount > 0) {
            doc.setTextColor(0, 128, 0); // Green for income
          } else {
            doc.setTextColor(255, 0, 0); // Red for expenses
          }
          
          // Add row data
          doc.text(format(new Date(item.date), 'MMM d, yyyy'), 20, tableY + 5);
          doc.text(item.description.substring(0, 30), 50, tableY + 5);
          doc.text(item.category, 120, tableY + 5);
          doc.text(formatCurrency(item.amount), 250, tableY + 5, { align: 'right' });
          
          // Reset text color
          doc.setTextColor(0, 0, 0);
          
          tableY += 8;
        });
      } 
      // Add budget table
      else if (reportType === 'budget' && data.data?.length) {
        // Add table header
        doc.setFillColor(41, 98, 255);
        doc.rect(15, tableY, 267, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('Category', 20, tableY + 5);
        doc.text('Budget', 100, tableY + 5, { align: 'right' });
        doc.text('Actual', 160, tableY + 5, { align: 'right' });
        doc.text('Remaining', 220, tableY + 5, { align: 'right' });
        doc.text('Status', 280, tableY + 5, { align: 'right' });
        
        // Add table rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        tableY += 10;
        
        data.data.forEach((item, index) => {
          // Check if we need a new page
          if (tableY > 180) {
            doc.addPage();
            doc.setPage(doc.internal.getNumberOfPages());
            tableY = 20;
          }
          
          // Alternate row colors
          if (index % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(15, tableY - 2, 267, 8, 'F');
          }
          
          // Add row data
          doc.text(item.category, 20, tableY + 5);
          doc.text(formatCurrency(item.budget), 100, tableY + 5, { align: 'right' });
          doc.text(formatCurrency(item.actual), 160, tableY + 5, { align: 'right' });
          doc.text(formatCurrency(item.remaining), 220, tableY + 5, { align: 'right' });
          
          // Add status with color coding
          const percentUsed = (item.actual / item.budget) * 100;
          
          // Status text
          let status = 'On Track';
          if (percentUsed > 90) {
            status = 'Critical';
            doc.setTextColor(255, 0, 0); // Red
          } else if (percentUsed > 75) {
            status = 'Warning';
            doc.setTextColor(255, 165, 0); // Orange
          }
          doc.text(status, 280, tableY + 5, { align: 'right' });
          doc.setTextColor(0, 0, 0); // Reset to black
          
          tableY += 8;
        });
      }
      
      // Add footer to all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Add footer line
        doc.setDrawColor(200, 200, 200);
        doc.line(15, 200, 282, 200);
        
        // Add footer text
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Finance Management System - Generated Report', 148.5, 205, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, 282, 205, { align: 'right' });
      }
      
      // Save the PDF
      doc.save(`${filename}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = (data, filename) => {
    if (!data) return null;
    let csvContent = '';
    
    // Add headers
    const headers = [];
    const rows = [];
    
    if (reportType === 'transactions' || reportType === 'income' || reportType === 'expenses') {
      headers.push('Date', 'Description', 'Category', 'Amount');
      
      data.data.forEach(item => {
        rows.push([
          format(new Date(item.date), 'yyyy-MM-dd'),
          `"${item.description}"`,
          item.category,
          item.amount
        ]);
      });
      
    } else if (reportType === 'budget') {
      headers.push('Category', 'Budget', 'Actual', 'Remaining', '% Used', 'Status');
      
      data.data.forEach(item => {
        rows.push([
          item.category,
          item.budget,
          item.actual,
          item.remaining,
          item.percentUsed.toFixed(1),
          item.percentUsed > 90 ? 'Critical' : item.percentUsed > 75 ? 'Warning' : 'On Track'
        ]);
      });
    }
    
    // Combine headers and rows
    csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  };
  
  // Export to Excel
  const exportToExcel = (data, filename) => {
    if (!data) return null;
    const wb = XLSX.utils.book_new();
    
    if (reportType === 'transactions' || reportType === 'income' || reportType === 'expenses') {
      const wsData = [
        ['Date', 'Description', 'Category', 'Amount'],
        ...data.data.map(item => [
          format(new Date(item.date), 'yyyy-MM-dd'),
          item.description,
          item.category,
          item.amount
        ])
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
      
    } else if (reportType === 'budget') {
      const wsData = [
        ['Category', 'Budget', 'Actual', 'Remaining', '% Used', 'Status'],
        ...data.data.map(item => [
          item.category,
          item.budget,
          item.actual,
          item.remaining,
          item.percentUsed.toFixed(1),
          item.percentUsed > 90 ? 'Critical' : item.percentUsed > 75 ? 'Warning' : 'On Track'
        ])
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Budget');
    }
    
    // Generate and trigger download
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };
  
  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Toggle category selection
  const toggleCategory = (category) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };
  
  // Render category breakdown chart
  const renderCategoryBreakdown = () => {
    if (!reportData?.summary?.expensesByCategory && reportType === 'expenses') {
      return <Typography>No expense categories to display.</Typography>;
    }

    if (!reportData?.summary?.incomeByCategory && reportType === 'income') {
      return <Typography>No income categories to display.</Typography>;
    }

    const categoryData = reportType === 'expenses' ? reportData.summary.expensesByCategory : reportData.summary.incomeByCategory;

    if (!categoryData) return null;

    const data = Object.entries(categoryData).map(([category, value]) => ({
      name: category,
      value: Math.abs(value),
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random() * 16777215).toString(16)}`} />
            ))}
          </Pie>
          <RechartsTooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // TabPanel component for the tabs
  function TabPanel(props) {
    const { children, value, index, ...other } = props;
  
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  }

  TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
  };

  const renderSummaryCards = () => {
    return null;
  };

  const renderQuickStats = () => {
    return null;
  };

  const renderMainChart = () => {
    return null;
  };

  const renderSecondaryChart = () => {
    return null;
  };

  const renderDataTable = () => {
    return null;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Financial Reports
        </Typography>
        {reportData && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ minWidth: 120 }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => handleExportReport('pdf')}
              startIcon={<DownloadIcon />}
            >
              Export Report
            </Button>
          </Box>
        )}
      </Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom fontWeight="medium" color="primary">
          Generate Report
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="report-type-label">Report Type</InputLabel>
              <Select
                labelId="report-type-label"
                id="report-type"
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="transactions">All Transactions</MenuItem>
                <MenuItem value="income">Income Analysis</MenuItem>
                <MenuItem value="expenses">Expense Analysis</MenuItem>
                <MenuItem value="budget">Budget vs Actual</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={dateRange.startDate}
                onChange={(newValue) => setDateRange(prev => ({ ...prev, startDate: newValue }))}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <DateRangeIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={dateRange.endDate}
                onChange={(newValue) => setDateRange(prev => ({ ...prev, endDate: newValue }))}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <DateRangeIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleGenerateReport}
              size="large"
              disabled={loading}
              fullWidth
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </Grid>
          
          {/* Date Presets */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: -1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
                Quick Select:
              </Typography>
              {datePresets.map((preset) => (
                <DateRangePreset
                  key={preset.label}
                  label={preset.label}
                  onClick={() => applyDatePreset(preset)}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
        
        {/* Advanced Filters */}
        <Collapse in={showFilters} timeout="auto" unmountOnExit>
          <Paper elevation={0} sx={{ p: 2, mt: 3, bgcolor: 'background.default', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Advanced Filters
              </Typography>
              <Button 
                size="small" 
                onClick={resetFilters}
                startIcon={<CloseIcon fontSize="small" />}
              >
                Clear All
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search Transactions"
                  variant="outlined"
                  size="small"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Transaction Type</InputLabel>
                  <Select
                    value={filters.transactionType}
                    onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                    label="Transaction Type"
                  >
                    <MenuItem value="all">All Transactions</MenuItem>
                    <MenuItem value="income">Income Only</MenuItem>
                    <MenuItem value="expense">Expenses Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Min Amount"
                  variant="outlined"
                  size="small"
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Max Amount"
                  variant="outlined"
                  size="small"
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl component="fieldset" variant="standard">
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Categories:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {availableCategories.slice(0, 10).map((category) => (
                      <Chip
                        key={category}
                        label={category}
                        onClick={() => toggleCategory(category)}
                        variant={filters.categories.includes(category) ? 'filled' : 'outlined'}
                        color={filters.categories.includes(category) ? 'primary' : 'default'}
                        size="small"
                        clickable
                      />
                    ))}
                    {availableCategories.length > 10 && (
                      <Chip
                        label={`+${availableCategories.length - 10} more`}
                        size="small"
                        onClick={() => setShowAllCategories(!showAllCategories)}
                        clickable
                      />
                    )}
                  </Box>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={resetFilters}
                    startIcon={<CloseIcon />}
                  >
                    Reset
                  </Button>
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={handleGenerateReport}
                    startIcon={<FilterListIcon />}
                  >
                    Apply Filters
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>
      </Paper>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setError(null)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: 2, minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <CircularProgress size={60} thickness={4} sx={{ mb: 3, mx: 'auto' }} />
          <Typography variant="h6" color="text.secondary">Generating your report...</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This may take a moment depending on the data size
          </Typography>
        </Paper>
      ) : reportData ? (
        <Box sx={{ position: 'relative' }}>
          {/* Report Actions */}
          <Box sx={{ position: 'absolute', top: 8, right: 0, zIndex: 1, display: 'flex', gap: 1 }}>
            <MuiTooltip title="Refresh data">
              <IconButton 
                size="small" 
                onClick={handleGenerateReport}
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
            </MuiTooltip>
            <ExportMenu onExport={handleExportReport} />
          </Box>
          
          {/* Report Tabs */}
          <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
            >
              <Tab 
                label="Summary" 
                icon={<EqualizerIcon />} 
                iconPosition="start"
                sx={{ minHeight: 48, textTransform: 'none' }}
              />
              <Tab 
                label="Charts" 
                icon={<TrendingUpIcon />} 
                iconPosition="start"
                sx={{ minHeight: 48, textTransform: 'none' }}
              />
              <Tab 
                label="Details" 
                icon={<TableChartIcon />} 
                iconPosition="start"
                sx={{ minHeight: 48, textTransform: 'none' }}
              />
            </Tabs>
          </Paper>
          {/* Tab Panels */}
          <Box sx={{ mt: 2 }}>
            {/* Summary Tab */}
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom fontWeight="medium">
                  {reportType === 'transactions' && 'Transaction Summary'}
                  {reportType === 'income' && 'Income Summary'}
                  {reportType === 'expenses' && 'Expense Summary'}
                  {reportType === 'budget' && 'Budget Overview'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {format(dateRange.startDate, 'MMM d, yyyy')} - {format(dateRange.endDate, 'MMM d, yyyy')}
                </Typography>
                
                {/* Summary Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {renderSummaryCards()}
                </Grid>
                
                {/* Quick Stats */}
                <Paper elevation={0} sx={{ p: 2, mb: 4, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                    Quick Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    {renderQuickStats()}
                  </Grid>
                </Paper>
              </Box>
            </TabPanel>
            
            {/* Charts Tab */}
            <TabPanel value={activeTab} index={1}>
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight="medium">
                    {reportType === 'budget' ? 'Budget vs Actual' : 'Spending Trends'}
                  </Typography>
                  {chartTypes[reportType]?.length > 1 && (
                    <FormControl size="small" variant="outlined">
                      <Select
                        value={selectedChartType}
                        onChange={(e) => setSelectedChartType(e.target.value)}
                        sx={{ minWidth: 120 }}
                      >
                        {chartTypes[reportType].map((type) => (
                          <MenuItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: 2, height: '100%', minHeight: 400, borderRadius: 2, bgcolor: 'background.paper' }}>
                      {renderMainChart()}
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 2, height: '100%', minHeight: 400, borderRadius: 2, bgcolor: 'background.paper' }}>
                      {renderSecondaryChart()}
                    </Paper>
                  </Grid>
                </Grid>
                
                {reportType !== 'budget' && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                      Category Breakdown
                    </Typography>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
                      {renderCategoryBreakdown()}
                    </Paper>
                  </Box>
                )}
              </Box>
            </TabPanel>
            
            {/* Details Tab */}
            <TabPanel value={activeTab} index={2}>
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight="medium">
                    {reportType === 'transactions' && 'Transaction Details'}
                    {reportType === 'income' && 'Income Details'}
                    {reportType === 'expenses' && 'Expense Details'}
                    {reportType === 'budget' && 'Budget Details'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Search..."
                      variant="outlined"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={toggleSortOrder}
                      startIcon={<SortIcon />}
                    >
                      {filters.sortOrder === 'asc' ? 'Oldest' : 'Newest'}
                    </Button>
                  </Box>
                </Box>
                
                <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  {renderDataTable()}
                  
                  {/* Pagination */}
                  {reportData.data.length > 0 && (
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: 1, borderColor: 'divider' }}>
                      <Pagination 
                        count={Math.ceil(reportData.data.length / 10)} 
                        color="primary" 
                        shape="rounded"
                        showFirstButton 
                        showLastButton
                      />
                    </Box>
                  )}
                </Paper>
              </Box>
            </TabPanel>
          </Box>
        </Box>
      ) : (
        <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: 2, minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <EqualizerIcon color="disabled" sx={{ fontSize: 60, mb: 2, mx: 'auto' }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Report Generated
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Select a report type and date range, then click "Generate Report" to view your financial data.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleGenerateReport}
            size="large"
            sx={{ mt: 3, mx: 'auto', minWidth: 200 }}
            startIcon={<RefreshIcon />}
          >
            Generate Report
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default ReportGenerator;