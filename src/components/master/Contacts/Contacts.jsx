import React, { useState, useEffect, useCallback } from 'react';
import useRecordRoute from '../../../navigation/useRecordRoute';
import { MESSAGES, savedRecordOf, useNotify } from '../../../context/NotificationContext';
import { UniversalDataView, DynamicFormView } from '../../common';
import { contactService } from '../../../services/resources/contactService';
import { MODEL_METADATA } from '../../../config/modelMetadata';

/**
 * Contacts Master Component
 * 
 * Configured with dynamic model metadata:
 * - Foreign Keys (many2one): country_id, state_id
 * - Cascading: state_id depends on country_id
 * - Booleans: is_customer, is_vendor
 */
export const contactsConfig = {
  title: 'Contacts',
  subtitle: 'Master directory of business clients, vendor leads, representatives and partners',
  formDescription: 'Create or update business partner contact information, communication channels and associated company.',
  primaryKey: 'id',
  createButtonText: 'New Contact',
  model: 'partner',
  columns: [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'Full Name', flex: 1, sortable: true },
    { field: 'email', headerName: 'Email Address', width: 220 },
    { field: 'mobile', headerName: 'Mobile / Phone', width: 150 },
    { field: 'city', headerName: 'City', width: 140 },
  ],
  formFields: MODEL_METADATA.partner.fields,
};

export default function Contacts() {
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
      const records = await contactService.getAll();
      setData(Array.isArray(records) ? records : []);
    } catch (err) {
      setListError(err.message || 'Failed to load contacts.');
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

    const pKey = contactsConfig.primaryKey;
    const isExisting = Boolean(selectedRecord && selectedRecord[pKey]);

    const payload = {
      ...formData,
      state_id: formData.state_id ? Number(formData.state_id) : undefined,
      country_id: formData.country_id ? Number(formData.country_id) : undefined,
      is_customer: Boolean(formData.is_customer),
      is_vendor: Boolean(formData.is_vendor),
    };

    let savedRecord = null;
    try {
      if (isExisting) {
        savedRecord = await contactService.update(selectedRecord[pKey], payload);
      } else {
        savedRecord = await contactService.create(payload);
      }
      await loadData();
      notify.success(isExisting ? MESSAGES.updated : MESSAGES.created);
      // Stay on the form: a created record continues as an existing one (its id goes into the URL).
      const nextRecord = savedRecordOf(savedRecord, payload, selectedRecord);
      if (nextRecord) setSelectedRecord(nextRecord);
      else handleBackToList();
    } catch (err) {
      setFormError(err.message || 'Failed to save contact record.');
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      await contactService.delete(id);
      notify.success(MESSAGES.deleted);
      setData((prev) => prev.filter((item) => item[contactsConfig.primaryKey] !== id));
    } catch (err) {
      setListError(err.message || 'Failed to delete contact.');
    }
  };

  // URL <-> screen sync: refresh, deep links and Back/Forward reopen the same record.
  useRecordRoute({ viewMode, selectedRecord, data, loading, onOpen: handleOpenForm, onClose: handleBackToList });

  const breadcrumbs = [
    { label: 'Master' },
    { label: 'Contacts', onClick: viewMode === 'form' ? handleBackToList : undefined },
  ];
  if (viewMode === 'form') {
    breadcrumbs.push({
      label: selectedRecord ? (selectedRecord.name || `Contact #${selectedRecord[contactsConfig.primaryKey]}`) : 'New Contact',
    });
  }

  if (viewMode === 'form') {
    return (
      <DynamicFormView
        config={contactsConfig}
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
      config={contactsConfig}
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
