import React, { useState, useEffect, useCallback } from 'react';
import { DynamicListView, DynamicFormView } from '../../common';
import { stateService } from '../../../services/resources/stateService';
import { MODEL_METADATA } from '../../../config/modelMetadata';

/**
 * State Master Component
 * 
 * Configured with dynamic model metadata:
 * - Foreign Key (many2one): country_id
 */
export const stateConfig = {
  title: 'States & Provinces',
  subtitle: 'Configure regional divisions, states, provinces, and territorial subdivisions mapped to countries',
  formDescription: 'Manage regional state and province records linked with their respective sovereign nations.',
  primaryKey: 'id',
  createButtonText: 'New State',
  model: 'state',
  columns: [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'State / Province Name', flex: 1, sortable: true },
    { field: 'code', headerName: 'State Code', width: 140, sortable: true },
    { field: 'country_id', headerName: 'Country ID', width: 130 },
  ],
  formFields: MODEL_METADATA.state.fields,
};

export default function State() {
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
      const records = await stateService.getAll();
      setData(Array.isArray(records) ? records : []);
    } catch (err) {
      setListError(err.message || 'Failed to load states.');
    } finally {
      setLoading(false);
    }
  }, []);

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

    const pKey = stateConfig.primaryKey;
    const isExisting = Boolean(selectedRecord && selectedRecord[pKey]);

    const payload = {
      name: formData.name?.trim(),
      code: formData.code?.trim().toUpperCase(),
      country_id: Number(formData.country_id),
    };

    try {
      if (isExisting) {
        await stateService.update(selectedRecord[pKey], payload);
      } else {
        await stateService.create(payload);
      }
      await loadData();
      handleBackToList();
    } catch (err) {
      setFormError(err.message || 'Failed to save state record.');
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this state/province?')) return;
    try {
      await stateService.delete(id);
      setData((prev) => prev.filter((item) => item[stateConfig.primaryKey] !== id));
    } catch (err) {
      setListError(err.message || 'Failed to delete state.');
    }
  };

  const breadcrumbs = [
    { label: 'Master' },
    { label: 'State', onClick: viewMode === 'form' ? handleBackToList : undefined },
  ];
  if (viewMode === 'form') {
    breadcrumbs.push({
      label: selectedRecord ? (selectedRecord.name || `State #${selectedRecord[stateConfig.primaryKey]}`) : 'New State',
    });
  }

  if (viewMode === 'form') {
    return (
      <DynamicFormView
        config={stateConfig}
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
      config={stateConfig}
      data={data}
      loading={loading}
      error={listError}
      onRowClick={(rec) => handleOpenForm(rec)}
      onCreateClick={() => handleOpenForm(null)}
      onEditClick={(rec) => handleOpenForm(rec)}
      onDeleteClick={handleDelete}
      breadcrumbs={breadcrumbs}
    />
  );
}
