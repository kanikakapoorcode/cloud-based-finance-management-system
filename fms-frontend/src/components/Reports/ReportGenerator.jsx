import React, { useState, useEffect } from 'react';
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
  Zoom
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
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add header
    doc.setFillColor(41, 98, 255);
    doc.rect(0, 0, 297, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Finance Management System', 148.5, 10, { align: 'center' });
    
    // Add report title
    const reportTitle = {
      transactions: 'Transaction Report',
      income: 'Income Analysis',
      expenses: 'Expense Analysis',
      budget: 'Budget vs Actual'
    }[reportType] || 'Financial Report';
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text(reportTitle, 148.5, 25, { align: 'center' });
    
    // Add date range
    doc.setFontSize(12);
    doc.text(`Period: ${format(dateRange.startDate, 'MMM d, yyyy')} to ${format(dateRange.endDate, 'MMM d, yyyy')}`, 
      148.5, 32, { align: 'center' });
    
    // Add generation timestamp
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 148.5, 38, { align: 'center' });
    
    // Add summary section
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 45, 267, 40, 'F');
    
    // ... rest of the PDF generation code ...
    
    doc.save(`${filename}.pdf`);
  };
  
  // Export to CSV
  const exportToCSV = (data, filename) => {
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
  
  // Toggle sort order
  const toggleSortOrder = () => {
    setFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      search: '',
      categories: [],
      minAmount: '',
      maxAmount: '',
      transactionType: 'all',
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };
      
      // Format dates for filename
      const startDateStr = formatDate(startDate).replace(/\s/g, '-');
      const endDateStr = formatDate(endDate).replace(/\s/g, '-');
      const filename = `${reportTitle}-${startDateStr}-to-${endDateStr}`;
      
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
      doc.setTextColor(0, 0, 0); // Black text
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(reportTitle, 148.5, 25, { align: 'center' });
      
      // Add date range
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Period: ${formatDate(startDate)} to ${formatDate(endDate)}`, 148.5, 32, { align: 'center' });
      
      // Add generation timestamp
      const now = new Date();
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100); // Gray text
      doc.text(`Generated on: ${now.toLocaleString('en-IN')}`, 148.5, 38, { align: 'center' });
      
      // Add summary section with colored box
      doc.setFillColor(240, 240, 240); // Light gray background
      doc.rect(15, 45, 267, 40, 'F'); // Increase height to accommodate vertical layout
      
      doc.setTextColor(0, 0, 0); // Black text
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 20, 53);
      
      // Add summary data based on report type
      if (reportType === 'transactions') {
        // Left align all summary items vertically with consistent formatting
        const yStart = 60;
        const lineHeight = 7;
        
        // Keep font consistent for all summary items
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        doc.text(`Total Transactions: ${reportData.summary.totalTransactions}`, 20, yStart);
        doc.text(`Total Income: ${formatCurrency(reportData.summary.totalIncome)}`, 20, yStart + lineHeight);
        doc.text(`Total Expenses: ${formatCurrency(reportData.summary.totalExpenses)}`, 20, yStart + lineHeight * 2);
        doc.text(`Net Amount: ${formatCurrency(reportData.summary.netAmount)}`, 20, yStart + lineHeight * 3);
        
        // Add profit/loss indicator
        const netAmount = reportData.summary.netAmount;
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
          const totalExpenses = Math.abs(reportData.summary.totalExpenses);
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
        doc.text(`Total Income: ${formatCurrency(reportData.summary.totalIncome)}`, 20, 60);
        
        let xPos = 20;
        let yPos = 68;
        doc.text('Income by Category:', xPos, yPos);
        yPos += 6;
        
        Object.entries(reportData.summary.incomeByCategory).forEach(([category, amount], index) => {
          doc.text(`${category}: ${formatCurrency(amount)}`, xPos, yPos);
          yPos += 6;
          
          // Create a new column after every 3 items
          if ((index + 1) % 3 === 0 && index < Object.entries(reportData.summary.incomeByCategory).length - 1) {
            xPos += 90;
            yPos = 68 + 6;
          }
        });
      } else if (reportType === 'expenses') {
        doc.text(`Total Expenses: ${formatCurrency(reportData.summary.totalExpenses)}`, 20, 60);
        
        let xPos = 20;
        let yPos = 68;
        doc.text('Expenses by Category:', xPos, yPos);
        yPos += 6;
        
        Object.entries(reportData.summary.expensesByCategory).forEach(([category, amount], index) => {
          doc.text(`${category}: ${formatCurrency(amount)}`, xPos, yPos);
          yPos += 6;
          
          // Create a new column after every 3 items
          if ((index + 1) % 3 === 0 && index < Object.entries(reportData.summary.expensesByCategory).length - 1) {
            xPos += 90;
            yPos = 68 + 6;
          }
        });
      } else if (reportType === 'budget') {
        // Left align all summary items vertically with consistent formatting
        const yStart = 60;
        const lineHeight = 7;
        
        // Keep font consistent for all summary items
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        doc.text(`Total Budget: ${formatCurrency(reportData.summary.totalBudget)}`, 20, yStart);
        doc.text(`Total Spent: ${formatCurrency(reportData.summary.totalActual)}`, 20, yStart + lineHeight);
        doc.text(`Remaining: ${formatCurrency(reportData.summary.remaining)}`, 20, yStart + lineHeight * 2);
        doc.text(`Utilization: ${((reportData.summary.totalActual / reportData.summary.totalBudget) * 100).toFixed(1)}%`, 20, yStart + lineHeight * 3);
        
        // Add profit/loss indicator for budget
        const remaining = reportData.summary.remaining;
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
          const totalBudget = reportData.summary.totalBudget;
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
      let tableY = 85;
      
      // Add transactions table if applicable
      if (['transactions', 'income', 'expenses'].includes(reportType) && reportData.data.length > 0) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Transaction Details', 20, tableY);
        tableY += 8;
        
        // Table headers with colored background
        doc.setFillColor(220, 220, 220); // Light gray background
        doc.rect(15, tableY, 267, 7, 'F');
        
        doc.setFontSize(10);
        doc.text('Date', 20, tableY + 5);
        doc.text('Description', 60, tableY + 5);
        doc.text('Category', 160, tableY + 5);
        doc.text('Amount', 260, tableY + 5, { align: 'right' });
        
        tableY += 10;
        doc.setFont('helvetica', 'normal');
        
        // Table rows with alternating colors
        reportData.data.forEach((transaction, index) => {
          // Check if we need a new page
          if (tableY > 180) {
            doc.addPage();
            tableY = 20;
            
            // Add headers on new page
            doc.setFillColor(220, 220, 220);
            doc.rect(15, tableY, 267, 7, 'F');
            
            doc.setFont('helvetica', 'bold');
            doc.text('Date', 20, tableY + 5);
            doc.text('Description', 60, tableY + 5);
            doc.text('Category', 160, tableY + 5);
            doc.text('Amount', 260, tableY + 5, { align: 'right' });
            
            tableY += 10;
            doc.setFont('helvetica', 'normal');
          }
          
          // Alternating row colors
          if (index % 2 === 1) {
            doc.setFillColor(245, 245, 245);
            doc.rect(15, tableY - 5, 267, 7, 'F');
          }
          
          doc.text(formatDate(transaction.date), 20, tableY);
          
          // Truncate long descriptions
          const description = transaction.description.length > 40 
            ? transaction.description.substring(0, 40) + '...' 
            : transaction.description;
          
          doc.text(description, 60, tableY);
          doc.text(transaction.category, 160, tableY);
          
          // Right align and color the amount
          const amount = formatCurrency(transaction.amount);
          if (transaction.amount >= 0) {
            doc.setTextColor(0, 128, 0); // Green for positive
          } else {
            doc.setTextColor(255, 0, 0); // Red for negative
          }
          doc.text(amount, 260, tableY, { align: 'right' });
          doc.setTextColor(0, 0, 0); // Reset to black
          
          tableY += 7;
        });
      }
      
      // Add budget table if applicable
      if (reportType === 'budget' && reportData.data.length > 0) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Budget Details', 20, tableY);
        tableY += 8;
        
        // Table headers with colored background
        doc.setFillColor(220, 220, 220);
        doc.rect(15, tableY, 267, 7, 'F');
        
        doc.setFontSize(10);
        doc.text('Category', 20, tableY + 5);
        doc.text('Budget', 80, tableY + 5, { align: 'right' });
        doc.text('Actual', 120, tableY + 5, { align: 'right' });
        doc.text('Remaining', 160, tableY + 5, { align: 'right' });
        doc.text('% Used', 200, tableY + 5, { align: 'right' });
        doc.text('Status', 240, tableY + 5);
        
        tableY += 10;
        doc.setFont('helvetica', 'normal');
        
        // Table rows with alternating colors
        reportData.data.forEach((item, index) => {
          // Alternating row colors
          if (index % 2 === 1) {
            doc.setFillColor(245, 245, 245);
            doc.rect(15, tableY - 5, 267, 7, 'F');
          }
          
          const remaining = item.budget - item.actual;
          const percentUsed = ((item.actual / item.budget) * 100).toFixed(0);
          
          doc.text(item.category, 20, tableY);
          doc.text(formatCurrency(item.budget), 80, tableY, { align: 'right' });
          doc.text(formatCurrency(item.actual), 120, tableY, { align: 'right' });
          
          // Color the remaining amount
          if (remaining >= 0) {
            doc.setTextColor(0, 128, 0); // Green for positive
          } else {
            doc.setTextColor(255, 0, 0); // Red for negative
          }
          doc.text(formatCurrency(remaining), 160, tableY, { align: 'right' });
          doc.setTextColor(0, 0, 0); // Reset to black
          
          doc.text(`${percentUsed}%`, 200, tableY, { align: 'right' });
          
          // Status text
          let status = 'On Track';
          if (percentUsed > 90) {
            status = 'Critical';
            doc.setTextColor(255, 0, 0); // Red
          } else if (percentUsed > 75) {
            status = 'Warning';
            doc.setTextColor(255, 165, 0); // Orange
          }
          doc.text(status, 240, tableY);
          doc.setTextColor(0, 0, 0); // Reset to black
          
          tableY += 7;
        });
      }
      
      // Add footer to all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Add footer line
        doc.setDrawColor(200, 200, 200);
        doc.line(15, 190, 282, 190);
        
        // Add footer text
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Finance Management System - ${reportTitle}`, 148.5, 195, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, 282, 195, { align: 'right' });
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

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
  // Process API response data into consistent format
  const processReportData = (data, type) => {
    if (!data) return null;
    
    switch (type) {
      case 'transactions':
        return {
          ...data,
          summary: {
            ...data.summary,
            netAmount: (data.summary?.totalIncome || 0) - (data.summary?.totalExpenses || 0)
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
          data: data.data?.map(item => ({
            ...item,
            remaining: item.budget - item.actual,
            percentUsed: (item.actual / item.budget) * 100
          })) || []
        };
        
      default:
        return data;
    }
  };

  const handleGenerateReport = async () => {
    if (!currentUser) {
      navigate('/login', { state: { from: '/reports' } });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { startDate: start, endDate: end } = dateRange;
      const { search, categories, minAmount, maxAmount, transactionType, sortBy, sortOrder } = filters;
      
      // Validate dates
      if (new Date(start) > new Date(end)) {
        throw new Error('Start date cannot be after end date');
      }
      
      // Prepare API parameters
      const params = {
        startDate: format(new Date(start), 'yyyy-MM-dd'),
        endDate: format(new Date(end), 'yyyy-MM-dd'),
        search,
        categories: categories.join(','),
        minAmount,
        maxAmount,
        type: transactionType !== 'all' ? transactionType : undefined,
        sortBy,
        sortOrder
      };
      
      let response;
      
      switch(reportType) {
        case 'transactions':
        case 'income':
        case 'expenses':
          response = await getTransactionsReport({
            ...params,
            type: reportType === 'transactions' ? undefined : reportType
          });
          break;
          
        case 'budget':
          response = await getBudgetReport({
            month: new Date(start).getMonth() + 1,
            year: new Date(start).getFullYear(),
            categories: categories.join(',')
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

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
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
            <ExportMenu onExport={handleExportReport} />
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

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
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

// Helper function to generate chart colors
const generateChartColors = (count) => {
  const colors = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
    '#82ca9d', '#ffc658', '#ff7c43', '#665191', '#a05195',
    '#f95d6a', '#ffa600', '#003f5c', '#2f4b7c', '#665191'
  ];
  return colors.slice(0, count);
};

// Helper function to format currency with proper sign
const formatCurrencyWithSign = (value, type = 'expense') => {
  const absValue = Math.abs(value);
  const formatted = formatCurrency(absValue);
  return type === 'income' ? `+${formatted}` : `-${formatted}`;
};

export default ReportGenerator;
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Report Summary */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {reportType === 'transactions' && (
              <>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Transactions</Typography>
                    <Typography variant="h6" fontWeight="bold">{reportData.summary.totalTransactions}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Income</Typography>
                    <Typography variant="h6" fontWeight="bold" color="success.main">{formatCurrency(reportData.summary.totalIncome)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'error.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Expenses</Typography>
                    <Typography variant="h6" fontWeight="bold" color="error.main">{formatCurrency(reportData.summary.totalExpenses)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'info.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Net Amount</Typography>
                    <Typography variant="h6" fontWeight="bold" color={reportData.summary.netAmount >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(reportData.summary.netAmount)}
                    </Typography>
                  </Paper>
                </Grid>
              </>
            )}
            
            {reportType === 'income' && (
              <>
                <Grid item xs={12} sm={4}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Total Income</Typography>
                    <Typography variant="h6" fontWeight="bold" color="success.main">{formatCurrency(reportData.summary.totalIncome)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Income by Category</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {Object.entries(reportData.summary.incomeByCategory).map(([category, amount]) => (
                        <Chip 
                          key={category}
                          label={`${category}: ${formatCurrency(amount)}`}
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              </>
            )}
            
            {reportType === 'expenses' && (
              <>
                <Grid item xs={12} sm={4}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'error.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Total Expenses</Typography>
                    <Typography variant="h6" fontWeight="bold" color="error.main">{formatCurrency(reportData.summary.totalExpenses)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Paper elevation={1} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Expenses by Category</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {Object.entries(reportData.summary.expensesByCategory).map(([category, amount]) => (
                        <Chip 
                          key={category}
                          label={`${category}: ${formatCurrency(amount)}`}
                          color="error"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              </>
            )}
            
            {reportType === 'budget' && (
              <>
                <Grid item xs={12} sm={4}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Total Budget</Typography>
                    <Typography variant="h6" fontWeight="bold">{formatCurrency(reportData.summary.totalBudget)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'error.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Total Spent</Typography>
                    <Typography variant="h6" fontWeight="bold" color="error.main">{formatCurrency(reportData.summary.totalActual)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Remaining</Typography>
                    <Typography variant="h6" fontWeight="bold" color="success.main">{formatCurrency(reportData.summary.remaining)}</Typography>
                  </Paper>
                </Grid>
              </>
            )}
          </Grid>
          
          {/* Charts */}
          {reportType === 'expenses' && reportData.summary.chartData.length > 0 && (
            <Box sx={{ height: 300, mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>Expense Distribution</Typography>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.summary.chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {reportData.summary.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          )}
          
          {reportType === 'budget' && (
            <Box sx={{ height: 400, mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>Budget vs Actual Spending</Typography>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis tickFormatter={(value) => `₹${value/1000}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="budget" name="Budget" fill="#8884d8" />
                  <Bar dataKey="actual" name="Actual" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
          
          {/* Data Table */}
          {(reportType === 'transactions' || reportType === 'income' || reportType === 'expenses') && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>Detailed Transactions</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.data.length > 0 ? (
                      reportData.data.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <Chip 
                              label={transaction.category} 
                              size="small" 
                              color={transaction.amount > 0 ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ 
                            color: transaction.amount >= 0 ? 'success.main' : 'error.main',
                            fontWeight: 'medium'
                          }}>
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No transactions found for the selected period</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          
          {reportType === 'budget' && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>Budget Details</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Budget</TableCell>
                      <TableCell align="right">Actual</TableCell>
                      <TableCell align="right">Remaining</TableCell>
                      <TableCell align="right">% Used</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.data.map((item) => {
                      const remaining = item.budget - item.actual;
                      const percentUsed = (item.actual / item.budget) * 100;
                      
                      return (
                        <TableRow key={item.category}>
                          <TableCell>{item.category}</TableCell>
                          <TableCell align="right">{formatCurrency(item.budget)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.actual)}</TableCell>
                          <TableCell align="right" sx={{ color: remaining >= 0 ? 'success.main' : 'error.main' }}>
                            {formatCurrency(remaining)}
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`${percentUsed.toFixed(0)}%`} 
                              size="small" 
                              color={percentUsed > 90 ? 'error' : percentUsed > 75 ? 'warning' : 'success'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => window.print()} sx={{ mr: 2 }}>
              Print Report
            </Button>
            <Button variant="contained" onClick={handleDownloadPDF}>
              Download PDF
            </Button>
          </Box>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Report Generated
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a report type and date range, then click "Generate Report" to view your financial data.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ReportGenerator;