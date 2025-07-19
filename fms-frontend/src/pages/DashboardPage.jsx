// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress, Container, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Sidebar from '../components/Dashboard/Sidebar';

const DashboardPage = () => {
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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box sx={{ display: 'flex', flexGrow: 1, pt: 8 }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Alerts */}
            {alerts.length > 0 && (
              <Box sx={{ mb: 3 }}>
                {alerts.map(alert => (
                  <Alert key={alert.id} severity={alert.type} sx={{ mb: 2 }}>
                    {alert.message}
                  </Alert>
                ))}
              </Box>
            )}
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardPage;