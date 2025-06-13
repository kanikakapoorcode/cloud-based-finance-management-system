// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import MainPanel from '../components/Dashboard/MainPanel';
import Sidebar from '../components/Dashboard/Sidebar';
import BudgetOverview from '../components/Budget/BudgetOverview';
import BudgetSetup from '../components/Budget/BudgetSetup';
import TransactionsPage from './TransactionsPage';
import ReportsPage from './ReportsPage';

// Alert component for displaying notifications
const Alert = ({ type, message }) => {
  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        mb: 2, 
        bgcolor: type === 'warning' ? 'warning.light' : 'info.light',
        color: type === 'warning' ? 'warning.dark' : 'info.dark',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeft: `4px solid ${type === 'warning' ? 'warning.main' : 'info.main'}`
      }}
    >
      <Typography variant="body2">{message}</Typography>
    </Paper>
  );
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);

  // Load alerts or notifications
  useEffect(() => {
    // Example alerts - replace with actual API calls
    setAlerts([
      { id: 1, type: 'warning', message: 'You are close to your monthly budget limit.' },
      { id: 2, type: 'info', message: 'Remember to categorize your recent transactions.' }
    ]);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 0, overflow: 'auto' }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {/* Alerts */}
          {alerts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              {alerts.map(alert => (
                <Alert key={alert.id} type={alert.type} message={alert.message} />
              ))}
            </Box>
          )}
          
          {/* Main content routes */}
          <Routes>
            <Route path="" element={<MainPanel />} />
            <Route path="transactions/*" element={<TransactionsPage />} />
            <Route path="budget" element={<BudgetOverview />} />
            <Route path="budget/setup" element={<BudgetSetup />} />
            <Route path="reports/*" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="" replace />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
}