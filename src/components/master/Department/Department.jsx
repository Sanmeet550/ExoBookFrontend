import React, { useState, useEffect, useCallback } from 'react';
import { DynamicListView, DynamicFormView } from '../../common';
import { departmentService } from '../../../services/resources/departmentService';
import { MODEL_METADATA } from '../../../config/modelMetadata';

/**
 * Department Master Component
 * 
 * Configured with dynamic model metadata:
 * - Foreign Keys (many2one): company_id
 * - Endpoints: GET /department/view/all, POST /department/create, PATCH /department/update/{id}, DELETE /department/delete/{id}
 */
export const departmentConfig = {
  title: 'Departments',
  primaryKey: 'id',
  createButtonText: 'New Department',
  model: 'department',
  columns: [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'Department Name', flex: 1, sortable: true },
    { field: 'company_id', headerName: 'Company ID', width: 130 },
  ],
  formFields: MODEL_METADATA.department.fields,
};

export default function Department() {
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
      const records = await departmentService.getAll();
      setData(Array.isArray(records) ? records : []);
    } catch (err) {
      setListError(err.message || 'Failed to load departments.');
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

    const pKey = departmentConfig.primaryKey;
    const isExisting = Boolean(selectedRecord && selectedRecord[pKey]);

    const payload = {
      name: formData.name?.trim(),
      company_id: Number(formData.company_id),
    };

    try {
      if (isExisting) {
        await departmentService.update(selectedRecord[pKey], payload);
      } else {
        await departmentService.create(payload);
      }
      await loadData();
      handleBackToList();
    } catch (err) {
      setFormError(err.message || 'Failed to save department.');
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await departmentService.delete(id);
      setData((prev) => prev.filter((item) => item[departmentConfig.primaryKey] !== id));
    } catch (err) {
      setListError(err.message || 'Failed to delete department.');
    }
  };

  const breadcrumbs = [
    { label: 'Master' },
    { label: 'Department', onClick: viewMode === 'form' ? handleBackToList : undefined },
  ];
  if (viewMode === 'form') {
    breadcrumbs.push({
      label: selectedRecord ? (selectedRecord.name || `Department #${selectedRecord[departmentConfig.primaryKey]}`) : 'New Department',
    });
  }

  if (viewMode === 'form') {
    return (
      <DynamicFormView
        config={departmentConfig}
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
      config={departmentConfig}
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

