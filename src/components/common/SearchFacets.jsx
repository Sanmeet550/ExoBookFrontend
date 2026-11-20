import React, { useRef, useState } from 'react';
import { Box, Chip, InputBase, MenuItem, Paper, Popper, Typography } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const TYPE_HINTS = { many2one: 'link', many2many: 'tags', selection: 'choice', number: 'number', text: 'text' };

/**
 * SearchFacets
 *
 * Odoo-style search bar. Two ways to add a filter:
 * 1. Click the empty bar: the model's fields are listed. Pick one, type the value, press Enter.
 * 2. Type a value first, then pick "Search <Field> for: <value>" (Enter takes the highlighted line).
 * Each filter becomes a chip. Backspace in the empty box removes the chosen field, then the last
 * chip; Escape closes the list. Props come from useFacetSearch().searchProps.
 */
export default function SearchFacets({ fields = [], facets = [], onAdd, onRemove, placeholder = 'Search...' }) {
  const anchorRef = useRef(null);
  const inputRef = useRef(null);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [pendingField, setPendingField] = useState(null); // field picked from the list, waiting for a value
  const [highlight, setHighlight] = useState(0);
  const term = text.trim();

  // What the dropdown shows: the field picker (empty box), "Search X for: value" lines, or nothing.
  const mode = !focused || fields.length === 0 ? null : pendingField ? null : term ? 'search' : 'pick';
  const options = mode ? fields : [];

  const reset = () => {
    setText('');
    setPendingField(null);
    setHighlight(0);
  };

  const addFilter = (field) => {
    if (!term) return;
    onAdd(field, term);
    reset();
  };

  const pickField = (field) => {
    setPendingField(field);
    setHighlight(0);
    inputRef.current?.focus();
  };

  const choose = (field) => (mode === 'pick' ? pickField(field) : addFilter(field));

  const handleKeyDown = (event) => {
    if (event.key === 'Backspace' && !text) {
      if (pendingField) setPendingField(null);
      else if (facets.length > 0) onRemove(facets.length - 1);
      return;
    }
    if (event.key === 'Escape') {
      reset();
      inputRef.current?.blur();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (pendingField) addFilter(pendingField);
      else if (options.length > 0) choose(options[Math.min(highlight, options.length - 1)]);
      return;
    }
    if (options.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((h) => (h + 1) % options.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((h) => (h - 1 + options.length) % options.length);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        ref={anchorRef}
        onMouseDown={(e) => {
          if (e.target !== inputRef.current) e.preventDefault(); // keep focus in the input
          inputRef.current?.focus();
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.5,
          minHeight: 30,
          px: 1,
          py: 0.25,
          bgcolor: '#FFFFFF',
          border: '1px solid',
          borderColor: focused ? '#262755' : '#E2E8F0',
          borderRadius: '6px',
          cursor: 'text',
        }}
      >
        <SearchIcon sx={{ color: '#94A3B8', fontSize: 16 }} />
        {facets.map((facet, index) => (
          <Chip
            key={facet.field}
            size="small"
            onDelete={() => onRemove(index)}
            label={
              <span>
                <strong>{facet.label}</strong>: {facet.values.join(' or ')}
              </span>
            }
            sx={{ height: 20, fontSize: '0.625rem', bgcolor: '#EEF0FB', color: '#262755', '& .MuiChip-deleteIcon': { fontSize: 14 } }}
          />
        ))}
        {pendingField && (
          <Chip
            size="small"
            label={<strong>{pendingField.label}:</strong>}
            onDelete={() => setPendingField(null)}
            sx={{ height: 20, fontSize: '0.625rem', bgcolor: '#262755', color: '#FFFFFF', '& .MuiChip-deleteIcon': { fontSize: 14, color: 'rgba(255,255,255,0.7)' } }}
          />
        )}
        <InputBase
          inputRef={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setHighlight(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setHighlight(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={pendingField ? `Type a ${pendingField.label} and press Enter` : facets.length ? '' : placeholder}
          inputProps={{ 'aria-label': 'search' }}
          sx={{ flex: 1, minWidth: 120, fontSize: '0.6875rem' }}
        />
      </Box>
      <Popper open={options.length > 0} anchorEl={anchorRef.current} placement="bottom-start" style={{ zIndex: 1300 }}>
        <Paper sx={{ mt: 0.5, minWidth: anchorRef.current?.offsetWidth, maxHeight: 320, overflowY: 'auto', border: '1px solid #E2E8F0', boxShadow: '0 6px 18px rgba(15,23,42,0.12)' }}>
          {mode === 'pick' && (
            <Typography sx={{ px: 2, pt: 1, pb: 0.5, fontSize: '0.625rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Filter by field
            </Typography>
          )}
          {options.map((field, index) => (
            <MenuItem
              key={field.name}
              selected={index === highlight}
              onMouseEnter={() => setHighlight(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(field)}
              sx={{ fontSize: '0.6875rem', py: 0.6, display: 'flex', justifyContent: 'space-between', gap: 2 }}
            >
              {mode === 'pick' ? (
                <>
                  <span>{field.label}</span>
                  <Typography component="span" sx={{ fontSize: '0.5625rem', color: '#94A3B8' }}>
                    {TYPE_HINTS[field.type] || field.type}
                  </Typography>
                </>
              ) : (
                <Typography component="span" sx={{ fontSize: 'inherit' }}>
                  Search <strong>{field.label}</strong> for: <em>{term}</em>
                </Typography>
              )}
            </MenuItem>
          ))}
        </Paper>
      </Popper>
    </Box>
  );
}
