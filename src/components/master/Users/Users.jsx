import React, { useState, useEffect, useCallback } from 'react';
import { DynamicListView, DynamicFormView } from '../../common';
import { usersService } from '../../../services/resources/usersService';
import { MODEL_METADATA } from '../../../config/modelMetadata';

/**
 * Users Master Component
 * 
 * Configured with dynamic model metadata:
 * - Endpoints: GET /view/users, POST /create/users, PATCH /update/users/{id}, DELETE /delete/users/{id}
 */
export const usersConfig = {
  title: 'Users',
  primaryKey: 'id',
  createButtonText: 'New User',
  model: 'users',
  columns: [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'Full Name', flex: 1, sortable: true },
    { field: 'login', headerName: 'Login Username', width: 180, sortable: true },
  ],
  formFields: MODEL_METADATA.users.fields,
};

export default function Users() {
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
      const records = await usersService.getAll();
      setData(Array.isArray(records) ? records : []);
    } catch (err) {
      setListError(err.message || 'Failed to load users.');
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

    const pKey = usersConfig.primaryKey;
    const isExisting = Boolean(selectedRecord && selectedRecord[pKey]);

    const payload = {
      name: formData.name?.trim(),
      login: formData.login?.trim(),
    };

    if (formData.password && formData.password.trim()) {
      payload.password = formData.password.trim();
    }

    try {
      if (isExisting) {
        await usersService.update(selectedRecord[pKey], payload);
      } else {
        await usersService.create(payload);
      }
      await loadData();
      handleBackToList();
    } catch (err) {
      setFormError(err.message || 'Failed to save user.');
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersService.delete(id);
      setData((prev) => prev.filter((item) => item[usersConfig.primaryKey] !== id));
    } catch (err) {
      setListError(err.message || 'Failed to delete user.');
    }
  };

  const breadcrumbs = [
    { label: 'Master' },
    { label: 'Users', onClick: viewMode === 'form' ? handleBackToList : undefined },
  ];
  if (viewMode === 'form') {
    breadcrumbs.push({
      label: selectedRecord ? (selectedRecord.name || `User #${selectedRecord[usersConfig.primaryKey]}`) : 'New User',
    });
  }

  if (viewMode === 'form') {
    return (
      <DynamicFormView
        config={usersConfig}
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
      config={usersConfig}
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

