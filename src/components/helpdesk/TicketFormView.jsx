import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, Chip, CircularProgress, Grid, Rating, Tab, Table, TableBody, TableCell,
  TableHead, TableRow, Tabs, TextField, Typography,
} from '@mui/material';
import { Chatter, FormField, FormViewToolbar } from '../common';
import StatusProgression from '../crm/StatusProgression';
import { helpdeskTicketService, HELPDESK_ENDPOINTS } from '../../services/resources/helpdeskService';
import { relationCacheService } from '../../services/relationCacheService';
import { useCompany } from '../../context/CompanyContext';
import { hasRole, SLA_CHIP_COLORS, SLA_STATUS_LABELS, SOURCE_OPTIONS } from './helpdeskConfig';
import useUnsavedWarning from '../../navigation/useUnsavedWarning';
import { MESSAGES, useNotify } from '../../context/NotificationContext';

const PARTNER_ENDPOINT = '/partner/view/all';
const EDITABLE_FIELDS = [
  'subject', 'customer_id', 'contact_id', 'email', 'phone', 'team_id', 'assigned_user_id',
  'ticket_type_id', 'priority_id', 'tag_ids', 'deadline', 'description', 'internal_notes',
];

const relation = (endpoint) => ({ endpoint, value_field: 'id', label_field: 'name' });
const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '—');
const blankToNull = (value) => (value === '' || value === undefined ? null : value);

const toFormValues = (ticket, defaults = {}) => {
  const source = ticket || defaults;
  const values = {};
  EDITABLE_FIELDS.forEach((field) => {
    values[field] = source[field] ?? (field === 'tag_ids' ? [] : '');
  });
  values.deadline = source.deadline ? String(source.deadline).slice(0, 10) : '';
  return values;
};

const toPayload = (form) => ({
  subject: form.subject?.trim(),
  customer_id: blankToNull(form.customer_id),
  contact_id: blankToNull(form.contact_id),
  email: blankToNull(form.email?.trim()),
  phone: blankToNull(form.phone?.trim()),
  team_id: blankToNull(form.team_id),
  assigned_user_id: blankToNull(form.assigned_user_id),
  ticket_type_id: blankToNull(form.ticket_type_id),
  priority_id: blankToNull(form.priority_id),
  tag_ids: Array.isArray(form.tag_ids) ? form.tag_ids : [],
  // The deadline is the end of the chosen day in the user's time zone.
  deadline: form.deadline ? new Date(`${form.deadline}T23:59:59`).toISOString() : null,
  description: blankToNull(form.description),
  internal_notes: blankToNull(form.internal_notes),
});

function ReadOnlyField({ label, children }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '0.625rem', color: '#64748B', fontWeight: 600 }}>{label}</Typography>
      <Typography component="div" sx={{ fontSize: '0.75rem', color: '#0F172A' }}>{children || '—'}</Typography>
    </Box>
  );
}

