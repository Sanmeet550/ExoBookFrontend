import React, { useState, useEffect, useCallback } from 'react';
import useRecordRoute from '../../../navigation/useRecordRoute';
import { MESSAGES, savedRecordOf, useNotify } from '../../../context/NotificationContext';
import { UniversalDataView, DynamicFormView } from '../../common';
import { companyService } from '../../../services/resources/companyService';
import { MODEL_METADATA } from '../../../config/modelMetadata';

/**
 * Company Master Component
 * 
 * Configured with dynamic model metadata:
 * - Foreign Keys (many2one): country_id, state_id, currency_id
 * - Cascading: state_id depends on country_id
 */
export const companyConfig = {
  title: 'Companies',
  subtitle: 'Manage legal entities, corporate branches, tax identification and registration details',
  formDescription: 'Define corporate entity profiles, fiscal registration numbers, and operational headquarters.',
  primaryKey: 'id',
  createButtonText: 'New Company',
  model: 'company',
  columns: [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'Legal Name', flex: 1, sortable: true },
    { field: 'tax_number', headerName: 'Tax ID / VAT', width: 140, sortable: true },
    { field: 'email', headerName: 'Corporate Email', width: 200 },
    { field: 'mobile', headerName: 'Mobile / Phone', width: 140 },
    { field: 'city', headerName: 'City', width: 130 },
  ],
  formFields: MODEL_METADATA.company.fields,
};

export default function Company() {
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
      const records = await companyService.getAll();
      setData(Array.isArray(records) ? records : []);
    } catch (err) {
      setListError(err.message || 'Failed to load companies.');
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

    const pKey = companyConfig.primaryKey;
    const isExisting = Boolean(selectedRecord && selectedRecord[pKey]);

    const payload = {
      ...formData,
      state_id: formData.state_id ? Number(formData.state_id) : undefined,
      country_id: formData.country_id ? Number(formData.country_id) : undefined,
      currency_id: formData.currency_id ? Number(formData.currency_id) : undefined,
    };

    let savedRecord = null;
    try {
      if (isExisting) {
        savedRecord = await companyService.update(selectedRecord[pKey], payload);
      } else {
        savedRecord = await companyService.create(payload);
      }
      await loadData();
      notify.success(isExisting ? MESSAGES.updated : MESSAGES.created);
      // Stay on the form: a created record continues as an existing one (its id goes into the URL).
      const nextRecord = savedRecordOf(savedRecord, payload, selectedRecord);
      if (nextRecord) setSelectedRecord(nextRecord);
      else handleBackToList();
    } catch (err) {
      setFormError(err.message || 'Failed to save company record.');
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    try {
      await companyService.delete(id);
      notify.success(MESSAGES.deleted);
      setData((prev) => prev.filter((item) => item[companyConfig.primaryKey] !== id));
    } catch (err) {
      setListError(err.message || 'Failed to delete company.');
    }
  };

  // URL <-> screen sync: refresh, deep links and Back/Forward reopen the same record.
  useRecordRoute({ viewMode, selectedRecord, data, loading, onOpen: handleOpenForm, onClose: handleBackToList });

  const breadcrumbs = [
    { label: 'Master' },
    { label: 'Company', onClick: viewMode === 'form' ? handleBackToList : undefined },
  ];
  if (viewMode === 'form') {
    breadcrumbs.push({
      label: selectedRecord ? (selectedRecord.name || `Company #${selectedRecord[companyConfig.primaryKey]}`) : 'New Company',
    });
  }

  if (viewMode === 'form') {
    return (
      <DynamicFormView
        config={companyConfig}
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
    <UniversalDataView
      config={companyConfig}
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
