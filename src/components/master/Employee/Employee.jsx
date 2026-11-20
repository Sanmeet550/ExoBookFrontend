import React, { useState, useEffect, useCallback } from 'react';
import useRecordRoute from '../../../navigation/useRecordRoute';
import { MESSAGES, savedRecordOf, useNotify } from '../../../context/NotificationContext';
import { DynamicListView, DynamicFormView } from '../../common';
import { employeeService } from '../../../services/resources/employeeService';
import { MODEL_METADATA } from '../../../config/modelMetadata';

/**
 * Employee Master Component
 * 
 * Configured with dynamic model metadata:
 * - Foreign Keys (many2one): company_id, department_id, job_position_id, manager_id
 * - Enums/Selections: gender, marital_status
 * - Endpoints: GET /employee/view/all, POST /employee/create, PATCH /employee/update/{id}, DELETE /employee/delete/{id}
 */
export const employeeConfig = {
  title: 'Employees',
  primaryKey: 'id',
  createButtonText: 'New Employee',
  model: 'employee',
  columns: [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'Employee Name', flex: 1, sortable: true },
    { field: 'work_email', headerName: 'Work Email', width: 180 },
    { field: 'work_phone', headerName: 'Work Phone', width: 130 },
    { field: 'department_id', headerName: 'Department ID', width: 120 },
    { field: 'job_position_id', headerName: 'Job Position ID', width: 130 },
  ],
  formFields: MODEL_METADATA.employee.fields,
};

export default function Employee() {
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
      const records = await employeeService.getAll();
      setData(Array.isArray(records) ? records : []);
    } catch (err) {
      setListError(err.message || 'Failed to load employees.');
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

    const pKey = employeeConfig.primaryKey;
    const isExisting = Boolean(selectedRecord && selectedRecord[pKey]);

    const payload = {
      ...formData,
      company_id: formData.company_id ? Number(formData.company_id) : undefined,
      department_id: formData.department_id ? Number(formData.department_id) : undefined,
      job_position_id: formData.job_position_id ? Number(formData.job_position_id) : undefined,
      manager_id: formData.manager_id ? Number(formData.manager_id) : undefined,
      date_of_joining: formData.date_of_joining || undefined,
      date_of_birth: formData.date_of_birth || undefined,
    };

    let savedRecord = null;
    try {
      if (isExisting) {
        savedRecord = await employeeService.update(selectedRecord[pKey], payload);
      } else {
        savedRecord = await employeeService.create(payload);
      }
      await loadData();
      notify.success(isExisting ? MESSAGES.updated : MESSAGES.created);
      // Stay on the form: a created record continues as an existing one (its id goes into the URL).
      const nextRecord = savedRecordOf(savedRecord, payload, selectedRecord);
      if (nextRecord) setSelectedRecord(nextRecord);
      else handleBackToList();
    } catch (err) {
      setFormError(err.message || 'Failed to save employee record.');
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await employeeService.delete(id);
      notify.success(MESSAGES.deleted);
      setData((prev) => prev.filter((item) => item[employeeConfig.primaryKey] !== id));
    } catch (err) {
      setListError(err.message || 'Failed to delete employee.');
    }
  };

  // URL <-> screen sync: refresh, deep links and Back/Forward reopen the same record.
  useRecordRoute({ viewMode, selectedRecord, data, loading, onOpen: handleOpenForm, onClose: handleBackToList });

  const breadcrumbs = [
    { label: 'Master' },
    { label: 'Employee', onClick: viewMode === 'form' ? handleBackToList : undefined },
  ];
  if (viewMode === 'form') {
    breadcrumbs.push({
      label: selectedRecord ? (selectedRecord.name || `Employee #${selectedRecord[employeeConfig.primaryKey]}`) : 'New Employee',
    });
  }

  if (viewMode === 'form') {
    return (
      <DynamicFormView
        config={employeeConfig}
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
      config={employeeConfig}
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

