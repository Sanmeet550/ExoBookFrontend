import React, { useState, useEffect, useCallback } from 'react';
import useRecordRoute from '../../../navigation/useRecordRoute';
import { MESSAGES, savedRecordOf, useNotify } from '../../../context/NotificationContext';
import {
  Box,
  Card,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Button,
  Snackbar,
} from '@mui/material';
import {
  SaveOutlined as SaveIcon,
  Close as CloseIcon,
  DeleteOutline as DeleteIcon,
  Add as AddIcon,
  Groups as GroupsIcon,
  PersonOutline as PersonIcon,
} from '@mui/icons-material';
import { DynamicListView, DynamicKanbanView, ViewSwitcher, FormViewToolbar } from '../../common';
import { salesTeamService } from '../../../services/resources/salesTeamService';
import { usersService } from '../../../services/resources/usersService';
import { MODEL_METADATA } from '../../../config/modelMetadata';

/**
 * Sales Team module config
 */
export const salesTeamConfig = {
  title: 'Sales Teams',
  primaryKey: 'id',
  createButtonText: 'New Team',
  model: 'salesTeam',
  columns: [
    { field: 'id', headerName: 'ID', width: 70, sortable: true },
    { field: 'name', headerName: 'Team Name', flex: 1.5, sortable: true },
    { field: 'member_name', headerName: 'Team Member', flex: 1.5, sortable: true },
    { field: 'created_at', headerName: 'Created', width: 160, sortable: true },
  ],
  formFields: MODEL_METADATA.salesTeam.fields,
  kanban: {
    kanbanCard: {
      titleField: 'name',
      subtitleField: 'member_name',
      badgeField: 'member_name',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SalesTeamFormView – inline form for create / edit
// ─────────────────────────────────────────────────────────────────────────────
function SalesTeamFormView({
  initialData = null,
  records = [],
  onNavigateRecord,
  onNew,
  onSave,
  onBack,
  loading = false,
  error = null,
  fieldErrors = {},
  users = [],
  loadingUsers = false,
}) {
  const isEditMode = Boolean(initialData && initialData.id);
  const [formData, setFormData] = useState({ name: '', team_member_id: '' });
  const [isDirty, setIsDirty] = useState(false);
  const initialRef = React.useRef({});

  const currentIndex = isEditMode ? records.findIndex((r) => r.id === initialData.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < records.length - 1;

  useEffect(() => {
    const vals = {
      name: initialData?.name || '',
      team_member_id: initialData?.team_member_id ?? '',
    };
    setFormData(vals);
    initialRef.current = { ...vals };
    setIsDirty(false);
  }, [initialData]);

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    const next = { ...formData, [field]: val };
    setFormData(next);
    setIsDirty(
      Object.keys(next).some(
        (k) => String(next[k] ?? '').trim() !== String(initialRef.current[k] ?? '').trim()
      )
    );
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (onSave) {
      onSave({ ...formData });
      initialRef.current = { ...formData };
      setIsDirty(false);
    }
  };

  const handleDiscard = () => {
    setFormData({ ...initialRef.current });
    setIsDirty(false);
  };

  const breadcrumbLabel = initialData
    ? initialData.name || `Team #${initialData.id}`
    : 'New Team';

  return (
    <Box sx={{ width: '100%', p: 0 }}>
      <FormViewToolbar
        onNew={onNew}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={() => hasPrev && onNavigateRecord && onNavigateRecord(records[currentIndex - 1])}
        onNext={() => hasNext && onNavigateRecord && onNavigateRecord(records[currentIndex + 1])}
        currentIndex={currentIndex}
        totalRecords={records.length}
        onSave={handleSubmit}
        onDiscard={handleDiscard}
        isDirty={isDirty}
        saving={loading}
        recordName={breadcrumbLabel}
        parentBreadcrumb={{ label: 'Sales Teams', onClick: onBack }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 1.5, py: 0.25, fontSize: '0.6875rem' }}>
          {error}
        </Alert>
      )}

      <Card
        component="form"
        onSubmit={handleSubmit}
        sx={{
          bgcolor: 'white',
          p: 2.5,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderRadius: '4px',
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          {/* Team Name */}
          <TextField
            fullWidth
            size="small"
            required
            label="Team Name"
            placeholder="e.g. North India Sales"
            value={formData.name}
            onChange={handleChange('name')}
            error={Boolean(fieldErrors.name)}
            helperText={fieldErrors.name}
            disabled={loading}
            inputProps={{ style: { fontSize: '0.8125rem', fontWeight: 600 } }}
            InputLabelProps={{ style: { fontSize: '0.75rem' } }}
          />

          {/* Team Member (many-to-one → Users) */}
          <TextField
            fullWidth
            size="small"
            select
            label="Team Member"
            value={formData.team_member_id ?? ''}
            onChange={handleChange('team_member_id')}
            error={Boolean(fieldErrors.team_member_id)}
            helperText={fieldErrors.team_member_id}
            disabled={loading || loadingUsers}
            inputProps={{ style: { fontSize: '0.75rem' } }}
            InputLabelProps={{ style: { fontSize: '0.75rem' } }}
          >
            <MenuItem value="" sx={{ fontSize: '0.75rem' }}>
              <em>— None —</em>
            </MenuItem>
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id} sx={{ fontSize: '0.75rem' }}>
                {u.name} {u.login ? `(${u.login})` : ''}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Card>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SalesTeamKanbanCard – individual card for Kanban
// ─────────────────────────────────────────────────────────────────────────────
function SalesTeamKanbanCard({ record, onClick, onDelete }) {
  const initials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const avatarColor = (name) => {
    const palette = ['#262755', '#714B67', '#0D9488', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316'];
    if (!name) return palette[0];
    const idx = name.charCodeAt(0) % palette.length;
    return palette[idx];
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        p: 1.5,
        mb: 1,
        cursor: 'pointer',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        borderRadius: '6px',
        bgcolor: '#FFFFFF',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderColor: '#CBD5E1',
        },
      }}
    >
      {/* Team name + delete */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '6px',
              bgcolor: avatarColor(record.name),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <GroupsIcon sx={{ fontSize: 15, color: '#FFFFFF' }} />
          </Box>
          <Typography
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: '#0F172A',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {record.name}
          </Typography>
        </Box>
        <Tooltip title="Delete team">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(record.id); }}
            sx={{
              p: 0.3,
              color: '#94A3B8',
              '&:hover': { color: '#DC2626', bgcolor: 'rgba(220,38,38,0.08)' },
            }}
          >
            <DeleteIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Team member */}
      {record.member_name ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
          <Avatar
            sx={{
              width: 20,
              height: 20,
              fontSize: '0.55rem',
              fontWeight: 700,
              bgcolor: avatarColor(record.member_name),
              color: '#FFFFFF',
            }}
          >
            {initials(record.member_name)}
          </Avatar>
          <Typography sx={{ fontSize: '0.6875rem', color: '#475569', fontWeight: 500 }}>
            {record.member_name}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <PersonIcon sx={{ fontSize: 13, color: '#CBD5E1' }} />
          <Typography sx={{ fontSize: '0.6875rem', color: '#94A3B8', fontStyle: 'italic' }}>
            No member assigned
          </Typography>
        </Box>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SalesTeamKanbanView – ungrouped Kanban grid
// ─────────────────────────────────────────────────────────────────────────────
function SalesTeamKanbanView({ data, loading, error, onCardClick, onCreateClick, onDeleteClick, breadcrumbs, viewSwitchControl }) {
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(0);
  const rowsPerPage = 12;

  const filtered = React.useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.member_name || '').toLowerCase().includes(q)
    );
  }, [data, search]);

  const paged = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          mb: 1.5,
        }}
      >
        {/* Left: New button first, same position and style as the standard List View */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => onCreateClick && onCreateClick()}
            sx={{
              minWidth: 50,
              height: 28,
              px: 1.4,
              py: 0,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#262755',
              borderColor: '#CBD5E1',
              bgcolor: '#FFFFFF',
              textTransform: 'none',
              borderRadius: '4px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' },
            }}
          >
            New
          </Button>
          <Box>
          {breadcrumbs?.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8' }}>/</Typography>}
                  <Typography
                    onClick={b.onClick}
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: b.onClick ? 600 : 500,
                      color: b.onClick ? '#0D9488' : '#475569',
                      cursor: b.onClick ? 'pointer' : 'default',
                      '&:hover': b.onClick ? { textDecoration: 'underline' } : {},
                    }}
                  >
                    {b.label}
                  </Typography>
                </React.Fragment>
              ))}
            </Box>
          )}
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
            Sales Teams
          </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ width: 220, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
            InputProps={{
              startAdornment: (
                <Box component="span" sx={{ color: '#94A3B8', mr: 0.5, display: 'flex' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </Box>
              ),
            }}
          />
          {viewSwitchControl}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 1.5, py: 0.25, fontSize: '0.6875rem' }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
          <CircularProgress size={28} sx={{ color: '#262755' }} />
        </Box>
      ) : paged.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <GroupsIcon sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />
          <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            {search ? 'No teams match your search.' : 'No sales teams yet. Create the first one!'}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 1.5,
          }}
        >
          {paged.map((record) => (
            <SalesTeamKanbanCard
              key={record.id}
              record={record}
              onClick={() => onCardClick && onCardClick(record)}
              onDelete={onDeleteClick}
            />
          ))}
        </Box>
      )}

      {/* Pagination */}
      {filtered.length > rowsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
              {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filtered.length)} of {filtered.length}
            </Typography>
            <Button
              size="small"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              sx={{ minWidth: 32, fontSize: '0.75rem' }}
            >
              ‹
            </Button>
            <Button
              size="small"
              disabled={(page + 1) * rowsPerPage >= filtered.length}
              onClick={() => setPage((p) => p + 1)}
              sx={{ minWidth: 32, fontSize: '0.75rem' }}
            >
              ›
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SalesTeam – main orchestrator
// ─────────────────────────────────────────────────────────────────────────────
export default function SalesTeam({ parentBreadcrumb = 'CRM' }) {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [listError, setListError] = useState(null);

  const [viewMode, setViewMode] = useState('list');   // 'list' | 'kanban' | 'form'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const notify = useNotify();
  const [snackbar, setSnackbar] = useState(null);

  // ── Load all users once ──────────────────────────────────────────────────
  useEffect(() => {
    setLoadingUsers(true);
    usersService
      .getAll()
      .then((res) => setUsers(Array.isArray(res) ? res : []))
      .catch((err) => console.error('Failed to load users:', err))
      .finally(() => setLoadingUsers(false));
  }, []);

  // ── Build user map for display ──────────────────────────────────────────
  const userMap = React.useMemo(() => {
    const m = {};
    users.forEach((u) => { if (u && u.id) m[u.id] = u.name || u.login || `User #${u.id}`; });
    return m;
  }, [users]);

  // ── Load sales teams ────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const records = await salesTeamService.getAll();
      const list = Array.isArray(records) ? records : [];
      const enriched = list.map((r) => ({
        ...r,
        member_name: r.team_member_id ? (userMap[r.team_member_id] || `User #${r.team_member_id}`) : '—',
      }));
      setData(enriched);
    } catch (err) {
      console.error('SalesTeam load error:', err);
      setListError(err.message || 'Failed to load sales teams.');
    } finally {
      setLoading(false);
    }
  }, [userMap]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Form handlers ───────────────────────────────────────────────────────
  const handleOpenForm = (record = null) => {
    setSelectedRecord(record);
    setFormError(null);
    setFieldErrors({});
    setViewMode('form');
  };

  const handleBackToList = () => {
    setSelectedRecord(null);
    setFormError(null);
    setFieldErrors({});
    setViewMode((prev) => (prev === 'form' ? 'list' : prev));
  };

  const handleSave = async (formData) => {
    setFormLoading(true);
    setFormError(null);
    setFieldErrors({});

    if (!formData.name?.trim()) {
      setFieldErrors({ name: 'Team name is required.' });
      setFormLoading(false);
      return;
    }

    const isExisting = Boolean(selectedRecord && selectedRecord.id);
    const payload = {
      name: formData.name.trim(),
      team_member_id: formData.team_member_id ? Number(formData.team_member_id) : null,
    };

    let savedRecord = null;
    try {
      if (isExisting) {
        savedRecord = await salesTeamService.update(selectedRecord.id, payload);
      } else {
        savedRecord = await salesTeamService.create(payload);
      }
      await loadData();
      notify.success(isExisting ? MESSAGES.updated : MESSAGES.created);
      // Stay on the form: a created record continues as an existing one (its id goes into the URL).
      const nextRecord = savedRecordOf(savedRecord, payload, selectedRecord);
      if (nextRecord) setSelectedRecord(nextRecord);
      else handleBackToList();
    } catch (err) {
      console.error('SalesTeam save error:', err);
      setFormError(err.message || 'Failed to save sales team.');
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sales team?')) return;
    try {
      await salesTeamService.delete(id);
      notify.success(MESSAGES.deleted);
      setData((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('SalesTeam delete error:', err);
      setListError(err.message || 'Failed to delete sales team.');
    }
  };

  // ── Breadcrumbs ─────────────────────────────────────────────────────────
  // URL <-> screen sync: refresh, deep links and Back/Forward reopen the same record.
  useRecordRoute({ viewMode, selectedRecord, data, loading, onOpen: handleOpenForm, onClose: handleBackToList });

  const breadcrumbs = [
    { label: parentBreadcrumb },
    { label: 'Settings' },
    { label: 'Sales Teams', onClick: viewMode === 'form' ? handleBackToList : undefined },
  ];
  if (viewMode === 'form') {
    breadcrumbs.push({
      label: selectedRecord ? (selectedRecord.name || `Team #${selectedRecord.id}`) : 'New Team',
    });
  }

  // ── View switcher ───────────────────────────────────────────────────────
  const viewSwitchControl = (
    <ViewSwitcher
      currentView={viewMode === 'form' ? 'list' : viewMode}
      onViewChange={(m) => setViewMode(m)}
    />
  );

  // ── Form view ───────────────────────────────────────────────────────────
  if (viewMode === 'form') {
    return (
      <>
        <SalesTeamFormView
          initialData={selectedRecord}
          records={data}
          onNavigateRecord={(rec) => handleOpenForm(rec)}
          onNew={() => handleOpenForm(null)}
          onSave={handleSave}
          onBack={handleBackToList}
          loading={formLoading}
          error={formError}
          fieldErrors={fieldErrors}
          users={users}
          loadingUsers={loadingUsers}
        />
        <Snackbar
          open={Boolean(snackbar)}
          autoHideDuration={3000}
          onClose={() => setSnackbar(null)}
          message={snackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </>
    );
  }

  // ── Kanban view ─────────────────────────────────────────────────────────
  if (viewMode === 'kanban') {
    return (
      <>
        <SalesTeamKanbanView
          data={data}
          loading={loading}
          error={listError}
          onCardClick={(rec) => handleOpenForm(rec)}
          onCreateClick={() => handleOpenForm(null)}
          onDeleteClick={handleDelete}
          breadcrumbs={breadcrumbs}
          viewSwitchControl={viewSwitchControl}
        />
        <Snackbar
          open={Boolean(snackbar)}
          autoHideDuration={3000}
          onClose={() => setSnackbar(null)}
          message={snackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </>
    );
  }

  // ── List view (default) ─────────────────────────────────────────────────
  return (
    <>
      <DynamicListView
        config={salesTeamConfig}
        data={data}
        loading={loading}
        error={listError}
        onRowClick={(rec) => handleOpenForm(rec)}
        onCreateClick={() => handleOpenForm(null)}
        onDeleteClick={handleDelete}
        breadcrumbs={breadcrumbs}
        viewSwitchControl={viewSwitchControl}
      />
      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}

