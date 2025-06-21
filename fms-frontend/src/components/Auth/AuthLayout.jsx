import { Box, Container, Typography, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const AuthLayout = ({ children, title, subtitle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative elements */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '50%',
          height: '50%',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, rgba(25, 118, 210, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)',
          zIndex: 0,
        }}
      />
      
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, rgba(25, 118, 210, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <Box
        component="header"
        sx={{
          py: 3,
          px: { xs: 2, sm: 4 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box
          component={Link}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <AccountBalanceIcon 
            sx={{ 
              mr: 1, 
              color: 'primary.main', 
              fontSize: 32,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'rotate(-10deg)',
              }
            }} 
          />
          <Typography
            variant="h6"
            component="span"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            CloudFin
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Typography
            component={Link}
            to="/auth/login"
            sx={{
              textDecoration: 'none',
              color: 'text.primary',
              fontWeight: title === 'Sign In' ? 700 : 400,
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            Sign In
          </Typography>
          <Typography
            component={Link}
            to="/auth/signup"
            sx={{
              textDecoration: 'none',
              color: 'text.primary',
              fontWeight: title === 'Create Account' ? 700 : 400,
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            Sign Up
          </Typography>
        </Box>
      </Box>

      {/* Main content */}
      <Container
        component="main"
        maxWidth="lg"
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          py: { xs: 4, sm: 6 },
          px: { xs: 2, sm: 3, md: 4 },
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '100%',
          margin: '0 auto',
        }}
      >
        {/* Left side - Content */}
        <Box
          sx={{
            flex: 1,
            maxWidth: 600,
            pr: isMobile ? 0 : { md: 4 },
            pl: isMobile ? 0 : { xs: 2, sm: 3, md: 0 },
            textAlign: isMobile ? 'center' : 'left',
            mb: isMobile ? 4 : 0,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: isMobile ? 'center' : 'flex-start',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: '2.25rem', sm: '3rem', md: '3.5rem' },
                lineHeight: 1.2,
                background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h5"
              component="h2"
              sx={{
                color: 'text.secondary',
                mb: 4,
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                lineHeight: 1.6,
              }}
            >
              {subtitle}
            </Typography>
            
            {/* Features list */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
                mb: 4,
              }}
            >
              {[
                'AI-powered financial insights',
                'Secure & encrypted transactions',
                'Real-time expense tracking',
                'Custom budget planning'
              ].map((feature, index) => (
                <Box
                  key={index}
                  component={motion.div}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.5,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  >
                    ✓
                  </Box>
                  <Typography variant="body2">
                    {feature}
                  </Typography>
                </Box>
              ))}
            </Box>
          </motion.div>
        </Box>

        {/* Right side - Form */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          sx={{
            width: '100%',
            maxWidth: 500,
            minWidth: { xs: '100%', sm: 400 },
            bgcolor: 'background.paper',
            borderRadius: 4,
            boxShadow: 3,
            p: { xs: 2.5, sm: 3.5, md: 4 },
            position: 'relative',
            overflow: 'hidden',
            alignSelf: 'stretch',
            display: 'flex',
            flexDirection: 'column',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #1976d2 0%, #9c27b0 100%)',
            },
            '@media (max-width: 600px)': {
              boxShadow: 'none',
              p: 2,
              bgcolor: 'transparent',
              '&::before': {
                display: 'none',
              },
            },
          }}
        >
          {children}
        </Box>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: { xs: 2, sm: 4 },
          textAlign: 'center',
          color: 'text.secondary',
          fontSize: '0.875rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Typography variant="body2">
          © {new Date().getFullYear()} CloudFin. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthLayout;