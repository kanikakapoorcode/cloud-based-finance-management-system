import React, { useState } from 'react';
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
  CircularProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';
import jsPDF from 'jspdf';

const ReportGenerator = () => {
  const [reportType, setReportType] = useState('transactions');
  const [startDate, setStartDate] = useState(new Date(2025, 4, 1)); // May 1, 2025
  const [endDate, setEndDate] = useState(new Date(2025, 4, 21)); // May 21, 2025
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  // Enhanced PDF download function with better formatting
  const handleDownloadPDF = () => {
    if (!reportData) {
      setError('No report data available to download');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get the report title based on report type
      let reportTitle = 'Financial Report';
      if (reportType === 'transactions') reportTitle = 'Transaction Report';
      if (reportType === 'income') reportTitle = 'Income Analysis';
      if (reportType === 'expenses') reportTitle = 'Expense Analysis';
      if (reportType === 'budget') reportTitle = 'Budget vs Actual';
      
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

  // Mock transaction data
  const mockTransactions = [
    { id: 1, date: '2025-05-18', description: 'Salary', amount: 45000, category: 'income' },
    { id: 2, date: '2025-05-10', description: 'Rent Payment', amount: -15000, category: 'housing' },
    { id: 3, date: '2025-05-21', description: 'Grocery Shopping', amount: -2450, category: 'food' },
    { id: 4, date: '2025-05-16', description: 'Restaurant Bill', amount: -1200, category: 'food' },
    { id: 5, date: '2025-05-14', description: 'Petrol', amount: -1500, category: 'transport' },
    { id: 6, date: '2025-05-08', description: 'Movie Tickets', amount: -800, category: 'entertainment' },
    { id: 7, date: '2025-05-05', description: 'Electricity Bill', amount: -2200, category: 'utilities' },
    { id: 8, date: '2025-05-03', description: 'Freelance Work', amount: 12000, category: 'income' },
    { id: 9, date: '2025-05-01', description: 'Online Shopping', amount: -3500, category: 'shopping' },
    { id: 10, date: '2025-04-28', description: 'Mobile Recharge', amount: -499, category: 'utilities' },
    { id: 11, date: '2025-04-25', description: 'Gym Membership', amount: -1800, category: 'other' },
    { id: 12, date: '2025-04-22', description: 'Birthday Gift', amount: -1000, category: 'other' }
  ];

  // Mock budget data
  const mockBudgetData = [
    { category: 'Housing', budget: 20000, actual: 15000 },
    { category: 'Food', budget: 8000, actual: 3650 },
    { category: 'Transport', budget: 5000, actual: 3000 },
    { category: 'Entertainment', budget: 5000, actual: 4500 },
    { category: 'Utilities', budget: 3000, actual: 2699 },
    { category: 'Shopping', budget: 4000, actual: 3500 },
    { category: 'Other', budget: 3000, actual: 2800 }
  ];

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  const handleGenerateReport = () => {
    setLoading(true);
    setError(null);
    
    // Simulate API call delay
    setTimeout(() => {
      try {
        // Filter transactions based on date range
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        if (startDateObj > endDateObj) {
          throw new Error('Start date cannot be after end date');
        }
        
        const filteredTransactions = mockTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= startDateObj && transactionDate <= endDateObj;
        });
        
        // Generate different reports based on type
        let reportResult;
        
        switch(reportType) {
          case 'transactions':
            reportResult = {
              type: 'transactions',
              data: filteredTransactions,
              summary: {
                totalTransactions: filteredTransactions.length,
                totalIncome: filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
                totalExpenses: Math.abs(filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)),
                netAmount: filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
              }
            };
            break;
            
          case 'income':
            const incomeTransactions = filteredTransactions.filter(t => t.amount > 0);
            reportResult = {
              type: 'income',
              data: incomeTransactions,
              summary: {
                totalIncome: incomeTransactions.reduce((sum, t) => sum + t.amount, 0),
                incomeByCategory: incomeTransactions.reduce((acc, t) => {
                  acc[t.category] = (acc[t.category] || 0) + t.amount;
                  return acc;
                }, {})
              }
            };
            break;
            
          case 'expenses':
            const expenseTransactions = filteredTransactions.filter(t => t.amount < 0);
            const expensesByCategory = expenseTransactions.reduce((acc, t) => {
              acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
              return acc;
            }, {});
            
            reportResult = {
              type: 'expenses',
              data: expenseTransactions,
              summary: {
                totalExpenses: Math.abs(expenseTransactions.reduce((sum, t) => sum + t.amount, 0)),
                expensesByCategory: expensesByCategory,
                chartData: Object.entries(expensesByCategory).map(([category, amount]) => ({
                  name: category,
                  value: amount
                }))
              }
            };
            break;
            
          case 'budget':
            reportResult = {
              type: 'budget',
              data: mockBudgetData,
              summary: {
                totalBudget: mockBudgetData.reduce((sum, item) => sum + item.budget, 0),
                totalActual: mockBudgetData.reduce((sum, item) => sum + item.actual, 0),
                remaining: mockBudgetData.reduce((sum, item) => sum + (item.budget - item.actual), 0)
              }
            };
            break;
            
          default:
            reportResult = { type: 'unknown', data: [] };
        }
        
        setReportData(reportResult);
      } catch (err) {
        console.error('Error generating report:', err);
        setError(err.message || 'Failed to generate report');
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Financial Reports
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom fontWeight="medium" color="primary">
          Generate Report
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
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
          
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleGenerateReport}
              size="large"
              disabled={loading}
              sx={{ mt: 1 }}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Generating your report...</Typography>
        </Paper>
      ) : reportData ? (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="medium">
              {reportType === 'transactions' && 'Transaction Report'}
              {reportType === 'income' && 'Income Analysis'}
              {reportType === 'expenses' && 'Expense Analysis'}
              {reportType === 'budget' && 'Budget vs Actual'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(startDate)} - {formatDate(endDate)}
            </Typography>
          </Box>
          
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