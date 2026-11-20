import React, { useState, useEffect, useCallback } from 'react';
import { DynamicListView, DynamicFormView } from '../../common';
import { uomService } from '../../../services/resources/productService';
import { MODEL_METADATA } from '../../../config/modelMetadata';

/**
 * UOM (Unit of Measurement) Master Component
 * 
 * Configured with dynamic model metadata:
 * - Foreign Keys (many2one): reference_unit_id
 * - Endpoints: GET /uom/view/all, POST /uom/create, PATCH /uom/update/{id}, DELETE /uom/delete/{id}
 */
export const uomConfig = {
  title: 'Units of Measure (UOM)',
  primaryKey: 'id',
  createButtonText: 'New UOM',
  model: 'uom',
  columns: [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'UOM Name', flex: 1, sortable: true },
    { field: 'quantity', headerName: 'Ratio Quantity', width: 130, sortable: true },
    { field: 'reference_unit_id', headerName: 'Reference Unit ID', width: 160 },
  ],
  formFields: MODEL_METADATA.uom.fields,
};

export default function UOM() {
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
      const records = await uomService.getAll();
      setData(Array.isArray(records) ? records : []);
    } catch (err) {
      setListError(err.message || 'Failed to load UOM records.');
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

    const pKey = uomConfig.primaryKey;
    const isExisting = Boolean(selectedRecord && selectedRecord[pKey]);

    const payload = {
      name: formData.name?.trim(),
      quantity: formData.quantity ? Number(formData.quantity) : 1,
      reference_unit_id: formData.reference_unit_id ? Number(formData.reference_unit_id) : undefined,
    };

    try {
      if (isExisting) {
        await uomService.update(selectedRecord[pKey], payload);
      } else {
        await uomService.create(payload);
      }
      await loadData();
      handleBackToList();
    } catch (err) {
      setFormError(err.message || 'Failed to save UOM record.');
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this UOM record?')) return;
    try {
      await uomService.delete(id);
      setData((prev) => prev.filter((item) => item[uomConfig.primaryKey] !== id));
    } catch (err) {
      setListError(err.message || 'Failed to delete UOM.');
    }
  };

  const breadcrumbs = [
    { label: 'Master' },
    { label: 'UOM', onClick: viewMode === 'form' ? handleBackToList : undefined },
  ];
  if (viewMode === 'form') {
    breadcrumbs.push({
      label: selectedRecord ? (selectedRecord.name || `UOM #${selectedRecord[uomConfig.primaryKey]}`) : 'New UOM',
    });
  }

  if (viewMode === 'form') {
    return (
      <DynamicFormView
        config={uomConfig}
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
      config={uomConfig}
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

