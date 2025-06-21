import React, { 
  createContext, 
  useState, 
  useEffect, 
  useContext, 
  ReactNode, 
  useCallback,
  useMemo 
} from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import { toast } from 'react-hot-toast';
import { AuthContextType } from '../types/auth';

interface AuthProviderProps {
  children: ReactNode;
}

// Create and export the context
const defaultContext: AuthContextType = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  token: null,
  login: () => Promise.reject(new Error('Auth context not initialized')),
  signup: () => Promise.reject(new Error('Auth context not initialized')),
  logout: () => {},
  updateUser: () => {},
  clearError: () => {},
  clearAuthData: () => {},
  isLoading: true,
  hasError: false
};

const AuthContext = createContext<AuthContextType | undefined>(defaultContext);

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
  const [token, setToken] = useState<string | null>(null);
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

  // Clear authentication data
  const clearAuthData = useCallback(() => {
    console.log('🧹 Clearing authentication data...');
    localStorage.removeItem('fms_user');
    localStorage.removeItem('fms_token');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  // Load user from localStorage on initial load
  useEffect(() => {
    let isMounted = true;
    
    const loadUser = async () => {
      console.log('🔄 Starting initial auth check...');
      
      try {
        console.log('🔍 Loading user from localStorage...');
        const storedToken = localStorage.getItem('fms_token');
        const storedUser = localStorage.getItem('fms_user');
        
        console.log('🔑 Stored token exists:', !!storedToken);
        console.log('👤 Stored user exists:', !!storedUser);
        
        if (storedToken && storedUser) {
          try {
            console.log('🔄 Parsing user data...');
            const userData = JSON.parse(storedUser);
            
            console.log('✅ Parsed user data:', { 
              hasToken: !!userData.token, 
              tokenMatch: userData.token === storedToken,
              userId: userData._id,
              email: userData.email
            });
            
            // Verify token is present and matches
            if (userData.token && userData.token === storedToken) {
              console.log('🔐 Valid token found, verifying with server...');
              
              try {
                // Get current user to verify token
                const userData = await authService.getCurrentUser();
                
                if (isMounted) {
                  console.log('✅ Token verified with server:', userData);
                  
                  // If we get here, token is valid
                  console.log('🔓 Setting user as authenticated');
                  setUser(userData);
                  setToken(storedToken);
                  setIsAuthenticated(true);
                  
                  console.log('✅ User authenticated:', { 
                    id: userData._id, 
                    email: userData.email,
                    name: userData.name
                  });
                }
              } catch (verifyError) {
                if (isMounted) {
                  console.error('❌ Token verification failed:', verifyError);
                  console.log('🔄 Token is invalid or expired, clearing auth data');
                  clearAuthData();
                }
              }
            } else if (isMounted) {
              console.warn('⚠️ Token mismatch or missing, clearing auth data');
              clearAuthData();
            }
          } catch (parseError) {
            if (isMounted) {
              console.error('❌ Error parsing user data:', parseError);
              clearAuthData();
            }
          }
        } else if (isMounted) {
          console.log('ℹ️ No stored user or token found');
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('❌ Failed to load user from localStorage:', error);
          clearAuthData();
        }
      } finally {
        if (isMounted && loading) {
          console.log('🏁 Finished initial auth check');
          setLoading(false);
        }
      }
    };
    
    loadUser();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [loading, clearAuthData]);

  // Login function with enhanced error handling and state management
  const login = async (email: string, password: string): Promise<{
    success: boolean;
    user?: any;
    token?: string;
    error?: string;
    status?: number;
  }> => {
    console.log('🔑 Starting login process...');
    console.log('📧 Email:', email);
    
    // Reset any previous errors
    setError(null);
    setLoading(true);
    
    try {
      // Make the API call
      console.log('📡 Sending login request to server...');
      const response = await authService.login({ email, password });
      
      // Log response details
      console.log('✅ Login API Response:', {
        status: response?.status,
        hasData: !!response?.data,
        hasError: !!response?.data?.error
      });
      
      // Handle case where response is the data directly (common with axios)
      const responseData = response?.data || response;
      
      // Log response data structure
      console.log('🔍 Processing response data:', {
        hasData: !!responseData,
        hasUserData: !!(responseData?.data?.user && responseData?.data?.token),
        dataStructure: Object.keys(responseData || {})
      });
      
      if (!responseData) {
        const errorMsg = '❌ No response data received from server';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Check for error in response
      if (responseData.error) {
        const errorMsg = `❌ Error in response: ${responseData.error}`;
        console.error(errorMsg);
        throw new Error(responseData.error);
      }
      
      // Extract data from response (handle both nested and direct data)
      const data = responseData.data || responseData;
      
      if (!data || !data.user || !data.token) {
        const errorMsg = `❌ Invalid response format: ${JSON.stringify(responseData).substring(0, 200)}`;
        console.error(errorMsg);
        throw new Error('Invalid response format from server');
      }

      const { user, token } = data;
      
      // Log user data (safely)
      console.log('👤 User data received:', { 
        id: user?._id, 
        email: user?.email,
        hasToken: !!token,
        tokenLength: token?.length || 0
      });
      
      if (!token) {
        throw new Error('No authentication token received');
      }
      
      // Create user object with token
      const userWithToken = { ...user, token };
      
      try {
        console.log('💾 Storing auth data in localStorage...');
        
        // Clear any existing auth data
        localStorage.removeItem('fms_user');
        localStorage.removeItem('fms_token');
        
        // Store new auth data
        localStorage.setItem('fms_token', token);
        localStorage.setItem('fms_user', JSON.stringify(userWithToken));
        
        console.log('✅ Auth data stored in localStorage');
        
        // Verify storage
        const storedToken = localStorage.getItem('fms_token');
        const storedUser = localStorage.getItem('fms_user');
        
        console.log('🔍 Verifying storage:', {
          tokenStored: !!storedToken,
          userStored: !!storedUser,
          tokenMatch: storedToken === token,
          userMatch: storedUser ? JSON.parse(storedUser)?.email === user?.email : false
        });
        
        if (!storedToken || storedToken !== token) {
          throw new Error('Failed to store authentication token');
        }
        
        // Update state after successful storage
        console.log('🔄 Updating auth state...');
        
        // Update all state in a single batch
        setUser(userWithToken);
        setToken(token);
        setIsAuthenticated(true);
        setLoading(false);
        
        // Force a state update to ensure React picks up the changes
        setTimeout(() => {
          console.log('✅ Auth state updated, forcing re-render');
          window.dispatchEvent(new Event('storage'));
        }, 0);
        
        console.log('✅ User authenticated, preparing navigation to dashboard');
        
        // Navigate to dashboard
        navigate('/dashboard', { 
          replace: true,
          state: { 
            from: '/login',
            timestamp: new Date().toISOString()
          } 
        });
        
        // Return success response
        return {
          success: true,
          user: userWithToken,
          token
        };
        
      } catch (storageError) {
        console.error('❌ Storage error:', storageError);
        // Clear potentially corrupted data
        localStorage.removeItem('fms_user');
        localStorage.removeItem('fms_token');
        
        throw new Error('Failed to store authentication data');
      }
      
    } catch (error: unknown) {
      // Handle different types of errors
      let errorMessage = 'Login failed. Please try again.';
      let status: number | undefined;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('❌ Login error:', error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Handle Axios error response
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: any } };
        status = axiosError.response?.status;
        
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
      
      // Log detailed error for debugging
      console.error('Login error details:', {
        message: errorMessage,
        status,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        success: false,
        error: errorMessage,
        status
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
      
      console.log('📝 Starting signup process...');
      const response = await authService.signup(userData);
      
      if (response && response.user) {
        const { user: newUser, token } = response;
        
        console.log('✅ Signup successful, storing user data...');
        // Store user data and token
        localStorage.setItem('fms_user', JSON.stringify(newUser));
        localStorage.setItem('fms_token', token);
        
        // Update state
        setUser(newUser);
        setToken(token);
        setIsAuthenticated(true);
        
        console.log('✅ User registered and authenticated, navigating to dashboard...');
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
  const contextValue = useMemo(() => ({
    user,
    loading,
    error,
    isAuthenticated,
    token,
    login,
    signup,
    logout,
    updateUser,
    clearError: () => setError(null),
    clearAuthData,
    // Alias for loading to match MUI's naming convention
    isLoading: loading,
    hasError: !!error,
  }), [user, loading, error, isAuthenticated, token, login, signup, logout, updateUser, clearAuthData]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

export { AuthContext, useAuth, AuthProvider };