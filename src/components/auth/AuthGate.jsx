import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import LoginPage from './LoginPage';

/** Renders the app only for a signed-in user; otherwise the login page. */
export default function AuthGate({ children }) {
  const { user, checking } = useAuth();
  if (checking) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={28} sx={{ color: '#262755' }} />
      </Box>
    );
  }
  return user ? children : <LoginPage />;
}
