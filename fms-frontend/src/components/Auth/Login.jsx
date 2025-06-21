import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Grid,
  Link as MuiLink,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Stack,
  Fade
} from '@mui/material';
import { Visibility, VisibilityOff, Google, GitHub, Facebook } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from './AuthLayout';
import { motion } from 'framer-motion';

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required')
});

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, loading, error: authError, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Log authentication state changes
  useEffect(() => {
    console.log('🔐 Login component auth state:', { 
      isAuthenticated, 
      loading,
      authError: authError,
      locationState: location.state
    });
  }, [isAuthenticated, loading, authError, location.state]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      console.log('🔄 User is authenticated, redirecting to:', from);
      navigate(from, { 
        replace: true,
        state: { 
          from: '/login',
          timestamp: new Date().toISOString()
        }
      });
    }
  }, [isAuthenticated, navigate, location]);

  const formik = useFormik({
    initialValues: {
      email: location.state?.email || '',
      password: ''
    },
    validationSchema: LoginSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      const handleSubmit = async (formValues) => {
        console.log('🔐 Login form submitted:', { email: formValues.email });
        
        try {
          setSubmitError('');
          setLoginSuccess(false);
          setIsSubmitting(true);
          
          const { email, password } = formValues;
          console.log('📤 Sending login request...');
          
          const result = await login(email, password);
          
          if (result.success) {
            console.log('✅ Login successful, user data:', {
              id: result.user?._id,
              email: result.user?.email
            });
            setLoginSuccess(true);
            
            // Show success message briefly before redirect
            setTimeout(() => {
              const from = location.state?.from?.pathname || '/dashboard';
              console.log('🔄 Redirecting to:', from);
              navigate(from, { 
                replace: true,
                state: { 
                  from: '/login',
                  timestamp: new Date().toISOString()
                }
              });
            }, 500);
          } else {
            const errorMsg = result.error || 'Login failed. Please check your credentials and try again.';
            console.error('❌ Login failed:', errorMsg);
            setSubmitError(errorMsg);
            
            // Highlight the relevant fields
            if (errorMsg.toLowerCase().includes('email')) {
              setFieldError('email', errorMsg);
            } else if (errorMsg.toLowerCase().includes('password')) {
              setFieldError('password', errorMsg);
            }
          }
        } catch (error) {
          console.error('❌ Login error:', {
            message: error.message,
            status: error.status,
            response: error.response
          });
          
          let errorMessage = 'An unexpected error occurred. Please try again.';
          
          // Handle different error cases
          if (error.response) {
            // Server responded with an error status code
            if (error.response.status === 401) {
              errorMessage = 'Invalid email or password. Please try again.';
            } else if (error.response.status >= 500) {
              errorMessage = 'Server error. Please try again later.';
            } else if (error.response.data?.error) {
              errorMessage = error.response.data.error;
            }
          } else if (error.request) {
            // Request was made but no response was received
            errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          } else {
            errorMessage = error.message || errorMessage;
          }
          
          setSubmitError(errorMessage);
          
          // Highlight the relevant fields
          if (errorMessage.toLowerCase().includes('email')) {
            setFieldError('email', errorMessage);
          } else if (errorMessage.toLowerCase().includes('password')) {
            setFieldError('password', errorMessage);
          }
        } finally {
          setSubmitting(false);
          setIsSubmitting(false);
        }
      };
      
      handleSubmit(values);
    }
  });

  // Social login providers
  const socialProviders = [
    { name: 'Google', icon: <Google />, color: '#DB4437' },
    { name: 'GitHub', icon: <GitHub />, color: '#333' },
    { name: 'Facebook', icon: <Facebook />, color: '#4267B2' },
  ];

  const handleSocialLogin = (provider) => {
    console.log(`Logging in with ${provider}`);
    // Implement social login logic here
  };

  return (
    <AuthLayout 
      title="Welcome Back"
      subtitle="Sign in to your CloudFin account to manage your finances with ease."
    >
      <Box component="div" sx={{ width: '100%' }}>
        {/* Status Alerts */}
        <Fade in={!!submitError}>
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2, alignItems: 'center' }}
            onClose={() => setSubmitError('')}
          >
            {submitError}
          </Alert>
        </Fade>
        
        <Fade in={loginSuccess}>
          <Alert 
            severity="success" 
            sx={{ mb: 3, borderRadius: 2, alignItems: 'center' }}
          >
            Login successful! Redirecting...
          </Alert>
        </Fade>
        
        <Fade in={!!authError && !submitError}>
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2, alignItems: 'center' }}
            onClose={() => {}}
          >
            {authError}
          </Alert>
        </Fade>
        
        {/* Social Login Buttons */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          {socialProviders.map((provider) => (
            <Button
              key={provider.name}
              fullWidth
              variant="outlined"
              startIcon={provider.icon}
              onClick={() => handleSocialLogin(provider.name.toLowerCase())}
              sx={{
                py: 1.5,
                borderRadius: 2,
                borderColor: 'divider',
                color: 'text.primary',
                textTransform: 'none',
                '&:hover': {
                  borderColor: provider.color,
                  color: provider.color,
                  backgroundColor: `${provider.color}08`,
                },
              }}
            >
              Continue with {provider.name}
            </Button>
          ))}
        </Stack>
        
        <Divider sx={{ my: 3, color: 'text.secondary', '&:before, &:after': { borderColor: 'divider' } }}>
          <Typography variant="body2" color="text.secondary">OR</Typography>
        </Divider>
        
        <Box 
          component="form" 
          onSubmit={formik.handleSubmit} 
          sx={{ width: '100%' }}
          noValidate
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              disabled={loading || isSubmitting}
              variant="outlined"
              size="medium"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'divider',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: '1px',
                  },
                },
              }}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              disabled={loading || isSubmitting}
              variant="outlined"
              size="medium"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'divider',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: '1px',
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </motion.div>

          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !formik.isValid || formik.isSubmitting || isSubmitting}
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.3)',
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '&.Mui-disabled': {
                  background: '#e0e0e0',
                  color: '#9e9e9e',
                },
              }}
            >
              {(loading || isSubmitting) ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Sign In'
              )}
            </Button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Grid container justifyContent="space-between" sx={{ mt: 2 }}>
              <Grid item>
                <MuiLink 
                  component={Link} 
                  to="/auth/forgot-password" 
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'none',
                    '&:hover': {
                      color: 'primary.main',
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Forgot password?
                </MuiLink>
              </Grid>
              <Grid item>
                <Typography variant="body2" component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                  Don't have an account?
                </Typography>
                <MuiLink 
                  component={Link} 
                  to="/auth/signup" 
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign Up
                </MuiLink>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                By signing in, you agree to our{' '}
                <MuiLink href="#" color="primary" sx={{ fontWeight: 500 }}>Terms of Service</MuiLink> and{' '}
                <MuiLink href="#" color="primary" sx={{ fontWeight: 500 }}>Privacy Policy</MuiLink>.
              </Typography>
            </Box>
          </motion.div>
        </Box>
      </Box>
    </AuthLayout>
  );
};

// Add animation variants for page transitions
Login.getLayout = (page) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    {page}
  </motion.div>
);