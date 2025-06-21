import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  CircularProgress, 
  Grid,
  Alert,
  Link as MuiLink,
  Divider,
  Stack,
  Fade,
  IconButton,
  InputAdornment
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  PersonOutline, 
  EmailOutlined, 
  LockOutlined,
  Google,
  GitHub,
  Facebook
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from './AuthLayout';

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Enter a valid email').required('Email is required'),
    password: Yup.string()
      .min(6, 'Password should be at least 6 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm Password is required')
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError('');
        
        // Remove confirmPassword as it's not needed in the API call
        const { confirmPassword, ...userData } = values;
        
        // Call the signup API
        const response = await authAPI.signup(userData);
        
        console.log('Signup successful:', response.data);
        setSuccess(true);
        
        // Log the user in automatically after successful registration
        await login(values.email, values.password);
        
        // Redirect to dashboard after 1 second to show the success message briefly
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } catch (err) {
        console.error('Signup error:', err);
        setError(err.response?.data?.error || 'Failed to register. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  // Social login providers
  const socialProviders = [
    { name: 'Google', icon: <Google />, color: '#DB4437' },
    { name: 'GitHub', icon: <GitHub />, color: '#333' },
    { name: 'Facebook', icon: <Facebook />, color: '#4267B2' },
  ];

  const handleSocialSignup = (provider) => {
    console.log(`Signing up with ${provider}`);
    // Implement social signup logic here
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join CloudFin today and take control of your financial future with our powerful tools."
    >
      <Box 
        component="div" 
        sx={{ 
          width: '100%',
          maxWidth: 500,
          mx: 'auto',
          px: { xs: 0, sm: 2 },
        }}
      >
        <Fade in={!!error}>
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2, alignItems: 'center' }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        </Fade>
        
        <Fade in={success}>
          <Alert 
            severity="success" 
            sx={{ mb: 3, borderRadius: 2, alignItems: 'center' }}
          >
            Registration successful! Redirecting to dashboard...
          </Alert>
        </Fade>
        
        {/* Social Signup Buttons */}
        <Stack spacing={2} sx={{ 
          mb: 3,
          '& .MuiButton-root': {
            py: 1.5,
            fontSize: { xs: '0.875rem', sm: '1rem' },
          },
        }}>
          {socialProviders.map((provider) => (
            <Button
              key={provider.name}
              fullWidth
              variant="outlined"
              startIcon={provider.icon}
              onClick={() => handleSocialSignup(provider.name.toLowerCase())}
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
              Sign up with {provider.name}
            </Button>
          ))}
        </Stack>
        
        <Divider 
          sx={{ 
            my: 3, 
            color: 'text.secondary', 
            '&:before, &:after': { 
              borderColor: 'divider',
              width: { xs: '30%', sm: '40%' },
            },
          }}
        >
          <Typography variant="body2" color="text.secondary">OR</Typography>
        </Divider>
        
        <Box component="form" onSubmit={formik.handleSubmit} noValidate>
          <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              style={{ width: '100%' }}
            >
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Full Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                disabled={loading}
                variant="outlined"
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutline color={formik.touched.name ? 'primary' : 'action'} />
                    </InputAdornment>
                  ),
                }}
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
              transition={{ duration: 0.3, delay: 0.15 }}
              style={{ width: '100%' }}
            >
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled={loading}
                variant="outlined"
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined color={formik.touched.email ? 'primary' : 'action'} />
                    </InputAdornment>
                  ),
                }}
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
              style={{ width: '100%' }}
            >
              <TextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                disabled={loading}
                variant="outlined"
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined color={formik.touched.password ? 'primary' : 'action'} />
                    </InputAdornment>
                  ),
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
              transition={{ duration: 0.3, delay: 0.25 }}
              style={{ width: '100%' }}
            >
              <TextField
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                disabled={loading}
                variant="outlined"
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined color={formik.touched.confirmPassword ? 'primary' : 'action'} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
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
              transition={{ duration: 0.3, delay: 0.3 }}
              style={{ width: '100%' }}
            >
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !formik.isValid || formik.isSubmitting}
                sx={{
                  mt: 1,
                  mb: 2,
                  py: { xs: 1.25, sm: 1.5 },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: { xs: '0.9375rem', sm: '1rem' },
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #9c27b0 30%, #e91e63 90%)',
                  boxShadow: '0 4px 12px rgba(156, 39, 176, 0.2)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(156, 39, 176, 0.3)',
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
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Create Account'
                )}
              </Button>
              
              <Box mt={3} textAlign="center" sx={{ width: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <MuiLink 
                    component={Link} 
                    to="/auth/login" 
                    sx={{
                      fontWeight: 600,
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Sign in
                  </MuiLink>
                </Typography>
                
                <Box sx={{ 
                  mt: 3, 
                  textAlign: 'center',
                  px: { xs: 1, sm: 0 },
                  '& .MuiTypography-caption': {
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    lineHeight: 1.4,
                  },
                }}>
                  <Typography variant="caption" color="text.secondary">
                    By signing up, you agree to our{' '}
                    <MuiLink href="#" color="primary" sx={{ fontWeight: 500 }}>Terms of Service</MuiLink> and{' '}
                    <MuiLink href="#" color="primary" sx={{ fontWeight: 500 }}>Privacy Policy</MuiLink>.
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          </Grid>
        </Box>
      </Box>
    </AuthLayout>
  );
};

// Add animation variants for page transitions
Signup.getLayout = (page) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    {page}
  </motion.div>
);

export default Signup;
