// In Alert.jsx
import { Alert as MuiAlert } from '@mui/material';

export default function Alert({ message, onClose }) {
  return (
    <MuiAlert 
      severity="warning" 
      onClose={onClose}
      sx={{ mb: 2 }}
    >
      {message}
    </MuiAlert>
  );
}