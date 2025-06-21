// src/components/Auth/PrivateRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

const PrivateRoute = ({ children, requiredRoles = [] }) => {
  const { user, isAuthenticated, loading, token } = useAuth();
  const location = useLocation();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [authStatus, setAuthStatus] = useState('checking');
  
  // Log authentication state changes
  useEffect(() => {
    console.log('🔐 Auth state changed:', { 
      isAuthenticated, 
      hasUser: !!user,
      hasToken: !!token,
      loading,
      path: location.pathname,
      from: location.state?.from?.pathname
    });
    
    // Update auth status based on current state
    if (loading) {
      setAuthStatus('loading');
    } else if (isAuthenticated && user) {
      // Check if user has required roles if any are specified
      if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => 
          user.roles?.includes(role)
        );
        
        if (!hasRequiredRole) {
          setAuthStatus('unauthorized');
          return;
        }
      }
      setAuthStatus('authenticated');
    } else {
      setAuthStatus('unauthenticated');
    }
  }, [isAuthenticated, user, loading, location, token, requiredRoles]);

  // Check authentication status on mount
  useEffect(() => {
    console.log('🚀 PrivateRoute mounted, starting auth check...');
    
    // Small delay to ensure auth state is properly set
    const timer = setTimeout(() => {
      console.log('✅ Auth check completed:', { 
        status: authStatus,
        isAuthenticated, 
        hasUser: !!user,
        hasToken: !!token,
        loading,
        path: location.pathname
      });
      setIsAuthChecked(true);
    }, 300);

    return () => {
      console.log('🧹 Cleaning up PrivateRoute');
      clearTimeout(timer);
    };
  }, [isAuthenticated, user, loading, location.pathname, authStatus, token]);

  // Show loading state while checking authentication
  if (loading || !isAuthChecked || authStatus === 'loading') {
    console.log('⏳ Showing loading state...');
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body1" color="textSecondary">
          Verifying your session...
        </Typography>
      </Box>
    );
  }

  // Check if user has required role
  if (authStatus === 'unauthorized') {
    console.warn('⛔ User does not have required role:', { 
      requiredRoles,
      userRoles: user?.roles || [] 
    });
    
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ 
          from: location,
          message: 'You do not have permission to access this page.',
          requiredRoles,
          userRoles: user?.roles || []
        }} 
        replace 
      />
    );
  }

  // If authenticated, render the children
  if (authStatus === 'authenticated') {
    console.log('✅ User is authenticated, rendering protected content');
    return children;
  }

  // If not authenticated, redirect to login
  console.log('🔒 User not authenticated, redirecting to login');
  console.log('📌 Redirecting to login from:', location.pathname);
  
  // Store the intended destination before redirecting to login
  const returnTo = location.pathname !== '/auth/login' 
    ? { from: location.pathname + (location.search || '') }
    : {};
  
  return (
    <Navigate 
      to={
        location.pathname.startsWith('/auth/') 
          ? location.pathname 
          : '/auth/login'
      }
      state={{ 
        ...returnTo,
        message: 'Please log in to access this page.',
        redirectReason: 'not_authenticated'
      }} 
      replace 
    />
  );
};

export default PrivateRoute;