import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Card, CircularProgress, MenuItem, Switch, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import AppBreadcrumbs from '../../AppBreadcrumbs';
import { chatterService } from '../../../services/chatterService';

const cellSx = { fontSize: '0.6875rem' };
const headSx = { fontSize: '0.625rem', fontWeight: 700, color: '#64748B' };
const titleCase = (name) => name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Field Tracking
 *
 * Central configuration of the automatic change history: choose a model and switch tracking
 * on or off per field. Every non-sensitive field is tracked by default; passwords, tokens and
 * similar fields are never offered here.
 */
export default function FieldTracking() {
  const [models, setModels] = useState([]);
  const [model, setModel] = useState('');
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingField, setSavingField] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    chatterService
      .trackedModels()
      .then((names) => {
        setModels(names);
        setModel((current) => current || names[0] || '');
      })
      .catch((err) => setError(err.message || 'Failed to load the models.'));
  }, []);

  useEffect(() => {
    if (!model) return;
    setLoading(true);
    setError(null);
    chatterService
      .trackedFields(model)
      .then(setFields)
      .catch((err) => setError(err.message || 'Failed to load the fields.'))
      .finally(() => setLoading(false));
  }, [model]);

  const toggle = async (field) => {
    setSavingField(field.field_name);
    setError(null);
    try {
      const updated = await chatterService.setTracked(model, field.field_name, !field.tracked);
      setFields((current) => current.map((item) => (item.field_name === updated.field_name ? updated : item)));
    } catch (err) {
      setError(err.message || 'Failed to update the field.');
    } finally {
      setSavingField(null);
    }
  };

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
        <AppBreadcrumbs items={[{ label: 'Master' }, { label: 'Field Tracking' }]} />
        <Box sx={{ flexGrow: 1 }} />
        <TextField
          select
          size="small"
          label="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          sx={{ minWidth: 220 }}
          InputProps={{ sx: cellSx }}
          InputLabelProps={{ sx: cellSx }}
        >
          {models.map((name) => (
            <MenuItem key={name} value={name} sx={cellSx}>{titleCase(name)}</MenuItem>
          ))}
        </TextField>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 1.5, py: 0.25, fontSize: '0.6875rem' }}>{error}</Alert>}

      <Card sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={22} sx={{ color: '#262755' }} /></Box>
        ) : fields.length === 0 ? (
          <Typography sx={{ fontSize: '0.6875rem', color: '#94A3B8', textAlign: 'center', py: 3 }}>No trackable fields.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headSx}>Field</TableCell>
                <TableCell sx={headSx}>Technical Name</TableCell>
                <TableCell sx={headSx}>Type</TableCell>
                <TableCell sx={headSx} align="right">Track Changes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((field) => (
                <TableRow key={field.field_name} hover>
                  <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{field.field_label}</TableCell>
                  <TableCell sx={cellSx}>{field.field_name}</TableCell>
                  <TableCell sx={cellSx}>{field.field_type}</TableCell>
                  <TableCell align="right">
                    <Switch size="small" checked={field.tracked} disabled={savingField === field.field_name} onChange={() => toggle(field)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </Box>
  );
}
