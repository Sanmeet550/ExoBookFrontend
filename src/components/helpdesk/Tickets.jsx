import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, FormControlLabel, MenuItem, Switch, TextField } from '@mui/material';
import { DynamicKanbanView, DynamicListView, ViewSwitcher } from '../common';
import TicketFormView from './TicketFormView';
import {
  helpdeskPriorityService, helpdeskService, helpdeskStageService, helpdeskTeamService, helpdeskTicketService,
} from '../../services/resources/helpdeskService';
import { hasRole, SLA_CHIP_COLORS, SLA_STATUS_LABELS } from './helpdeskConfig';
import useRecordRoute from '../../navigation/useRecordRoute';
import { MESSAGES, useNotify } from '../../context/NotificationContext';

const PAGE_SIZE = 500;
const STAGE_COLORS = ['#3B82F6', '#EAB308', '#8B5CF6', '#06B6D4', '#10B981', '#64748B', '#EC4899', '#F97316'];
const DUE_SOON_MS = 2 * 60 * 60 * 1000;

const MODES = {
  mine: { title: 'My Tickets', params: { mine: true } },
  all: { title: 'All Tickets', params: {} },
  ratings: { title: 'Customer Ratings', params: { rated: true } },
};

const BASE_COLUMNS = [
  { field: 'name', headerName: 'Ticket Number', width: 120, sortable: true },
  { field: 'subject', headerName: 'Subject', flex: 1.5, sortable: true },
  { field: 'customer_label', headerName: 'Customer', flex: 1, sortable: true },
  { field: 'team_label', headerName: 'Team', width: 130, sortable: true },
  { field: 'agent_label', headerName: 'Assigned Agent', width: 140, sortable: true },
  { field: 'priority_label', headerName: 'Priority', width: 90, sortable: true },
  { field: 'stage_name', headerName: 'Stage', width: 150, sortable: true },
  { field: 'sla_label', headerName: 'SLA Status', width: 110, sortable: true, type: 'chip', chipColors: SLA_CHIP_COLORS },
  { field: 'created_label', headerName: 'Created Date', width: 110, sortable: true },
];

const RATING_COLUMNS = [
  { field: 'rating_label', headerName: 'Rating', width: 90, sortable: true },
  { field: 'rating_comment', headerName: 'Customer Comment', flex: 1.5, sortable: true },
];

/** SLA warnings shown on Kanban cards, derived from the deadlines the backend calculated. */
const slaWarning = (ticket) => {
  if (ticket.sla_status === 'failed') return 'SLA failed';
  if (ticket.sla_status !== 'in_progress') return null;
  const deadlines = [ticket.response_deadline, ticket.resolution_deadline].filter(Boolean).map((d) => new Date(d).getTime());
  if (deadlines.length === 0) return null;
  return Math.min(...deadlines) - Date.now() < DUE_SOON_MS ? 'SLA due soon' : null;
};

const toRow = (ticket) => ({
  ...ticket,
  customer_label: ticket.customer_name || '—',
  team_label: ticket.team_name || '—',
  agent_label: ticket.assigned_user_name || 'Unassigned',
  priority_label: ticket.priority_name || '—',
  sla_label: SLA_STATUS_LABELS[ticket.sla_status] || 'No SLA',
  created_label: ticket.created_at ? String(ticket.created_at).slice(0, 10) : '—',
  rating_label: ticket.rating ? `${ticket.rating} / 5` : '—',
  kanban_tags: [ticket.priority_name, slaWarning(ticket), ...(ticket.tags || []).map((tag) => tag.name)].filter(Boolean),
});

function FilterSelect({ label, value, onChange, options }) {
  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ minWidth: 130 }}
      InputProps={{ sx: { fontSize: '0.6875rem' } }}
      InputLabelProps={{ sx: { fontSize: '0.6875rem' } }}
    >
      <MenuItem value="" sx={{ fontSize: '0.6875rem' }}><em>All</em></MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.6875rem' }}>{option.label}</MenuItem>
      ))}
    </TextField>
  );
}

/**
 * Tickets
 *
 * Ticket workspace for one saved filter ("My Tickets", "All Tickets", "Customer Ratings"):
 * shared ListView + Kanban, server-side filters, and the ticket form.
 */
