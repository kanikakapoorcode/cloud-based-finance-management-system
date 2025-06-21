import { createTheme } from '@mui/material/styles';

const authTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#fff',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.3,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#e0e0e0',
            },
            '&:hover fieldset': {
              borderColor: '#bdbdbd',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
              borderWidth: '1px',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 2px 4px rgba(0,0,0,0.04)',
    '0 4px 6px rgba(0,0,0,0.04)',
    '0 6px 8px rgba(0,0,0,0.04)',
    '0 8px 10px rgba(0,0,0,0.04)',
    '0 10px 12px rgba(0,0,0,0.04)',
    '0 12px 16px rgba(0,0,0,0.04)',
    '0 14px 18px rgba(0,0,0,0.04)',
    '0 16px 20px rgba(0,0,0,0.04)',
    '0 18px 22px rgba(0,0,0,0.04)',
    '0 20px 24px rgba(0,0,0,0.04)',
    '0 22px 26px rgba(0,0,0,0.04)',
    '0 24px 28px rgba(0,0,0,0.04)',
    '0 26px 30px rgba(0,0,0,0.04)',
    '0 28px 32px rgba(0,0,0,0.04)',
    '0 30px 34px rgba(0,0,0,0.04)',
    '0 32px 36px rgba(0,0,0,0.04)',
    '0 34px 38px rgba(0,0,0,0.04)',
    '0 36px 40px rgba(0,0,0,0.04)',
    '0 38px 42px rgba(0,0,0,0.04)',
    '0 40px 44px rgba(0,0,0,0.04)',
    '0 42px 46px rgba(0,0,0,0.04)',
    '0 44px 48px rgba(0,0,0,0.04)',
    '0 46px 50px rgba(0,0,0,0.04)',
    '0 48px 52px rgba(0,0,0,0.04)',
  ],
});

export default authTheme;
