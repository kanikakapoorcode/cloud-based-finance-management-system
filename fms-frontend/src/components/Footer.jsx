import { Box, Typography, Container } from '@mui/material';

export default function Footer() {
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 3, 
        px: 2, 
        backgroundColor: (theme) => 
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="sm">
        <Typography 
variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} Finance Management System. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}