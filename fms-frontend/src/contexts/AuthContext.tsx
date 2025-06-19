import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { AuthContextType } from '../types/auth';

interface AuthProviderProps {
  children: ReactNode;
}

// Create and export the context
const AuthContext = createContext<AuthContextType | undefined>({
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  login: () => Promise.reject(new Error('Auth context not initialized')),
  signup: () => Promise.reject(new Error('Auth context not initialized')),
  logout: () => {},
  updateUser: () => {},
  clearError: () => {},
  isLoading: true,
  hasError: false
});

/**
 * Custom hook to access authentication context
 * @returns {AuthContextType} - The authentication context
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * AuthContext provider component that handles authentication state and actions.
 * @param {React.ReactNode} children - The children components to wrap with auth context.
 */
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<null | any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Retry configuration
  const retryConfig = {
    retries: 3,
    retryDelay: 1000,
    retryOn: [408, 500, 502, 503, 504],
  };

  // Enhanced API call with retry
  const makeApiCall = async <T,>(call: () => Promise<T>, retryCount = 0): Promise<T> => {
    try {
      const response = await call();
      return response;
    } catch (error) {
      const isRetryable = retryConfig.retryOn.includes(error.response?.status);
      if (retryCount < retryConfig.retries && isRetryable) {
        await new Promise(resolve => setTimeout(resolve, retryConfig.retryDelay * (retryCount + 1)));
        return makeApiCall(call, retryCount + 1);
      }
      throw error;
    }
  };

  // Load user from localStorage on initial load
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('fms_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to load user from localStorage:', error);
        localStorage.removeItem('fms_user');
        localStorage.removeItem('fms_token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function with enhanced error handling and retry
  const login = async (email: string, password: string): Promise<{
    success: boolean;
    user?: any;
    error?: string;
    status?: number;
  }> => {
    try {
      setLoading(true);
      setError(null);
      
      // Make the API call with retry mechanism
      const response = await makeApiCall(() => authAPI.login({ email, password }));
      
      // Validate response
      if (!response || !response.data) {
        throw new Error('No response data received from server');
      }

      // Validate required fields in response
      const { user, token } = response.data;
      if (!user || !token) {
        throw new Error('Invalid response format from server');
      }

      // Create user object with token
      const userWithToken = { ...user, token };
      
      // Store in localStorage with error handling
      try {
        localStorage.setItem('fms_user', JSON.stringify(userWithToken));
        localStorage.setItem('fms_token', token);
      } catch (storageError) {
        console.error('Failed to store user data:', storageError);
        throw new Error('Failed to store user data. Please try again.');
      }
      
      // Update state
      setUser(userWithToken);
      setIsAuthenticated(true);
      
      // Navigate to dashboard
      navigate('/dashboard');
      
      return { 
        success: true,
        user: userWithToken
      };
      
    } catch (error) {
      console.error('Login failed:', error);
      
      // Get error message from response
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         'An unexpected error occurred. Please try again.';
      
      // Log detailed error for debugging
      console.error('Login error details:', {
        message: errorMessage,
        status: error.response?.status,
        response: error.response?.data,
        timestamp: new Date().toISOString()
      });
      
      setError(errorMessage);
      toast.error(errorMessage);
      return { 
        success: false, 
        error: errorMessage,
        status: error.response?.status
      };
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (userData: any): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.signup(userData);
      
      if (response && response.data) {
        const { user: newUser, token } = response.data;
        
        // Store user data and token
        localStorage.setItem('fms_user', JSON.stringify(newUser));
        localStorage.setItem('fms_token', token);
        
        // Update state
        setUser(newUser);
        setIsAuthenticated(true);
        
        // Navigate to dashboard
        navigate('/dashboard');
        
        return { success: true };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Signup failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Signup failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Clear storage
    localStorage.removeItem('fms_user');
    localStorage.removeItem('fms_token');
    
    // Reset state
    setUser(null);
    setError(null);
    setIsAuthenticated(false);
    
    // Navigate to home
    navigate('/');
  };

  // Update user data
  const updateUser = (userData: Partial<any>): void => {
    const updatedUser = { ...user, ...userData };
    
    // Update storage
    localStorage.setItem('fms_user', JSON.stringify(updatedUser));
    
    // Update state
    setUser(updatedUser);
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      // Cleanup localStorage if component unmounts while loading
      if (loading) {
        localStorage.removeItem('fms_user');
        localStorage.removeItem('fms_token');
      }
    };
  }, [loading]);

  // Context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    signup,
    logout,
    updateUser,
    clearError: () => setError(null),
    isLoading: loading,
    hasError: !!error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

export { AuthContext, useAuth, AuthProvider };