export default function Tickets({ mode = 'all', me }) {
  const modeConfig = MODES[mode] || MODES.all;
  const notify = useNotify();

  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [lookups, setLookups] = useState({ stages: [], priorities: [], teams: [], agents: [] });
  const [filters, setFilters] = useState({ stage_id: '', team_id: '', priority_id: '', sla_status: '', assigned_user_id: '', archived: false });
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [viewMode, setViewMode] = useState(mode === 'ratings' ? 'list' : 'kanban');
  const [formState, setFormState] = useState(null); // { ticketId, defaults, key } when the form is open

  const loadLookups = useCallback(async () => {
    const [stages, priorities, teams, agents] = await Promise.all([
      helpdeskStageService.getAll({ active_only: true }),
      helpdeskPriorityService.getAll({ active_only: true }),
      helpdeskTeamService.getAll({ active_only: true }),
      helpdeskService.agents(),
    ]);
    setLookups({ stages, priorities, teams, agents });
  }, []);

  const loadTickets = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setListError(null);
    try {
      const page = await helpdeskTicketService.getPage({ page_size: PAGE_SIZE, ...modeConfig.params, ...filters });
      setTickets((page.items || []).map(toRow));
      setTotal(page.total || 0);
    } catch (err) {
      setListError(err.message || 'Failed to load tickets.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [modeConfig, filters]);

  useEffect(() => {
    loadLookups().catch((err) => setListError(err.message || 'Failed to load Helpdesk configuration.'));
  }, [loadLookups]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const config = useMemo(() => {
    const stageColumns = lookups.stages.map((stage, index) => ({
      value: stage.id,
      label: stage.name,
      color: stage.is_resolved || stage.is_closed ? '#10B981' : STAGE_COLORS[index % STAGE_COLORS.length],
    }));
    const priorityColumns = lookups.priorities.map((priority) => ({
      value: priority.id, label: priority.name, color: priority.color || '#64748B',
    }));
    return {
      title: modeConfig.title,
      primaryKey: 'id',
      createButtonText: 'New Ticket',
      modelName: `helpdesk_ticket_${mode}`,
      registryModel: 'helpdesk_ticket',
      columns: mode === 'ratings' ? [...BASE_COLUMNS.slice(0, 5), ...RATING_COLUMNS] : BASE_COLUMNS,
      kanban: {
        defaultGroupField: 'stage_id',
        groupingOptions: [
          { field: 'stage_id', label: 'Stage', columns: stageColumns },
          { field: 'priority_id', label: 'Priority', columns: priorityColumns },
        ],
        kanbanCard: {
          titleField: 'subject',
          subtitleField: 'customer_label',
          dateField: 'created_label',
          tagsField: 'kanban_tags',
          extraFields: [
            { name: 'name', label: 'Ticket' },
            { name: 'agent_label', label: 'Agent' },
            { name: 'sla_label', label: 'SLA' },
          ],
        },
      },
    };
  }, [lookups, modeConfig, mode]);

  const openForm = (record = null, defaults = {}) => setFormState({ ticketId: record?.id || null, defaults, key: Date.now() });

  // URL <-> screen sync. A ticket is opened by id even when it is not in the loaded list
  // (archived, filtered out, or reached from a link); the form itself reports a missing ticket.
  useRecordRoute({
    viewMode: formState ? 'form' : 'list',
    selectedRecord: formState?.ticketId ? { id: formState.ticketId } : null,
    onOpen: openForm,
    onClose: () => setFormState(null),
    lookup: (id) => (/^\d+$/.test(id) ? { id: Number(id) } : null),
  });

  const handleDelete = async (id, options = {}) => {
    if (!options?.skipConfirm && !window.confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await helpdeskTicketService.delete(id);
      notify.success(MESSAGES.deleted);
      await loadTickets();
    } catch (err) {
      setListError(err.message || 'Failed to delete the ticket.');
      throw err;
    }
  };

  /** Kanban drag-and-drop: moving between stage columns changes the stage, between priority columns the priority. */
  const handleRecordMove = async (record, targetValue, groupField) => {
    const target = targetValue ? Number(targetValue) : null;
    if (!target) return;
    const previous = tickets;
    setTickets((current) => current.map((item) => (item.id === record.id ? { ...item, [groupField]: target } : item)));
    try {
      if (groupField === 'stage_id') {
        await helpdeskTicketService.action('stage', record.id, { stage_id: target });
      } else {
        await helpdeskTicketService.update(record.id, { [groupField]: target });
      }
      // Reload quietly: the backend also updates dates and SLA status when the stage changes.
      await loadTickets({ silent: true });
    } catch (err) {
      setTickets(previous);
      throw err;
    }
  };

  const setFilter = (name) => (value) => setFilters((current) => ({ ...current, [name]: value }));
  const toOptions = (records) => records.map((record) => ({ value: record.id, label: record.name }));

  if (formState) {
    return (
      <TicketFormView
        key={formState.key}
        ticketId={formState.ticketId}
        defaults={formState.defaults}
        records={tickets}
        lookups={lookups}
        me={me}
        parentLabel={modeConfig.title}
        onBack={() => setFormState(null)}
        onNavigateRecord={(record) => record && openForm(record)}
        onNew={() => openForm(null)}
        onChanged={(saved) => {
          loadTickets();
          // A ticket that was just created keeps the form open under its new id.
          if (saved?.id && !formState.ticketId) setFormState((current) => current && { ...current, ticketId: saved.id });
        }}
      />
    );
  }

  const breadcrumbs = [{ label: 'Helpdesk' }, { label: modeConfig.title }];
  const viewSwitchControl = <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />;

  const filterBar = (
    <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
      <FilterSelect label="Stage" value={filters.stage_id} onChange={setFilter('stage_id')} options={toOptions(lookups.stages)} />
      <FilterSelect label="Team" value={filters.team_id} onChange={setFilter('team_id')} options={toOptions(lookups.teams)} />
      <FilterSelect label="Priority" value={filters.priority_id} onChange={setFilter('priority_id')} options={toOptions(lookups.priorities)} />
      <FilterSelect
        label="SLA Status"
        value={filters.sla_status}
        onChange={setFilter('sla_status')}
        options={Object.entries(SLA_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
      />
      {mode !== 'mine' && (
        <FilterSelect label="Assigned Agent" value={filters.assigned_user_id} onChange={setFilter('assigned_user_id')} options={toOptions(lookups.agents)} />
      )}
      <FormControlLabel
        control={<Switch size="small" checked={filters.archived} onChange={(e) => setFilter('archived')(e.target.checked)} />}
        label="Archived"
        componentsProps={{ typography: { sx: { fontSize: '0.6875rem' } } }}
      />
    </Box>
  );

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {filterBar}
      {total > tickets.length && (
        <Alert severity="info" sx={{ mb: 1.5, py: 0.25, fontSize: '0.6875rem' }}>
          Showing the {tickets.length} most recent of {total} tickets. Use the filters to narrow the list.
        </Alert>
      )}
      {viewMode === 'kanban' ? (
        <DynamicKanbanView
          config={config}
          data={tickets}
          loading={loading}
          error={listError}
          onCardClick={(record) => openForm(record)}
          onCreateClick={(defaults) => openForm(null, defaults || {})}
          onRecordMove={handleRecordMove}
          breadcrumbs={breadcrumbs}
          viewSwitchControl={viewSwitchControl}
        />
      ) : (
        <DynamicListView
          config={config}
          data={tickets}
          loading={loading}
          error={listError}
          onRowClick={(record) => openForm(record)}
          onCreateClick={() => openForm(null)}
          onDeleteClick={hasRole(me, 'manager') ? handleDelete : undefined}
          onBulkArchive={async (ids) => {
            await Promise.all(ids.map((id) => helpdeskTicketService.update(id, { active: false })));
            notify.success(MESSAGES.archived);
          }}
          onBulkDuplicate={async (ids) => {
            await Promise.all(ids.map((id) => helpdeskTicketService.action('duplicate', id)));
          }}
          onRefresh={loadTickets}
          breadcrumbs={breadcrumbs}
          viewSwitchControl={viewSwitchControl}
        />
      )}
    </Box>
  );
}
