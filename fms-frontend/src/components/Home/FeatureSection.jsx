import { useState, useEffect } from 'react';
import { Box, Container, Grid, Typography, Fade, useTheme, useMediaQuery } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const features = [
  {
    icon: <AccountBalanceWalletIcon sx={{ fontSize: 50, color: 'primary.main' }} />,
    title: 'Smart Budgeting',
    description: 'Effortlessly track and manage your expenses with our intelligent budgeting tools.'
  },
  {
    icon: <AnalyticsIcon sx={{ fontSize: 50, color: 'secondary.main' }} />,
    title: 'Analytics Dashboard',
    description: 'Gain valuable insights into your spending habits with beautiful visualizations.'
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 50, color: 'success.main' }} />,
    title: 'Bank-Level Security',
    description: 'Your financial data is protected with enterprise-grade encryption.'
  },
  {
    icon: <TrendingUpIcon sx={{ fontSize: 50, color: 'warning.main' }} />,
    title: 'Investment Tracking',
    description: 'Monitor your investments and grow your wealth with confidence.'
  }
];

const FeatureSection = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(true);
  }, []);

  return (
    <Box sx={{ 
      py: { xs: 8, md: 12 }, 
      bgcolor: 'background.paper',
      width: '100%',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <Container 
        maxWidth="lg" 
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%'
        }}
      >
        <Box textAlign="center" mb={8} sx={{ width: '100%' }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 800,
              mb: 3,
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: 'text.primary'
            }}
          >
            Powerful Features
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ 
              maxWidth: '700px', 
              mx: 'auto',
              fontSize: { xs: '1rem', md: '1.25rem' }
            }}
          >
            Everything you need to take control of your finances in one place
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Fade in={checked} timeout={800} style={{ transitionDelay: `${index * 100}ms` }}>
                <Box
                  sx={{
                    height: '100%',
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                    },
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    minHeight: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Box sx={{ mb: 3 }}>{feature.icon}</Box>
                  <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Box>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default FeatureSection;
