import { Button, Typography, Box, Container, AppBar, Toolbar, useScrollTrigger, Slide, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

// Custom components
import FeatureSection from '../components/Home/FeatureSection';
import Footer from '../components/Home/Footer';

const Homepage = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar 
        position="fixed" 
        elevation={trigger ? 4 : 0}
        sx={{
          backgroundColor: 'background.paper',
          color: 'text.primary',
          transition: 'all 0.3s ease',
          borderBottom: trigger ? 'none' : '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ height: 70, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
              <AccountBalanceIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: { xs: 'none', md: 'block' }
                }}
              >
                CloudFin
              </Typography>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
              <Button 
                color="inherit" 
                component={Link} 
                to="/auth/login"
                sx={{ textTransform: 'none', fontWeight: 500 }}
              >
                Login
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/auth/signup"
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  boxShadow: '0 4px 14px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Sign Up
              </Button>
            </Box>

            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflowX: 'hidden'
        }}
      >
        {/* Hero Section */}
        <Box 
          component="section" 
          sx={{ 
            width: '100%',
            py: { xs: 8, md: 12 },
            bgcolor: 'background.default',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Container 
            maxWidth="lg" 
            sx={{ 
              px: { xs: 3, sm: 4, md: 6 },
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ 
              maxWidth: '800px',
              width: '100%',
              textAlign: 'center'
            }}>
            <Typography 
              variant="h2" 
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                lineHeight: 1.2,
                mb: 3,
                color: 'text.primary'
              }}
            >
              Take Control of Your Financial Future
            </Typography>
            
            <Typography 
              variant="h5" 
              color="text.secondary"
              sx={{
                mb: 5,
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                lineHeight: 1.6,
                maxWidth: '700px',
                mx: 'auto'
              }}
            >
              CloudFin helps you track expenses, manage budgets, and achieve your financial goals with AI-powered insights.
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                component={Link}
                to="/auth/signup"
                sx={{
                  px: 5,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 14px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                  },
                  transition: 'all 0.3s ease',
                  minWidth: '200px'
                }}
              >
                Get Started - It's Free
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                size="large"
                component={Link}
                to="/features"
                sx={{
                  px: 5,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  borderWidth: 2,
                  '&:hover': { 
                    borderWidth: 2,
                    backgroundColor: 'action.hover'
                  },
                  minWidth: '200px'
                }}
              >
                Learn More
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Feature Section */}
        <FeatureSection />

        {/* CTA Section */}
        <Box 
          component="section"
          sx={{ 
            py: { xs: 8, md: 12 },
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            textAlign: 'center',
            mt: 8,
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Container 
            maxWidth="md"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Typography 
              variant="h3" 
              component="h2" 
              sx={{ 
                fontWeight: 800, 
                mb: 3,
                fontSize: { xs: '2rem', md: '2.5rem' }
              }}
            >
              Ready to Transform Your Financial Life?
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 5, 
                opacity: 0.9,
                fontSize: { xs: '1rem', md: '1.25rem' },
                maxWidth: '800px'
              }}
            >
              Join thousands of users who are already taking control of their finances with CloudFin.
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              component={Link}
              to="/auth/signup"
              sx={{
                px: 6,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1.1rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                backgroundColor: 'background.paper',
                color: 'primary.main',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 25px rgba(0, 0, 0, 0.3)',
                  backgroundColor: 'background.default'
                }
              }}
            >
              Get Started for Free
            </Button>
          </Container>
        </Box>
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default Homepage;