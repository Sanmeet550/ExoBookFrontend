import React, { useState } from 'react';
import { Alert, Box, Button, Card, CircularProgress, TextField, Typography } from '@mui/material';
import { CorporateFare } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const inputProps = { sx: { fontSize: '0.8rem' } };

/**
 * LoginPage
 *
 * Full-screen sign-in shown before any ERP screen. After a successful sign-in the app opens
 * the page that was requested (the URL is kept), so deep links survive the login.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(loginName.trim(), password);
    } catch (err) {
      setError(err.status === 401 ? 'Invalid login or password.' : err.message || 'Sign in failed.');
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#262755',
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(253, 213, 61, 0.12), transparent 45%)',
        p: 2,
      }}
    >
      <Card
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{ width: '100%', maxWidth: 360, p: 4, bgcolor: '#FFFFFF', borderRadius: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 3 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: '#262755', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CorporateFare sx={{ color: '#fdd53d', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, letterSpacing: '0.06em', color: '#262755', fontSize: '0.95rem', lineHeight: 1.1 }}>
              EXOBOOK
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: '0.6rem', letterSpacing: '0.08em', fontWeight: 600 }}>
              ENTERPRISE ERP
            </Typography>
          </Box>
        </Box>

        <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>Sign in</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mb: 2.5 }}>Use your ExoBook login and password.</Typography>

        {error && <Alert severity="error" sx={{ mb: 2, py: 0.25, fontSize: '0.75rem' }}>{error}</Alert>}

        <TextField
          fullWidth
          size="small"
          label="Login"
          value={loginName}
          onChange={(e) => setLoginName(e.target.value)}
          autoComplete="username"
          autoFocus
          required
          disabled={submitting}
          sx={{ mb: 2 }}
          InputProps={inputProps}
          InputLabelProps={inputProps}
        />
        <TextField
          fullWidth
          size="small"
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={submitting}
          sx={{ mb: 3 }}
          InputProps={inputProps}
          InputLabelProps={inputProps}
        />
        <Button
          fullWidth
          type="submit"
          variant="contained"
          disabled={submitting || !loginName.trim() || !password}
          startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{ height: 38, fontSize: '0.8rem', fontWeight: 700, textTransform: 'none', backgroundColor: '#262755', '&:hover': { backgroundColor: '#1B1C3D' } }}
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </Card>
    </Box>
  );
}
