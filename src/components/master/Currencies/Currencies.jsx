import React, { useState, useEffect, useCallback } from 'react';
import useRecordRoute from '../../../navigation/useRecordRoute';
import { MESSAGES, savedRecordOf, useNotify } from '../../../context/NotificationContext';
import { DynamicListView, DynamicFormView } from '../../common';
import { currencyService } from '../../../services/resources/currencyService';

/**
 * Currencies Master Component
 * 
 * Integrated with FastAPI backend Currency API:
 * - GET /currency/view/all
 * - POST /currency/create
 * - PATCH /currency/update/{id}
 * - DELETE /currency/delete/{id}
 */
export const currenciesConfig = {
  title: 'Currencies',
  chatterModel: 'currency',
  subtitle: 'Configure multi-currency exchange rates, monetary symbols, and decimal precision',
  formDescription: 'Manage ISO currency codes, currency symbols, and foreign exchange conversion rates.',
  primaryKey: 'id',
  createButtonText: 'New Currency',
  columns: [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'Currency Code', width: 140, sortable: true },
    { field: 'full_name', headerName: 'Currency Full Name', flex: 1, sortable: true },
    { field: 'symbol', headerName: 'Symbol', width: 100 },
    { field: 'currency_unit_label', headerName: 'Unit Label', width: 140 },
    { field: 'currency_subunit_label', headerName: 'Subunit Label', width: 140 },
  ],
  formFields: [
    // Row 1: 3 fields (ISO Code, Full Name, Symbol)
    { name: 'name', label: 'Currency Code (e.g. USD)', type: 'text', required: true, cols: 3 },
    { name: 'full_name', label: 'Currency Full Name (e.g. US Dollar)', type: 'text', required: true, cols: 3 },
    { name: 'symbol', label: 'Currency Symbol (e.g. $)', type: 'text', required: true, cols: 3 },

    // Row 2: 2 fields (Unit Label, Subunit Label)
    { name: 'currency_unit_label', label: 'Unit Label (e.g. Dollars)', type: 'text', required: true, cols: 2 },
    { name: 'currency_subunit_label', label: 'Subunit Label (e.g. Cents)', type: 'text', required: true, cols: 2 },
  ],
};

export default function Currencies() {
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
      const records = await currencyService.getAll();
      setData(Array.isArray(records) ? records : []);
    } catch (err) {
      setListError(err.message || 'Failed to load currencies.');
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

    const pKey = currenciesConfig.primaryKey;
    const isExisting = Boolean(selectedRecord && selectedRecord[pKey]);

    const payload = {
      name: formData.name?.trim().toUpperCase(),
      full_name: formData.full_name?.trim(),
      symbol: formData.symbol?.trim(),
      currency_unit_label: formData.currency_unit_label?.trim(),
      currency_subunit_label: formData.currency_subunit_label?.trim(),
    };

    let savedRecord = null;
    try {
      if (isExisting) {
        savedRecord = await currencyService.update(selectedRecord[pKey], payload);
      } else {
        savedRecord = await currencyService.create(payload);
      }
      await loadData();
      notify.success(isExisting ? MESSAGES.updated : MESSAGES.created);
      // Stay on the form: a created record continues as an existing one (its id goes into the URL).
      const nextRecord = savedRecordOf(savedRecord, payload, selectedRecord);
      if (nextRecord) setSelectedRecord(nextRecord);
      else handleBackToList();
    } catch (err) {
      setFormError(err.message || 'Failed to save currency record.');
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this currency?')) return;
    try {
      await currencyService.delete(id);
      notify.success(MESSAGES.deleted);
      setData((prev) => prev.filter((item) => item[currenciesConfig.primaryKey] !== id));
    } catch (err) {
      setListError(err.message || 'Failed to delete currency.');
    }
  };

  // URL <-> screen sync: refresh, deep links and Back/Forward reopen the same record.
  useRecordRoute({ viewMode, selectedRecord, data, loading, onOpen: handleOpenForm, onClose: handleBackToList });

  const breadcrumbs = [
    { label: 'Master' },
    { label: 'Currencies', onClick: viewMode === 'form' ? handleBackToList : undefined },
  ];
  if (viewMode === 'form') {
    breadcrumbs.push({
      label: selectedRecord ? (selectedRecord.name || `Currency #${selectedRecord[currenciesConfig.primaryKey]}`) : 'New Currency',
    });
  }

  if (viewMode === 'form') {
    return (
      <DynamicFormView
        config={currenciesConfig}
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
      config={currenciesConfig}
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
