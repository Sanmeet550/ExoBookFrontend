import React, { useState, useEffect, useMemo } from 'react';
import {
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
import { relationCacheService } from '../../services/relationCacheService';

/**
 * FormField Component
 * Compact enterprise input field supporting many2one, selection, boolean, number, textarea, and date.
 */
export default function FormField({
  field,
  value,
  formData = {},
  onChange,
  error = false,
  helperText = '',
  disabled = false,
}) {
  const {
    name,
    label,
    type = 'text',
    required = false,
    rows = 2,
    relation,
    depends_on,
    options: rawOptions = [],
  } = field;

  const [relationRecords, setRelationRecords] = useState([]);
  const [loadingRelation, setLoadingRelation] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if ((type === 'many2one' || type === 'many2many') && relation?.endpoint) {
      setLoadingRelation(true);
      relationCacheService
        .getRelationRecords(relation.endpoint)
        .then((records) => {
          if (isMounted) {
            setRelationRecords(records);
            setLoadingRelation(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoadingRelation(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [type, relation?.endpoint]);

  const parentValue = depends_on?.field ? formData[depends_on.field] : null;
  const isParentSelected = !depends_on || (parentValue !== undefined && parentValue !== '' && parentValue !== null);

  const filteredRelationRecords = useMemo(() => {
    if (!depends_on) {
      return relationRecords;
    }
    if (!parentValue) {
      return [];
    }
    const filterKey = depends_on.filter_field || depends_on.field;
    return relationRecords.filter((rec) => {
      const recVal = rec[filterKey];
      return String(recVal) === String(parentValue);
    });
  }, [relationRecords, depends_on, parentValue]);

  const dropdownOptions = useMemo(() => {
    if (type === 'many2one' || type === 'many2many') {
      const valField = relation?.value_field || 'id';
      const lblField = relation?.label_field || 'name';
      return filteredRelationRecords.map((rec) => ({
        value: rec[valField],
        label: rec[lblField] || `ID ${rec[valField]}`,
      }));
    }

    if (type === 'selection') {
      return rawOptions.map((opt) =>
        typeof opt === 'object' ? opt : { value: opt, label: String(opt).replace(/_/g, ' ') }
      );
    }

    return [];
  }, [type, relation, filteredRelationRecords, rawOptions]);

  // 1. Relational Many2One Dropdown
  if (type === 'many2one') {
    const isFieldDisabled = disabled || (Boolean(depends_on) && !isParentSelected);
    const placeholderText = depends_on && !isParentSelected
      ? `Select ${depends_on.field.replace('_id', '').replace('_', ' ')} first`
      : loadingRelation
      ? 'Loading...'
      : dropdownOptions.length === 0
      ? 'No options available'
      : '';

    return (
      <TextField
        select
        fullWidth
        size="small"
        label={label}
        value={value !== undefined && value !== null ? value : ''}
        onChange={(e) => {
          const rawVal = e.target.value;
          const parsedVal = rawVal === '' ? '' : Number(rawVal);
          onChange(name, parsedVal);
        }}
        required={required}
        disabled={isFieldDisabled}
        error={error}
        helperText={placeholderText || helperText}
        InputProps={{
          endAdornment: loadingRelation ? (
            <CircularProgress size={14} sx={{ mr: 2, color: 'text.secondary' }} />
          ) : null,
          sx: { fontSize: '0.6875rem' },
        }}
        InputLabelProps={{ sx: { fontSize: '0.6875rem' } }}
      >
        <MenuItem value="" sx={{ fontSize: '0.6875rem' }}>
          <em>-- Select {label} --</em>
        </MenuItem>
        {dropdownOptions.map((opt) => (
          <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.6875rem' }}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  // 1b. Relational Many2Many multi-select (value is an array of ids)
  if (type === 'many2many') {
    const selected = Array.isArray(value) ? value : [];
    const labelOf = (id) => dropdownOptions.find((opt) => opt.value === id)?.label || `ID ${id}`;
    return (
      <TextField
        select
        fullWidth
        size="small"
        label={label}
        value={selected}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
        disabled={disabled}
        error={error}
        helperText={loadingRelation ? 'Loading...' : helperText}
        SelectProps={{
          multiple: true,
          renderValue: (ids) => ids.map(labelOf).join(', '),
        }}
        InputProps={{ sx: { fontSize: '0.6875rem' } }}
        InputLabelProps={{ sx: { fontSize: '0.6875rem' } }}
      >
        {dropdownOptions.map((opt) => (
          <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.6875rem' }}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  // 2. Selection / Enum Dropdown
  if (type === 'selection' || (type === 'select' && dropdownOptions.length > 0)) {
    return (
      <TextField
        select
        fullWidth
        size="small"
        label={label}
        value={value !== undefined && value !== null ? value : ''}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
        disabled={disabled}
        error={error}
        helperText={helperText}
        InputProps={{ sx: { fontSize: '0.6875rem' } }}
        InputLabelProps={{ sx: { fontSize: '0.6875rem' } }}
      >
        <MenuItem value="" sx={{ fontSize: '0.6875rem' }}>
          <em>-- Select {label} --</em>
        </MenuItem>
        {dropdownOptions.map((opt) => (
          <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.6875rem' }}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  // 3. Boolean Switch
  if (type === 'boolean') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', pt: 0.5 }}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={Boolean(value)}
              onChange={(e) => onChange(name, e.target.checked)}
              disabled={disabled}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#262755',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#262755',
                },
              }}
            />
          }
          label={<Typography variant="body2" sx={{ fontSize: '0.6875rem', fontWeight: 500 }}>{label}</Typography>}
        />
      </Box>
    );
  }

  // 4. Textarea
  if (type === 'textarea') {
    return (
      <TextField
        fullWidth
        multiline
        rows={rows}
        size="small"
        label={label}
        value={value !== undefined && value !== null ? value : ''}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
        disabled={disabled}
        error={error}
        helperText={helperText}
        InputProps={{ sx: { fontSize: '0.6875rem' } }}
        InputLabelProps={{ sx: { fontSize: '0.6875rem' } }}
      />
    );
  }

  // 5. Date Field
  if (type === 'date') {
    return (
      <TextField
        fullWidth
        size="small"
        type="date"
        label={label}
        value={value !== undefined && value !== null ? value : ''}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
        disabled={disabled}
        error={error}
        helperText={helperText}
        InputLabelProps={{ shrink: true, sx: { fontSize: '0.6875rem' } }}
        InputProps={{ sx: { fontSize: '0.6875rem' } }}
      />
    );
  }

  // 6. Number Field
  if (type === 'number') {
    return (
      <TextField
        fullWidth
        size="small"
        type="number"
        label={label}
        value={value !== undefined && value !== null ? value : ''}
        onChange={(e) => {
          const val = e.target.value;
          onChange(name, val === '' ? '' : Number(val));
        }}
        required={required}
        disabled={disabled}
        error={error}
        helperText={helperText}
        InputProps={{ sx: { fontSize: '0.6875rem' } }}
        InputLabelProps={{ sx: { fontSize: '0.6875rem' } }}
      />
    );
  }

  // 7. Standard Text Field
  return (
    <TextField
      fullWidth
      size="small"
      label={label}
      value={value !== undefined && value !== null ? value : ''}
      onChange={(e) => onChange(name, e.target.value)}
      required={required}
      disabled={disabled}
      error={error}
      helperText={helperText}
      InputProps={{ sx: { fontSize: '0.6875rem' } }}
      InputLabelProps={{ sx: { fontSize: '0.6875rem' } }}
    />
  );
}
