// src/pages/TransactionsPage.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from '@mui/material';
import TransactionList from '../components/Transactions/TransactionList';
import AddTransaction from '../components/Transactions/AddTransaction';
import { useAuth } from '../hooks/useAuth';

const TransactionsPage = () => {
  const { user, loading } = useAuth();

  // Redirect to login if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth/login" />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Routes>
        <Route index element={<TransactionList />} />
        <Route path="add" element={<AddTransaction />} />
        <Route path="*" element={<Navigate to="/dashboard/transactions" />} />
      </Routes>
    </Container>
  );
};

export default TransactionsPage;
