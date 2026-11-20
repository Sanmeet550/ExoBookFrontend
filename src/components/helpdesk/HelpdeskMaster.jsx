import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DynamicListView, DynamicFormView } from '../common';
import { relationCacheService } from '../../services/relationCacheService';
import useRecordRoute from '../../navigation/useRecordRoute';
import { MESSAGES, savedRecordOf, useNotify } from '../../context/NotificationContext';

/**
 * HelpdeskMaster
 *
 * Generic Configuration screen for a Helpdesk master (Teams, Stages, Priorities, ...).
 * Driven entirely by a definition from helpdeskConfig.js and rendered with the shared
 * DynamicListView / DynamicFormView.
 */
export default function HelpdeskMaster({ definition }) {
  const { title, singular, service, columns, fields, toRow, toPayload, draggable, refreshEndpoints = [], nameField = 'name', chatterModel } = definition;

  const config = useMemo(
    () => ({
      title,
      primaryKey: 'id',
      createButtonText: 'New',
      modelName: `helpdesk_${title}`,
      chatterModel,
      draggableRows: Boolean(draggable),
      defaultOrderBy: 'sequence',
      columns,
      formFields: fields,
    }),
    [title, draggable, columns, fields, chatterModel]
  );

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const notify = useNotify();

  const loadData = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const records = await service.getAll();
      setData((Array.isArray(records) ? records : []).map((record) => (toRow ? toRow(record) : record)));
    } catch (err) {
      setListError(err.message || `Failed to load ${title.toLowerCase()}.`);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [service, toRow, title]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Dropdowns elsewhere cache this master; drop the cached copy after every change. */
  const afterChange = async () => {
    refreshEndpoints.forEach((endpoint) => relationCacheService.clear(endpoint));
    await loadData();
  };

  const openForm = (record = null) => {
    setSelectedRecord(record);
    setFormError(null);
    setFieldErrors({});
    setViewMode('form');
  };

  const backToList = () => {
    setSelectedRecord(null);
    setFormError(null);
    setFieldErrors({});
    setViewMode('list');
  };

  const handleSave = async (formData) => {
    setFormLoading(true);
    setFormError(null);
    setFieldErrors({});
    const isExisting = Boolean(selectedRecord?.id);
    try {
      const payload = toPayload(formData, isExisting);
      const response = isExisting
        ? await service.update(selectedRecord.id, payload)
        : await service.create(payload);
      await afterChange();
      notify.success(isExisting ? MESSAGES.updated : MESSAGES.created);
      // Stay on the form: a created record continues as an existing one (its id goes into the URL).
      const saved = savedRecordOf(response, payload, selectedRecord);
      if (saved) setSelectedRecord(toRow ? toRow(saved) : saved);
      else backToList();
    } catch (err) {
      setFormError(err.message || `Failed to save the ${singular.toLowerCase()}.`);
      setFieldErrors(err.fieldErrors || {});
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, options = {}) => {
    if (!options?.skipConfirm && !window.confirm(`Are you sure you want to delete this ${singular.toLowerCase()}?`)) return;
    try {
      await service.delete(id);
      notify.success(MESSAGES.deleted);
      await afterChange();
    } catch (err) {
      setListError(err.message || `Failed to delete the ${singular.toLowerCase()}.`);
      throw err;
    }
  };

  /** Persists a drag-and-drop reorder as new sequence values. */
  const handleReorderRows = async (fromIndex, toIndex, currentList) => {
    if (fromIndex === toIndex || !Array.isArray(currentList)) return;
    const reordered = [...currentList];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const resequenced = reordered.map((item, index) => ({ ...item, sequence: (index + 1) * 10 }));
    const previous = data;
    setData(resequenced);
    try {
      const changed = resequenced.filter((item) => currentList.find((c) => c.id === item.id)?.sequence !== item.sequence);
      await Promise.all(changed.map((item) => service.update(item.id, { sequence: item.sequence })));
      await afterChange();
    } catch (err) {
      setListError(err.message || 'Failed to update the order.');
      setData(previous);
    }
  };

  // URL <-> screen sync: refresh, deep links and Back/Forward reopen the same record.
  useRecordRoute({ viewMode, selectedRecord, data, loading, onOpen: openForm, onClose: backToList });

  const breadcrumbs = [
    { label: 'Helpdesk' },
    { label: 'Configuration' },
    { label: title, onClick: viewMode === 'form' ? backToList : undefined },
  ];

  if (viewMode === 'form') {
    breadcrumbs.push({ label: selectedRecord ? selectedRecord[nameField] || `${singular} #${selectedRecord.id}` : `New ${singular}` });
    return (
      <DynamicFormView
        config={config}
        initialData={selectedRecord}
        records={data}
        onNavigateRecord={openForm}
        onNew={() => openForm(null)}
        loading={formLoading}
        error={formError}
        fieldErrors={fieldErrors}
        onSave={handleSave}
        onBack={backToList}
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
      onRowClick={openForm}
      onCreateClick={() => openForm(null)}
      onDeleteClick={handleDelete}
      onBulkArchive={async (ids) => {
        await Promise.all(ids.map((id) => service.update(id, { active: false })));
        notify.success(MESSAGES.archived);
      }}
      onRefresh={afterChange}
      onReorderRows={draggable ? handleReorderRows : undefined}
      breadcrumbs={breadcrumbs}
    />
  );
}
