import React, { useState, useEffect, useCallback } from 'react';
import { DynamicListView, DynamicFormView } from '../../common';
import { warehouseService } from '../../../services/resources/warehouseService';
import { MODEL_METADATA } from '../../../config/modelMetadata';

/**
 * Warehouse Master Component
 * 
 * Configured with dynamic model metadata:
 * - Foreign Keys (many2one): company_id
 * - Endpoints: GET /warehouse/view/all, POST /warehouse/create, PATCH /warehouse/update/{id}, DELETE /warehouse/delete/{id}
 */
export const warehouseConfig = {
  title: 'Warehouses',
  primaryKey: 'id',
  createButtonText: 'New Warehouse',
  model: 'warehouse',
  columns: [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'Warehouse Name', flex: 1, sortable: true },
    { field: 'code', headerName: 'Code', width: 120, sortable: true },
    { field: 'company_id', headerName: 'Company ID', width: 130 },
  ],
  formFields: MODEL_METADATA.warehouse.fields,
};

export default function Warehouse() {
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
      const records = await warehouseService.getAll();
      setData(Array.isArray(records) ? records : []);
    } catch (err) {
      setListError(err.message || 'Failed to load warehouses.');
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

    const pKey = warehouseConfig.primaryKey;
    const isExisting = Boolean(selectedRecord && selectedRecord[pKey]);

    const payload = {
      name: formData.name?.trim(),
      code: formData.code?.trim().toUpperCase(),
      company_id: formData.company_id ? Number(formData.company_id) : undefined,
    };

    try {
      if (isExisting) {
        await warehouseService.update(selectedRecord[pKey], payload);
      } else {
        await warehouseService.create(payload);
      }
      await loadData();
      handleBackToList();
    } catch (err) {
      setFormError(err.message || 'Failed to save warehouse record.');
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this warehouse?')) return;
    try {
      await warehouseService.delete(id);
      setData((prev) => prev.filter((item) => item[warehouseConfig.primaryKey] !== id));
    } catch (err) {
      setListError(err.message || 'Failed to delete warehouse.');
    }
  };

  const breadcrumbs = [
    { label: 'Master' },
    { label: 'Warehouse', onClick: viewMode === 'form' ? handleBackToList : undefined },
  ];
  if (viewMode === 'form') {
    breadcrumbs.push({
      label: selectedRecord ? (selectedRecord.name || `Warehouse #${selectedRecord[warehouseConfig.primaryKey]}`) : 'New Warehouse',
    });
  }

  if (viewMode === 'form') {
    return (
      <DynamicFormView
        config={warehouseConfig}
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
      config={warehouseConfig}
      data={data}
      loading={loading}
      error={listError}
      onRowClick={(rec) => handleOpenForm(rec)}
      onCreateClick={() => handleOpenForm(null)}
      onDeleteClick={handleDelete}
      breadcrumbs={breadcrumbs}
    />
  );
}

