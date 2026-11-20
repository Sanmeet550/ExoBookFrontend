import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Card, Chip, CircularProgress, FormControlLabel, IconButton, Switch, TextField,
  Tooltip, Typography,
} from '@mui/material';
import { DeleteOutline, EditOutlined } from '@mui/icons-material';
import { chatterService } from '../../services/chatterService';

const COMPOSERS = [
  { id: 'message', label: 'Send Message' },
  { id: 'log_note', label: 'Log Note' },
  { id: 'email', label: 'Email' },
];

const FILTERS = [
  { id: 'all', label: 'All', types: null },
  { id: 'field_change', label: 'Field Changes', types: ['field_change'] },
  { id: 'log_note', label: 'Log Notes', types: ['log_note'] },
  { id: 'message', label: 'Messages', types: ['message'] },
  { id: 'email', label: 'Emails', types: ['email_incoming', 'email_outgoing'] },
];

const TYPE_STYLES = {
  field_change: { label: 'Field changes', color: '#475569', bg: '#F1F5F9', border: '#E2E8F0' },
  log_note: { label: 'Log note · internal', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  message_internal: { label: 'Message · internal', color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' },
  message_public: { label: 'Message · customer-facing', color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' },
  email_incoming: { label: 'Incoming email', color: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE' },
  email_outgoing: { label: 'Outgoing email', color: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE' },
};

const COLLAPSED_CHANGES = 5;
const smallButton = { height: 26, fontSize: '0.6875rem', textTransform: 'none' };

const styleOf = (activity) =>
  TYPE_STYLES[activity.activity_type === 'message' ? (activity.is_internal ? 'message_internal' : 'message_public') : activity.activity_type]
  || TYPE_STYLES.log_note;

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '');
const initials = (name) => (name || '?').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

/** Field-change values are stored as text; dates are shown in the viewer's locale. */
const formatValue = (value, fieldType) => {
  if (value === null || value === undefined || value === '') return '—';
  if (fieldType === 'datetime') return formatDateTime(value);
  return value;
};

function ToggleButton({ active, label, onClick }) {
  return (
    <Button
      size="small"
      onClick={onClick}
      sx={{
        ...smallButton,
        backgroundColor: active ? '#262755' : 'transparent',
        color: active ? '#FFFFFF' : '#475569',
        '&:hover': { backgroundColor: active ? '#1B1C3D' : 'rgba(0,0,0,0.04)' },
      }}
    >
      {label}
    </Button>
  );
}

function FieldChanges({ values }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? values : values.slice(0, COLLAPSED_CHANGES);
  return (
    <Box>
      {visible.map((change) => (
        <Box key={change.field_name} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', fontSize: '0.75rem', mb: 0.25 }}>
          <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 700, color: '#0F172A', minWidth: 110 }}>
            {change.field_label}
          </Typography>
          <Typography component="span" sx={{ fontSize: 'inherit', color: '#64748B', wordBreak: 'break-word' }}>
            {formatValue(change.old_value, change.field_type)}
          </Typography>
          <Typography component="span" sx={{ fontSize: 'inherit', color: '#94A3B8' }}>→</Typography>
          <Typography component="span" sx={{ fontSize: 'inherit', color: '#0F172A', fontWeight: 600, wordBreak: 'break-word' }}>
            {formatValue(change.new_value, change.field_type)}
          </Typography>
        </Box>
      ))}
      {values.length > COLLAPSED_CHANGES && (
        <Button size="small" onClick={() => setExpanded((current) => !current)} sx={{ ...smallButton, height: 20, p: 0, color: '#475569' }}>
          {expanded ? 'Show less' : `Show ${values.length - COLLAPSED_CHANGES} more`}
        </Button>
      )}
    </Box>
  );
}

function ActivityItem({ activity, onEdit, onDelete }) {
  const [draft, setDraft] = useState(null);
  const style = styleOf(activity);
  const isFieldChange = activity.activity_type === 'field_change';
  const author = activity.author_name || (isFieldChange ? 'System' : 'Unknown user');

  const saveDraft = async () => {
    try {
      await onEdit(activity, draft);
      setDraft(null);
    } catch {
      // the Chatter shows the error; keep the draft open
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
      <Avatar sx={{ width: 26, height: 26, fontSize: '0.625rem', bgcolor: '#262755' }}>{initials(author)}</Avatar>
      <Box sx={{ flexGrow: 1, minWidth: 0, p: 1.25, borderRadius: '6px', border: `1px solid ${style.border}`, bgcolor: style.bg }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#0F172A' }}>
            {isFieldChange ? `Changes made by ${author}` : author}
          </Typography>
          <Chip size="small" label={style.label} sx={{ height: 18, fontSize: '0.5625rem', fontWeight: 700, color: style.color, bgcolor: '#FFFFFF', border: `1px solid ${style.border}` }} />
          <Typography sx={{ fontSize: '0.625rem', color: '#94A3B8', ml: 'auto' }}>{formatDateTime(activity.created_at)}</Typography>
          {activity.can_edit && draft === null && (
            <>
              <Tooltip title="Edit"><IconButton size="small" onClick={() => setDraft(activity.body || '')} sx={{ p: 0.25 }}><EditOutlined sx={{ fontSize: 14 }} /></IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton size="small" onClick={() => onDelete(activity)} sx={{ p: 0.25 }}><DeleteOutline sx={{ fontSize: 14 }} /></IconButton></Tooltip>
            </>
          )}
        </Box>
        {activity.subject && <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{activity.subject}</Typography>}
        {activity.activity_type.startsWith('email') && (
          <Typography sx={{ fontSize: '0.625rem', color: '#64748B', mb: 0.5 }}>
            {activity.email_from || '—'} → {activity.email_to || '—'}
            {activity.email_status ? ` · ${activity.email_status}` : ''}
            {activity.email_error ? ` · ${activity.email_error}` : ''}
          </Typography>
        )}
        {isFieldChange && <FieldChanges values={activity.tracking_values || []} />}
        {draft !== null ? (
          <Box>
            <TextField fullWidth multiline minRows={2} size="small" value={draft} onChange={(e) => setDraft(e.target.value)} InputProps={{ sx: { fontSize: '0.75rem', bgcolor: '#FFFFFF' } }} />
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
              <Button size="small" variant="contained" disabled={!draft.trim()} onClick={saveDraft} sx={{ ...smallButton, backgroundColor: '#262755' }}>Save</Button>
              <Button size="small" onClick={() => setDraft(null)} sx={{ ...smallButton, color: '#64748B' }}>Cancel</Button>
            </Box>
          </Box>
        ) : (
          activity.body && (
            <Typography sx={{ fontSize: '0.75rem', color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{activity.body}</Typography>
          )
        )}
      </Box>
    </Box>
  );
}

/**
 * Chatter
 *
 * The one communication timeline used by every form view. Give it the backend model name and
 * the record id; it loads and posts through the generic /chatter API.
 *
 * - Send Message: internal or customer-facing message
 * - Log Note:     internal note (never customer-facing)
 * - Email:        shown, but disabled until an email provider is configured on the backend
 * - Filters:      All / Field Changes / Log Notes / Messages / Emails (display only)
 *
 * Props: model, recordId, refreshKey (change it to reload, e.g. after the record is saved),
 *        onActivity (called after a note or message is posted).
 */
export default function Chatter({ model, recordId, refreshKey = null, onActivity }) {
  const [activities, setActivities] = useState([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [composer, setComposer] = useState('log_note');
  const [filter, setFilter] = useState('all');
  const [body, setBody] = useState('');
  const [customerFacing, setCustomerFacing] = useState(false);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (!model || !recordId) return;
    setLoading(true);
    setError(null);
    try {
      setActivities(await chatterService.list(model, recordId));
      setAvailable(true);
    } catch (err) {
      // 404 = this model has no chatter on the backend: render nothing instead of an error.
      if (err.status === 404) setAvailable(false);
      else setError(err.message || 'Failed to load the history.');
    } finally {
      setLoading(false);
    }
  }, [model, recordId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const visible = useMemo(() => {
    const types = FILTERS.find((item) => item.id === filter)?.types;
    return types ? activities.filter((activity) => types.includes(activity.activity_type)) : activities;
  }, [activities, filter]);

  /** Runs a write call, then reloads the timeline. */
  const run = async (action) => {
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err.message || 'The action could not be completed.');
      throw err;
    }
  };

  const handlePost = async () => {
    setPosting(true);
    try {
      await run(() =>
        composer === 'log_note'
          ? chatterService.logNote(model, recordId, body.trim())
          : chatterService.sendMessage(model, recordId, body.trim(), !customerFacing)
      );
      setBody('');
      onActivity?.();
    } catch {
      // the error is already shown
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = (activity) => {
    if (window.confirm('Delete this entry?')) run(() => chatterService.remove(activity.id)).catch(() => {});
  };

  if (!model || !recordId || !available) return null;

  const isNote = composer === 'log_note';

  return (
    <Card sx={{ mt: 1.5, p: 2, bgcolor: 'white', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
        {COMPOSERS.map((item) => (
          <ToggleButton key={item.id} label={item.label} active={composer === item.id} onClick={() => setComposer(item.id)} />
        ))}
      </Box>

      {composer === 'email' ? (
        <Alert severity="info" sx={{ py: 0.25, fontSize: '0.6875rem' }}>
          Email is not configured yet, so emails cannot be sent or received from here. Once an email provider is
          connected, incoming and outgoing emails will appear in this timeline.
        </Alert>
      ) : (
        <>
          <TextField
            fullWidth
            multiline
            minRows={2}
            size="small"
            placeholder={isNote ? 'Log an internal note...' : 'Write a message...'}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={posting}
            InputProps={{ sx: { fontSize: '0.75rem', bgcolor: isNote ? '#FFFBEB' : '#FFFFFF' } }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            {isNote ? (
              <Typography sx={{ fontSize: '0.625rem', color: '#64748B' }}>Log notes are internal and never shown to customers.</Typography>
            ) : (
              <FormControlLabel
                control={<Switch size="small" checked={customerFacing} onChange={(e) => setCustomerFacing(e.target.checked)} />}
                label={customerFacing ? 'Customer-facing (stored only: nothing is emailed yet)' : 'Internal message'}
                componentsProps={{ typography: { sx: { fontSize: '0.6875rem' } } }}
              />
            )}
            <Button
              size="small"
              variant="contained"
              onClick={handlePost}
              disabled={posting || !body.trim()}
              startIcon={posting ? <CircularProgress size={12} color="inherit" /> : null}
              sx={{ ...smallButton, ml: 'auto', backgroundColor: '#262755', '&:hover': { backgroundColor: '#1B1C3D' } }}
            >
              {isNote ? 'Log' : 'Send'}
            </Button>
          </Box>
        </>
      )}

      {error && <Alert severity="error" sx={{ mt: 1, py: 0.25, fontSize: '0.6875rem' }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 0.5, mt: 2, mb: 1, pt: 1, borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
        {FILTERS.map((item) => (
          <ToggleButton key={item.id} label={item.label} active={filter === item.id} onClick={() => setFilter(item.id)} />
        ))}
      </Box>

      {loading && activities.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={18} sx={{ color: '#262755' }} /></Box>
      )}
      {!loading && visible.length === 0 && (
        <Typography sx={{ fontSize: '0.6875rem', color: '#94A3B8', textAlign: 'center', py: 1.5 }}>
          {activities.length === 0 ? 'No history yet.' : 'Nothing in this filter.'}
        </Typography>
      )}
      {visible.map((activity) => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          onEdit={(item, text) => run(() => chatterService.update(item.id, text.trim()))}
          onDelete={handleDelete}
        />
      ))}
    </Card>
  );
}
