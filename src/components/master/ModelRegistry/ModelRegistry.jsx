import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, Chip, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import { Sync } from '@mui/icons-material';
import { DynamicListView } from '../../common';
import AppBreadcrumbs from '../../AppBreadcrumbs';
import { modelRegistryService } from '../../../services/resources/modelRegistryService';
import useRecordRoute from '../../../navigation/useRecordRoute';
import { useNotify } from '../../../context/NotificationContext';

const listConfig = {
  title: 'Models',
  primaryKey: 'id',
  modelName: 'ir_model',
  registryModel: 'ir_model',
  columns: [
    { field: 'name', headerName: 'Technical Name', flex: 1, sortable: true },
    { field: 'label', headerName: 'Model', flex: 1, sortable: true },
    { field: 'model_class', headerName: 'Class', flex: 1, sortable: true },
    { field: 'module', headerName: 'Module', width: 140, sortable: true },
    { field: 'field_count', headerName: 'Fields', width: 90, sortable: true },
  ],
};

const TYPE_COLORS = {
  many2one: '#2563EB', one2many: '#7C3AED', many2many: '#DB2777', selection: '#D97706',
  boolean: '#059669', date: '#0891B2', datetime: '#0891B2', number: '#475569', text: '#64748B',
};

const cellSx = { fontSize: '0.6875rem' };
const headSx = { fontSize: '0.625rem', fontWeight: 700, color: '#64748B' };
const yes = (value) => (value ? 'Yes' : '');

function ModelFields({ model, onBack }) {
  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem', lineHeight: 1.2 }}>
            {model.label} <Typography component="span" sx={{ fontSize: '0.75rem', color: '#64748B' }}>({model.name})</Typography>
          </Typography>
          <AppBreadcrumbs items={[{ label: 'Master' }, { label: 'Models', onClick: onBack }, { label: model.name }]} />
        </Box>
        <Typography sx={{ ml: 'auto', fontSize: '0.6875rem', color: '#64748B' }}>
          Class <strong>{model.model_class}</strong> · module <strong>{model.module}</strong> · {model.field_ids.length} fields
        </Typography>
      </Box>
      <Card sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Field', 'Label', 'Type', 'Database Type', 'Related Model', 'Required', 'Unique', 'Selection Values'].map((h) => (
                <TableCell key={h} sx={headSx}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {model.field_ids.map((field) => (
              <TableRow key={field.id} hover>
                <TableCell sx={{ ...cellSx, fontWeight: 600, fontFamily: 'monospace' }}>
                  {field.name}{field.primary_key ? ' 🔑' : ''}
                </TableCell>
                <TableCell sx={cellSx}>{field.label}</TableCell>
                <TableCell sx={cellSx}>
                  <Chip size="small" label={field.field_type} sx={{ height: 18, fontSize: '0.5625rem', fontWeight: 700, color: '#FFFFFF', bgcolor: TYPE_COLORS[field.field_type] || '#64748B' }} />
                </TableCell>
                <TableCell sx={{ ...cellSx, fontFamily: 'monospace', color: '#475569' }}>{field.column_type || '—'}</TableCell>
                <TableCell sx={{ ...cellSx, fontFamily: 'monospace' }}>{field.relation || ''}</TableCell>
                <TableCell sx={cellSx}>{yes(field.required)}</TableCell>
                <TableCell sx={cellSx}>{yes(field.unique)}</TableCell>
                <TableCell sx={{ ...cellSx, color: '#475569', maxWidth: 320 }}>{field.selection || ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}

/**
 * Model Registry (Master > Models)
 *
 * Read-only view of every model and its fields, as stored in ir_model / ir_model_field.
 * The backend fills these tables from the code at startup; "Sync now" re-reads them on demand.
 */
export default function ModelRegistry() {
  const notify = useNotify();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await modelRegistryService.getAll());
    } catch (err) {
      setError(err.message || 'Failed to load the models.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openModel = async (record) => {
    if (!record?.id) return;
    setDetailLoading(true);
    try {
      setSelected(await modelRegistryService.getById(record.id));
    } catch (err) {
      notify.error(err.message || 'Failed to load the model.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModel = () => setSelected(null);

  useRecordRoute({ viewMode: selected ? 'form' : 'list', selectedRecord: selected, data, loading, onOpen: openModel, onClose: closeModel });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await modelRegistryService.sync();
      notify.success(`Synced ${result.models} models and ${result.fields} fields.`);
      await loadData();
    } catch (err) {
      notify.error(err.message || 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  if (detailLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={24} sx={{ color: '#262755' }} /></Box>;
  }
  if (selected) return <ModelFields model={selected} onBack={closeModel} />;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 1.5, py: 0.25, fontSize: '0.6875rem' }}>{error}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={syncing ? <CircularProgress size={12} /> : <Sync sx={{ fontSize: 15 }} />}
          onClick={handleSync}
          disabled={syncing}
          sx={{ height: 26, fontSize: '0.6875rem', textTransform: 'none', color: '#262755', borderColor: '#CBD5E1' }}
        >
          Sync now
        </Button>
      </Box>
      <DynamicListView
        config={listConfig}
        data={data}
        loading={loading}
        onRowClick={openModel}
        onRefresh={loadData}
        breadcrumbs={[{ label: 'Master' }, { label: 'Models' }]}
      />
    </Box>
  );
}
