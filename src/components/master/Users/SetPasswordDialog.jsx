import React, { useState } from 'react';
import {
  Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
} from '@mui/material';
import { usersService } from '../../../services/resources/usersService';
import { useNotify } from '../../../context/NotificationContext';

const MIN_LENGTH = 8;
const EMPTY = { password: '', password_confirmation: '' };
const inputSx = { sx: { fontSize: '0.75rem' } };

/** Same rules as the backend, checked here for instant feedback; the backend decides. */
const validate = ({ password, password_confirmation: confirmation }) => {
  const errors = {};
  if (password.length < MIN_LENGTH) errors.password = `Use at least ${MIN_LENGTH} characters.`;
  else if (new TextEncoder().encode(password).length > 72) errors.password = 'Password is too long (max 72 bytes).';
  if (confirmation && confirmation !== password) errors.password_confirmation = 'Passwords do not match.';
  return errors;
};

/**
 * SetPasswordDialog
 *
 * Modal with Password + Password Confirmation. The backend stores the password as a bcrypt
 * hash (POST /set_password/users/{id}); it is never sent back to the browser.
 */
export default function SetPasswordDialog({ user, open, onClose }) {
  const notify = useNotify();
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const clientErrors = validate(values);
  const fieldError = (name) => serverErrors[name] || (touched[name] ? clientErrors[name] : '');
  const canSave = values.password && values.password_confirmation && Object.keys(clientErrors).length === 0;

  const handleClose = () => {
    if (saving) return;
    setValues(EMPTY);
    setTouched({});
    setServerErrors({});
    setError(null);
    onClose();
  };

  const handleChange = (name) => (event) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    setServerErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ password: true, password_confirmation: true });
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await usersService.setPassword(user.id, values);
      notify.success(`Password updated for ${user.name}.`);
      setSaving(false);
      handleClose();
    } catch (err) {
      setServerErrors(err.fieldErrors || {});
      setError(err.message || 'Failed to update the password.');
      setSaving(false);
    }
  };

  const field = (name, label, autoFocus = false) => (
    <TextField
      fullWidth
      size="small"
      type="password"
      label={label}
      value={values[name]}
      onChange={handleChange(name)}
      onBlur={() => setTouched((current) => ({ ...current, [name]: true }))}
      error={Boolean(fieldError(name))}
      helperText={fieldError(name) || (name === 'password' ? `At least ${MIN_LENGTH} characters.` : ' ')}
      autoComplete="new-password"
      autoFocus={autoFocus}
      required
      disabled={saving}
      sx={{ mt: 1.5 }}
      InputProps={inputSx}
      InputLabelProps={inputSx}
    />
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ fontSize: '0.9rem', fontWeight: 700, pb: 0 }}>
          Set Password{user?.name ? ` · ${user.name}` : ''}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mt: 1.5, py: 0.25, fontSize: '0.6875rem' }}>{error}</Alert>}
          {field('password', 'Password', true)}
          {field('password_confirmation', 'Password Confirmation')}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={saving} sx={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || !canSave}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ fontSize: '0.75rem', textTransform: 'none', backgroundColor: '#262755', '&:hover': { backgroundColor: '#1B1C3D' } }}
          >
            {saving ? 'Saving...' : 'Set Password'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
