import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DynamicListView, DynamicFormView } from '../../common';
import { leadStatusService } from '../../../services/resources/leadStatusService';
import { opportunityStatusService } from '../../../services/resources/opportunityStatusService';
import { MODEL_METADATA } from '../../../config/modelMetadata';

/**
 * Reusable Status Master Component
 * Supports both Lead Status and Opportunity Status via statusType prop ('lead' | 'opportunity')
 */
export const createStatusConfig = (statusType = 'lead') => {
  const isOpp = statusType === 'opportunity';
  const modelKey = isOpp ? 'opportunityStatus' : 'leadStatus';
  return {
    title: isOpp ? 'Opportunity Status' : 'Lead Status',
    showSettingsIcon: true,
    primaryKey: 'id',
    createButtonText: 'New',
    model: modelKey,
    modelName: modelKey,
    draggableRows: true,
    defaultOrderBy: 'sequence',
    columns: [
      { field: 'name', headerName: 'Name', flex: 1.5, sortable: true, visible: true },
      { field: 'sequence', headerName: 'Sequence', width: 110, sortable: true, visible: false },
      {
        field: 'fold',
        headerName: 'Folded in Kanban',
        width: 150,
        sortable: true,
        visible: false,
        renderCell: (params) => (params.value ? 'Yes' : 'No'),
      },
      {
        field: 'is_won',
        headerName: 'Won Stage',
        width: 130,
        sortable: true,
        visible: false,
        renderCell: (params) => (params.value ? 'Yes' : 'No'),
      },
    ],
    formFields: MODEL_METADATA[modelKey]?.fields || MODEL_METADATA.leadStatus.fields,
  };
};

export const leadStatusConfig = createStatusConfig('lead');
export const opportunityStatusConfig = createStatusConfig('opportunity');

export default function LeadStatus({ parentBreadcrumb = 'Master', statusType = 'lead' }) {
  const isOpp = statusType === 'opportunity';
  const service = isOpp ? opportunityStatusService : leadStatusService;
  const config = useMemo(() => createStatusConfig(statusType), [statusType]);
  const statusLabel = isOpp ? 'Opportunity Status' : 'Lead Status';

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(null);

  const [viewMode, setViewMode] = useState('list');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const records = await service.getAll();
      const list = Array.isArray(records) ? records : [];
      // Sort by sequence asc
      list.sort((a, b) => (a.sequence ?? 10) - (b.sequence ?? 10));
      setData(list);
    } catch (err) {
      console.error(`${statusLabel} load error:`, err);
      setListError(err.message || `Failed to load ${statusLabel.toLowerCase()} records.`);
    } finally {
      setLoading(false);
    }
  }, [service, statusLabel]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    setViewMode('list');
  };

  const handleSave = async (formData) => {
    setFormLoading(true);
    setFormError(null);
    setFieldErrors({});

    const pKey = config.primaryKey;
    const isExisting = Boolean(selectedRecord && selectedRecord[pKey]);

    const payload = {
      name: formData.name?.trim(),
      sequence: formData.sequence !== '' && formData.sequence !== null && formData.sequence !== undefined ? Number(formData.sequence) : 10,
      fold: Boolean(formData.fold),
      is_won: Boolean(formData.is_won),
    };

    try {
      if (isExisting) {
        await service.update(selectedRecord[pKey], payload);
      } else {
        await service.create(payload);
      }
      await loadData();
      handleBackToList();
    } catch (err) {
      console.error(`${statusLabel} save error:`, err);
      setFormError(err.message || `Failed to save ${statusLabel.toLowerCase()} record.`);
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this stage?')) return;
    try {
      await service.delete(id);
      setData((prev) => prev.filter((item) => item[config.primaryKey] !== id));
    } catch (err) {
      console.error('Failed to delete stage:', err);
      setListError(err.message || 'Failed to delete stage.');
    }
  };

  /**
   * Reorders rows on drag-and-drop, updates sequences and persists via PATCH API
   */
  const handleReorderRows = async (fromIndex, toIndex, currentList) => {
    if (fromIndex === toIndex || !Array.isArray(currentList)) return;

    const reordered = [...currentList];
    const [movedItem] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedItem);

    // Re-assign sequence numbers: 1, 2, 3...
    const updatedList = reordered.map((item, idx) => ({
      ...item,
      sequence: idx + 1,
    }));

    // Optimistic UI update
    const previousData = [...data];
    setData(updatedList);

    try {
      // Find records whose sequence actually changed
      const changedRecords = updatedList.filter((item) => {
        const orig = currentList.find((c) => c[config.primaryKey] === item[config.primaryKey]);
        return !orig || orig.sequence !== item.sequence;
      });

      // Update backend via PATCH
      await Promise.all(
        changedRecords.map((rec) =>
          service.update(rec[config.primaryKey], { sequence: rec.sequence })
        )
      );

      // Reload fresh data from backend
      await loadData();
    } catch (err) {
      console.error(`Failed to update ${statusLabel} sequence:`, err);
      setListError(err.message || `Failed to update ${statusLabel.toLowerCase()} sequence order.`);
      // Revert optimistic update
      setData(previousData);
    }
  };

  const breadcrumbs = [
    { label: parentBreadcrumb },
    ...(parentBreadcrumb === 'CRM' ? [{ label: 'Settings' }] : []),
    { label: statusLabel, onClick: viewMode === 'form' ? handleBackToList : undefined },
  ];
  if (viewMode === 'form') {
    breadcrumbs.push({
      label: selectedRecord ? (selectedRecord.name || `Stage #${selectedRecord[config.primaryKey]}`) : 'New Stage',
    });
  }

  if (viewMode === 'form') {
    return (
      <DynamicFormView
        config={config}
        initialData={selectedRecord}
        records={data}
        onNavigateRecord={(rec) => handleOpenForm(rec)}
        onNew={() => handleOpenForm(null)}
        loading={formLoading}
        error={formError}
        fieldErrors={fieldErrors}
        onSave={handleSave}
        onBack={handleBackToList}
        breadcrumbs={breadcrumbs}
      />
    );
  }

  return (
    <DynamicListView
      config={config}
      data={data}
      loading={loading}
      error={listError}
      onRowClick={(rec) => handleOpenForm(rec)}
      onCreateClick={() => handleOpenForm(null)}
      onDeleteClick={handleDelete}
      onReorderRows={handleReorderRows}
      breadcrumbs={breadcrumbs}
    />
  );
}

