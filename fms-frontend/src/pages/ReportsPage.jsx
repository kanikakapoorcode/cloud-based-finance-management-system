import React from 'react';
import { Box } from '@mui/material';
import ReportGenerator from '../components/Reports/ReportGenerator';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

const ReportsPage = () => {
  const { user, loading } = useAuth();

  // If not logged in, redirect to login page
  if (!loading && !user) {
    return <Navigate to="/auth/login" />;
  }

  return (
    <Box>
      <ReportGenerator />
    </Box>
  );
};

export default ReportsPage;
