import React, { useState, useEffect, useCallback } from 'react';
import { UniversalDataView, DynamicFormView } from '../../common';
import { countryService } from '../../../services/resources/countryService';
import { MODEL_METADATA } from '../../../config/modelMetadata';

/**
 * Country Master Component
 * 
 * Configured with dynamic model metadata:
 * - Foreign Key (many2one): currency_id
 */
export const countryConfig = {
  title: 'Countries',
  subtitle: 'Configure nations, international dialing telephone codes, ISO codes, and national currencies',
  formDescription: 'Manage sovereign country definitions, ISO codes, phone prefixes, and national currency associations.',
  primaryKey: 'id',
  createButtonText: 'New Country',
  model: 'country',
  columns: [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'Country Name', flex: 1, sortable: true },
    { field: 'code', headerName: 'ISO Code', width: 130, sortable: true },
    { field: 'phone_code', headerName: 'Phone Code', width: 140 },
    { field: 'currency_id', headerName: 'Currency ID', width: 130 },
  ],
  formFields: MODEL_METADATA.country.fields,
};

export default function Country() {
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
      const records = await countryService.getAll();
      setData(Array.isArray(records) ? records : []);
    } catch (err) {
      setListError(err.message || 'Failed to load countries.');
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

    const pKey = countryConfig.primaryKey;
    const isExisting = Boolean(selectedRecord && selectedRecord[pKey]);

    const payload = {
      name: formData.name?.trim(),
      code: formData.code?.trim().toUpperCase(),
      phone_code: formData.phone_code?.trim(),
      currency_id: Number(formData.currency_id),
    };

    try {
      if (isExisting) {
        await countryService.update(selectedRecord[pKey], payload);
      } else {
        await countryService.create(payload);
      }
      await loadData();
      handleBackToList();
    } catch (err) {
      setFormError(err.message || 'Failed to save country record.');
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this country?')) return;
    try {
      await countryService.delete(id);
      setData((prev) => prev.filter((item) => item[countryConfig.primaryKey] !== id));
    } catch (err) {
      setListError(err.message || 'Failed to delete country.');
    }
  };

  const breadcrumbs = [
    { label: 'Master' },
    { label: 'Country', onClick: viewMode === 'form' ? handleBackToList : undefined },
  ];
  if (viewMode === 'form') {
    breadcrumbs.push({
      label: selectedRecord ? (selectedRecord.name || `Country #${selectedRecord[countryConfig.primaryKey]}`) : 'New Country',
    });
  }

  if (viewMode === 'form') {
    return (
      <DynamicFormView
        config={countryConfig}
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
      config={countryConfig}
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
