import { Button, Typography, Box, Container, Card, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';
import logo from '../assets/logoo.png';

const Homepage = () => {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100vw',
      bgcolor: '#f5f5f5', // Light grey background
      p: 3,
      boxSizing: 'border-box'
    }}>
      {/* Main Card */}
      <Card sx={{
        width: '100%',
        maxWidth: 450,
        borderRadius: 3,
        boxShadow: 3,
        overflow: 'hidden'
      }}>
        <CardContent sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          {/* Logo */}
          <Box 
            component="img"
            src={logo}
            alt="CloudFin Logo"
            sx={{ 
              height: 60,
              width: 'auto',
              mb: 3
            }}
          />

          {/* Title */}
          <Typography variant="h4" sx={{ 
            color: 'primary.main',
            fontWeight: 'bold',
            mb: 2
          }}>
            CloudFin
          </Typography>

          {/* Subtitle */}
          <Typography variant="subtitle1" sx={{ 
            color: 'text.secondary',
            mb: 4
          }}>
            AI-Powered Financial Management
          </Typography>

          {/* Auth Buttons */}
          <Box sx={{ width: '100%', mt: 2 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              component={Link}
              to="/auth/login"
              sx={{
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}
            >
              Sign In
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              component={Link}
              to="/auth/signup"
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                color: 'primary.main',
                borderWidth: 2,
                '&:hover': { borderWidth: 2 }
              }}
            >
              Create Account
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Footer */}
      <Typography variant="body2" sx={{ 
        mt: 4,
        color: 'text.secondary',
        textAlign: 'center'
      }}>
        {new Date().getFullYear()} CloudFin. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Homepage;