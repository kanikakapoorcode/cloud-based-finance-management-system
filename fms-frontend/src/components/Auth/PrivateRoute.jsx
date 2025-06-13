// src/components/Auth/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    // Return a loading indicator if auth state is still loading
    return <div>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/auth/login" />;
};

export default PrivateRoute;