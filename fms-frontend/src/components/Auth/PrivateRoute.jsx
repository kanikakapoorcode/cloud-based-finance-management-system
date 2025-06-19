// src/components/Auth/PrivateRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    // Show a centered loading spinner while checking auth state
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }
  
  // If not authenticated, redirect to login with the return URL
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  
  return children;
};

export default PrivateRoute;