import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, CircularProgress, Stack } from '@mui/material';

const OTPVerification = ({ onVerify, onResend, loading, error, email }) => {
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setLocalError('Please enter a valid 6-digit OTP.');
      return;
    }
    if (onVerify) {
      await onVerify(otp);
    }
  };

  const handleResend = async () => {
    if (onResend) {
      await onResend();
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={2} textAlign="center">
        OTP Verification
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
        Enter the 6-digit code sent to your email{email ? ` (${email})` : ''}.
      </Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="OTP Code"
            value={otp}
            onChange={handleChange}
            inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*', name: 'otp' }}
            required
            fullWidth
            autoFocus
            disabled={loading}
          />
          {(localError || error) && (
            <Alert severity="error">{localError || error}</Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading || otp.length !== 6}
            sx={{ py: 1.5, fontWeight: 600, borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Verify OTP'}
          </Button>
          <Button
            variant="text"
            color="secondary"
            fullWidth
            onClick={handleResend}
            disabled={loading}
            sx={{ fontWeight: 500 }}
          >
            Resend OTP
          </Button>
        </Stack>
      </form>
    </Box>
  );
};

export default OTPVerification;
