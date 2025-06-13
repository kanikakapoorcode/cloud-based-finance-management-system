import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';

// Import custom theme
import theme from './theme';

// Import context providers
import { AuthProvider } from './contexts/AuthContext';

// Import pages
import Homepage from './pages/Homepage';
import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';
import PrivateRoute from './components/Auth/PrivateRoute';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider 
        maxSnack={3} 
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/auth/*" element={<AuthPage />} />
            <Route 
              path="/dashboard/*" 
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;