function SimpleTable({ columns, rows, emptyText }) {
  if (rows.length === 0) {
    return <Typography sx={{ fontSize: '0.6875rem', color: '#94A3B8', py: 1 }}>{emptyText}</Typography>;
  }
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {columns.map((column) => (
            <TableCell key={column.key} sx={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B' }}>{column.label}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            {columns.map((column) => (
              <TableCell key={column.key} sx={{ fontSize: '0.6875rem' }}>{column.render(row)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * TicketFormView
 *
 * Full-page ticket form: toolbar with record navigation, stage progression, workflow actions,
 * main information, notebook tabs and the Chatter. Every action calls the backend; the form
 * only decides which buttons to offer, the backend enforces the permissions.
 */
export default function TicketFormView({
  ticketId = null,
  defaults = {},
  records = [],
  lookups,
  me,
  onBack,
  onNavigateRecord,
  onNew,
  onChanged,
  parentLabel = 'Tickets',
}) {
  const { activeCompany } = useCompany();
  const { stages = [], teams = [], agents = [] } = lookups;

  const [ticket, setTicket] = useState(null);
  const [form, setForm] = useState(() => toFormValues(null, defaults));
  const [initialForm, setInitialForm] = useState(() => toFormValues(null, defaults));
  const [loading, setLoading] = useState(Boolean(ticketId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const notify = useNotify();
  const loadedId = useRef(null); // ticket currently shown, so a just-created ticket is not fetched again
  const [fieldErrors, setFieldErrors] = useState({});
  const [tab, setTab] = useState('description');
  const [slaLines, setSlaLines] = useState([]);
  const [rating, setRating] = useState({ value: 0, comment: '' });

  const isExisting = Boolean(ticket?.id);
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);
  useUnsavedWarning(isDirty);
  const currentStage = stages.find((stage) => stage.id === ticket?.stage_id);
  const isDone = Boolean(currentStage && (currentStage.is_resolved || currentStage.is_closed));

  const applyTicket = useCallback((record) => {
    loadedId.current = record.id;
    setTicket(record);
    const values = toFormValues(record);
    setForm(values);
    setInitialForm(values);
    setRating({ value: record.rating || 0, comment: record.rating_comment || '' });
  }, []);

  const loadSidePanels = useCallback(async (id) => {
    try {
      setSlaLines(await helpdeskTicketService.getSla(id));
    } catch (err) {
      setError(err.message || 'Failed to load the SLA information.');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (ticketId && loadedId.current === ticketId) return undefined;
    setError(null);
    setFieldErrors({});
    if (!ticketId) {
      loadedId.current = null;
      const values = toFormValues(null, defaults);
      setTicket(null);
      setForm(values);
      setInitialForm(values);
      setSlaLines([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    helpdeskTicketService
      .getById(ticketId)
      .then((record) => {
        if (!isMounted) return;
        applyTicket(record);
        loadSidePanels(record.id);
      })
      .catch((err) => {
        if (!isMounted) return;
        // Deleted, archived-away or not permitted: say so and return to the list.
        notify.error(err.message || 'Failed to load the ticket.');
        onBack?.();
      })
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
    // `defaults` is only read when a new ticket form opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, applyTicket, loadSidePanels]);

  /** Agents that can be assigned: members (and leader) of the selected team. */
  const agentOptions = useMemo(() => {
    const team = teams.find((item) => item.id === Number(form.team_id));
    if (!team) return [];
    const allowed = new Set([...(team.member_ids || []), team.team_leader_id].filter(Boolean));
    return agents.filter((agent) => allowed.has(agent.id)).map((agent) => ({ value: agent.id, label: agent.name }));
  }, [teams, agents, form.team_id]);

  const fillContactDetails = async (partnerId, next) => {
    if (!partnerId || (next.email && next.phone)) return next;
    const partners = await relationCacheService.getRelationRecords(PARTNER_ENDPOINT);
    const partner = partners.find((item) => item.id === Number(partnerId));
    if (!partner) return next;
    return { ...next, email: next.email || partner.email || '', phone: next.phone || partner.mobile || '' };
  };

  const handleChange = async (name, value) => {
    let next = { ...form, [name]: value };
    if (name === 'team_id') {
      const team = teams.find((item) => item.id === Number(value));
      const allowed = team ? [...(team.member_ids || []), team.team_leader_id] : [];
      if (next.assigned_user_id && !allowed.includes(Number(next.assigned_user_id))) {
        next.assigned_user_id = '';
      }
    }
    setForm(next);
    if ((name === 'customer_id' || name === 'contact_id') && value) {
      next = await fillContactDetails(value, next);
      setForm((current) => ({ ...current, email: current.email || next.email, phone: current.phone || next.phone }));
    }
  };

  const reportError = (err, fallback) => {
    setError(err.message || fallback);
    setFieldErrors(err.fieldErrors || {});
  };

  const handleSave = async (event) => {
    if (event) event.preventDefault();
    if (!form.subject?.trim()) {
      setFieldErrors({ subject: 'Subject is required.' });
      return;
    }
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const payload = toPayload(form);
      const saved = isExisting
        ? await helpdeskTicketService.update(ticket.id, payload)
        : await helpdeskTicketService.create({ ...payload, stage_id: defaults.stage_id || null });
      notify.success(isExisting ? MESSAGES.updated : MESSAGES.created);
      applyTicket(saved);
      await loadSidePanels(saved.id);
      onChanged?.(saved);
    } catch (err) {
      reportError(err, 'Failed to save the ticket.');
    } finally {
      setSaving(false);
    }
  };

  /** Runs a backend workflow action and refreshes the form with the returned ticket. */
  const runAction = async (name, body, successMessage) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await helpdeskTicketService.action(name, ticket.id, body);
      if (name === 'duplicate') {
        notify.success(`Ticket duplicated as ${updated.name}.`);
        onChanged?.(updated);
      } else {
        applyTicket(updated);
        await loadSidePanels(updated.id);
        onChanged?.(updated);
        notify.success(successMessage || MESSAGES.updated);
      }
    } catch (err) {
      reportError(err, 'The action could not be completed.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveToggle = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await helpdeskTicketService.update(ticket.id, { active: !ticket.active });
      notify.success(updated.active ? MESSAGES.updated : MESSAGES.archived);
      applyTicket(updated);
      onChanged?.(updated);
    } catch (err) {
      reportError(err, 'Failed to archive the ticket.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ticket ${ticket.name}? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await helpdeskTicketService.delete(ticket.id);
      notify.success(MESSAGES.deleted);
      onChanged?.(null);
      onBack?.();
    } catch (err) {
      reportError(err, 'Failed to delete the ticket.');
      setSaving(false);
    }
  };

  /** A customer-facing message can stop the SLA response clock, so reload the ticket. */
  const handleChatterActivity = async () => {
    const refreshed = await helpdeskTicketService.getById(ticket.id);
    setTicket(refreshed);
    await loadSidePanels(ticket.id);
    onChanged?.(refreshed);
  };

  const currentIndex = isExisting ? records.findIndex((record) => record.id === ticket.id) : -1;
  const busy = saving || loading;
  const field = (definition) => (
    <FormField
      field={definition}
      value={form[definition.name]}
      formData={form}
      onChange={handleChange}
      error={Boolean(fieldErrors[definition.name])}
      helperText={fieldErrors[definition.name] || definition.helperText}
      disabled={busy}
    />
  );

  const actionButton = (label, onClick, color = '#262755') => (
    <Button
      key={label}
      size="small"
      variant="outlined"
      onClick={onClick}
      disabled={busy || isDirty}
      sx={{ height: 26, fontSize: '0.6875rem', color, borderColor: '#CBD5E1' }}
    >
      {label}
    </Button>
  );

  const canAssignToMe = isExisting && me && ticket.assigned_user_id !== me.user_id
    && agentOptions.some((option) => option.value === me.user_id);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={24} sx={{ color: '#262755' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <FormViewToolbar
        onNew={onNew}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex !== -1 && currentIndex < records.length - 1}
        onPrev={() => onNavigateRecord?.(records[currentIndex - 1])}
        onNext={() => onNavigateRecord?.(records[currentIndex + 1])}
        currentIndex={currentIndex}
        totalRecords={records.length}
        onSave={handleSave}
        onDiscard={() => setForm(initialForm)}
        isDirty={isDirty}
        saving={saving}
        recordName={isExisting ? `${ticket.name} · ${ticket.subject}` : 'New Ticket'}
        parentBreadcrumb={{ label: parentLabel, onClick: onBack }}
      />

      {error && <Alert severity="error" sx={{ mb: 1.5, py: 0.25, fontSize: '0.6875rem' }}>{error}</Alert>}

      <Card component="form" onSubmit={handleSave} sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {/* Header: ticket number, workflow actions, stage progression */}
        {isExisting && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#262755' }}>{ticket.name}</Typography>
            {ticket.priority_name && (
              <Chip size="small" label={ticket.priority_name} sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700, color: '#FFFFFF', bgcolor: ticket.priority_color || '#64748B' }} />
            )}
            {!ticket.active && <Chip size="small" label="Archived" sx={{ height: 18, fontSize: '0.625rem' }} />}
            {canAssignToMe && actionButton('Assign to me', () => runAction('assign', { assigned_user_id: me.user_id }))}
            {!isDone && actionButton('Resolve', () => runAction('resolve'), '#059669')}
            {!currentStage?.is_closed && actionButton('Close', () => runAction('close'))}
            {isDone && hasRole(me, 'team_leader') && actionButton('Reopen', () => runAction('reopen'))}
            {!isDone && hasRole(me, 'team_leader') && actionButton('Escalate', () => runAction('escalate', {}, 'Ticket escalated to the highest priority.'), '#DC2626')}
            {actionButton('Duplicate', () => runAction('duplicate'))}
            {hasRole(me, 'team_leader') && actionButton(ticket.active ? 'Archive' : 'Unarchive', handleArchiveToggle)}
            {hasRole(me, 'manager') && actionButton('Delete', handleDelete, '#DC2626')}
            <Box sx={{ ml: 'auto' }}>
              <StatusProgression
                stages={stages}
                currentStageId={ticket.stage_id}
                onStageChange={(stageId) => Number(stageId) !== ticket.stage_id && runAction('stage', { stage_id: Number(stageId) })}
                loading={saving}
                disabled={busy || isDirty}
              />
            </Box>
          </Box>
        )}

        <Box sx={{ p: 2 }}>
          {/* Main information */}
          <Grid container spacing={2}>
            <Grid item xs={12}>{field({ name: 'subject', label: 'Subject', type: 'text', required: true })}</Grid>
            <Grid item xs={12} sm={6} md={3}>{field({ name: 'customer_id', label: 'Customer', type: 'many2one', relation: relation(PARTNER_ENDPOINT) })}</Grid>
            <Grid item xs={12} sm={6} md={3}>{field({ name: 'contact_id', label: 'Contact', type: 'many2one', relation: relation(PARTNER_ENDPOINT) })}</Grid>
            <Grid item xs={12} sm={6} md={3}>{field({ name: 'email', label: 'Email', type: 'text' })}</Grid>
            <Grid item xs={12} sm={6} md={3}>{field({ name: 'phone', label: 'Phone', type: 'text' })}</Grid>
            <Grid item xs={12} sm={6} md={3}>{field({ name: 'team_id', label: 'Team', type: 'many2one', relation: relation(HELPDESK_ENDPOINTS.teams) })}</Grid>
            <Grid item xs={12} sm={6} md={3}>
              {field({
                name: 'assigned_user_id', label: 'Assigned Agent', type: 'selection', options: agentOptions,
                helperText: form.team_id ? (agentOptions.length === 0 ? 'This team has no members.' : '') : 'Select a team first.',
              })}
            </Grid>
            <Grid item xs={12} sm={6} md={3}>{field({ name: 'ticket_type_id', label: 'Ticket Type', type: 'many2one', relation: relation(HELPDESK_ENDPOINTS.ticketTypes) })}</Grid>
            <Grid item xs={12} sm={6} md={3}>{field({ name: 'priority_id', label: 'Priority', type: 'many2one', relation: relation(HELPDESK_ENDPOINTS.priorities) })}</Grid>
            <Grid item xs={12} sm={8} md={9}>{field({ name: 'tag_ids', label: 'Tags', type: 'many2many', relation: relation(HELPDESK_ENDPOINTS.tags) })}</Grid>
            <Grid item xs={12} sm={4} md={3}>{field({ name: 'deadline', label: 'Deadline', type: 'date' })}</Grid>
          </Grid>

          {/* Additional information (read-only, maintained by the backend) */}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6} md={2}><ReadOnlyField label="Company">{activeCompany?.name}</ReadOnlyField></Grid>
            <Grid item xs={6} md={2}><ReadOnlyField label="Created Date">{isExisting ? formatDateTime(ticket.created_at) : 'On save'}</ReadOnlyField></Grid>
            <Grid item xs={6} md={2}>
              <ReadOnlyField label="SLA Status">
                {ticket?.sla_status ? (
                  <Chip size="small" color={SLA_CHIP_COLORS[SLA_STATUS_LABELS[ticket.sla_status]] || 'default'} label={SLA_STATUS_LABELS[ticket.sla_status]} sx={{ height: 18, fontSize: '0.625rem', fontWeight: 600 }} />
                ) : 'No SLA'}
              </ReadOnlyField>
            </Grid>
            <Grid item xs={6} md={3}><ReadOnlyField label="Response Deadline">{formatDateTime(ticket?.response_deadline)}</ReadOnlyField></Grid>
            <Grid item xs={6} md={3}><ReadOnlyField label="Resolution Deadline">{formatDateTime(ticket?.resolution_deadline)}</ReadOnlyField></Grid>
          </Grid>

          {/* Notebook */}
          <Tabs
            value={tab}
            onChange={(_event, value) => setTab(value)}
            sx={{ mt: 2, minHeight: 32, borderBottom: '1px solid #E2E8F0', '& .MuiTab-root': { minHeight: 32, fontSize: '0.6875rem', textTransform: 'none', fontWeight: 600 } }}
          >
            <Tab value="description" label="Description" />
            <Tab value="notes" label="Internal Notes" />
            <Tab value="sla" label="SLA Information" disabled={!isExisting} />
            <Tab value="other" label="Other Information" disabled={!isExisting} />
          </Tabs>
          <Box sx={{ pt: 1.5 }}>
            {tab === 'description' && field({ name: 'description', label: 'Description', type: 'textarea', rows: 5 })}
            {tab === 'notes' && field({ name: 'internal_notes', label: 'Internal Notes (never shown to customers)', type: 'textarea', rows: 5 })}
            {tab === 'sla' && isExisting && (
              <>
                <SimpleTable
                  emptyText="No SLA policy applies to this ticket."
                  rows={slaLines}
                  columns={[
                    { key: 'policy', label: 'Policy', render: (row) => row.policy_name },
                    { key: 'response', label: 'Response Deadline', render: (row) => formatDateTime(row.response_deadline) },
                    { key: 'responded', label: 'Responded', render: (row) => formatDateTime(row.response_reached_at) },
                    { key: 'resolution', label: 'Resolution Deadline', render: (row) => formatDateTime(row.resolution_deadline) },
                    { key: 'resolved', label: 'Reached', render: (row) => formatDateTime(row.resolution_reached_at) },
                    { key: 'status', label: 'Status', render: (row) => SLA_STATUS_LABELS[row.status] || row.status },
                  ]}
                />
                <Box sx={{ mt: 1 }}>{actionButton('Re-apply SLA policies', () => runAction('apply_sla', {}, 'SLA policies re-applied.'))}</Box>
              </>
            )}
            {tab === 'other' && isExisting && (
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}><ReadOnlyField label="Source">{SOURCE_OPTIONS.find((o) => o.value === ticket.source)?.label}</ReadOnlyField></Grid>
                <Grid item xs={6} md={3}><ReadOnlyField label="First Response">{formatDateTime(ticket.first_response_date)}</ReadOnlyField></Grid>
                <Grid item xs={6} md={3}><ReadOnlyField label="Resolved Date">{formatDateTime(ticket.resolved_date)}</ReadOnlyField></Grid>
                <Grid item xs={6} md={3}><ReadOnlyField label="Closed Date">{formatDateTime(ticket.closed_date)}</ReadOnlyField></Grid>
                <Grid item xs={6} md={3}><ReadOnlyField label="Created By">{agents.find((a) => a.id === ticket.create_uid)?.name || (ticket.create_uid ? `User #${ticket.create_uid}` : null)}</ReadOnlyField></Grid>
                <Grid item xs={6} md={3}><ReadOnlyField label="Last Updated">{formatDateTime(ticket.updated_at)}</ReadOnlyField></Grid>
                <Grid item xs={12} md={6}>
                  <Typography sx={{ fontSize: '0.625rem', color: '#64748B', fontWeight: 600 }}>Customer Rating</Typography>
                  {isDone ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Rating size="small" value={rating.value} onChange={(_event, value) => setRating((current) => ({ ...current, value: value || 0 }))} />
                      <TextField size="small" placeholder="Customer comment" value={rating.comment} onChange={(e) => setRating((current) => ({ ...current, comment: e.target.value }))} InputProps={{ sx: { fontSize: '0.6875rem' } }} sx={{ flexGrow: 1, minWidth: 160 }} />
                      <Button size="small" variant="outlined" disabled={busy || !rating.value} onClick={() => runAction('rate', { rating: rating.value, rating_comment: rating.comment || null }, 'Rating saved.')} sx={{ height: 26, fontSize: '0.6875rem' }}>
                        Save rating
                      </Button>
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: '0.75rem', color: '#0F172A' }}>Available once the ticket is resolved.</Typography>
                  )}
                </Grid>
              </Grid>
            )}
          </Box>
        </Box>
      </Card>

      {isExisting && (
        <Chatter model="helpdesk_ticket" recordId={ticket.id} refreshKey={ticket} onActivity={handleChatterActivity} />
      )}
    </Box>
  );
}
