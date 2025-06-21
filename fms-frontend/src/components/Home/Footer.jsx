import { Box, Container, Typography, Link as MuiLink, Grid } from '@mui/material';
import { Link } from 'react-router-dom';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 6, 
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <AccountBalanceIcon sx={{ fontSize: 32, mr: 1, color: 'primary.main' }} />
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                CloudFin
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: '400px', mx: { xs: 'auto', md: 0 } }}>
              Empowering you to take control of your financial future with powerful tools and insights.
            </Typography>
            <Box sx={{ mt: 2, textAlign: { xs: 'center', md: 'left' } }}>
              <Typography variant="body2" color="text.secondary">
                Connect with us on social media
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Quick Links
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1,
              alignItems: { xs: 'center', md: 'flex-start' }
            }}>
              <MuiLink component={Link} to="/auth/login" color="text.secondary" underline="hover">
                Login
              </MuiLink>
              <MuiLink component={Link} to="/auth/signup" color="text.secondary" underline="hover">
                Sign Up
              </MuiLink>
              <MuiLink component={Link} to="/dashboard" color="text.secondary" underline="hover">
                Dashboard
              </MuiLink>
            </Box>
          </Grid>
        </Grid>

        <Box 
          sx={{ 
            mt: 6, 
            pt: 4, 
            borderTop: '1px solid', 
            borderColor: 'divider',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} CloudFin. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 4 }}>
            <MuiLink component={Link} to="#" color="text.secondary" variant="body2" underline="hover">
              Privacy Policy
            </MuiLink>
            <MuiLink component={Link} to="#" color="text.secondary" variant="body2" underline="hover">
              Terms of Service
            </MuiLink>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
