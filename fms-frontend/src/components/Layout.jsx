import { Box } from '@mui/material';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
    }}>
      <Header />
      <Box component="main" sx={{
        flexGrow: 1,
        py: 3,
      }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}