import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ 
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            //add blue colour at bacground of header and white colour to text also give it a specfic height and width 
            height: '60px',
            width: '100%',
            bgcolor: 'primary.main',
            color: 'text.primary',
            fontSize: '1.5rem',
            textAlign: 'center',
            borderRadius: 1,
            padding: 1,
            boxShadow: 1,
            display: 'flex', 
            flexDirection: 'row',
            flexGrow: 1,
            maxWidth: '600px',
            margin: '0 auto',
            }}>
          {user ? (
            <>
              <Button color="inherit" component={Link} to="/dashboard">
                Dashboard
              </Button>
              <Button 
                color="error" 
                variant="outlined" 
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/auth/login">
                Login
              </Button>
              <Button 
                color="primary" 
                variant="contained" 
                component={Link} 
                to="/auth/signup"
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}