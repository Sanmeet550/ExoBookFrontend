import React, { useState, useEffect, useCallback } from 'react';
import useRecordRoute from '../../../navigation/useRecordRoute';
import { MESSAGES, savedRecordOf, useNotify } from '../../../context/NotificationContext';
import { DynamicListView, DynamicFormView } from '../../common';
import { productCategoryService } from '../../../services/resources/productService';
import { MODEL_METADATA } from '../../../config/modelMetadata';

/**
 * ProductCategory Master Component
 * 
 * Configured with dynamic model metadata:
 * - Foreign Keys (many2one): parent_id (Self-referencing Category)
 * - Endpoints: GET /product-category/view/all, POST /product-category/create, PATCH /product-category/update/{id}, DELETE /product-category/delete/{id}
 */
export const productCategoryConfig = {
  title: 'Product Categories',
  primaryKey: 'id',
  createButtonText: 'New Category',
  model: 'productCategory',
  columns: [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'Category Name', flex: 1, sortable: true },
    { field: 'parent_id', headerName: 'Parent Category ID', width: 160 },
  ],
  formFields: MODEL_METADATA.productCategory.fields,
};

export default function ProductCategory() {
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
      const records = await productCategoryService.getAll();
      setData(Array.isArray(records) ? records : []);
    } catch (err) {
      setListError(err.message || 'Failed to load product categories.');
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

    const pKey = productCategoryConfig.primaryKey;
    const isExisting = Boolean(selectedRecord && selectedRecord[pKey]);

    const payload = {
      name: formData.name?.trim(),
      parent_id: formData.parent_id ? Number(formData.parent_id) : undefined,
    };

    let savedRecord = null;
    try {
      if (isExisting) {
        savedRecord = await productCategoryService.update(selectedRecord[pKey], payload);
      } else {
        savedRecord = await productCategoryService.create(payload);
      }
      await loadData();
      notify.success(isExisting ? MESSAGES.updated : MESSAGES.created);
      // Stay on the form: a created record continues as an existing one (its id goes into the URL).
      const nextRecord = savedRecordOf(savedRecord, payload, selectedRecord);
      if (nextRecord) setSelectedRecord(nextRecord);
      else handleBackToList();
    } catch (err) {
      setFormError(err.message || 'Failed to save product category.');
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await productCategoryService.delete(id);
      notify.success(MESSAGES.deleted);
      setData((prev) => prev.filter((item) => item[productCategoryConfig.primaryKey] !== id));
    } catch (err) {
      setListError(err.message || 'Failed to delete category.');
    }
  };

  // URL <-> screen sync: refresh, deep links and Back/Forward reopen the same record.
  useRecordRoute({ viewMode, selectedRecord, data, loading, onOpen: handleOpenForm, onClose: handleBackToList });

  const breadcrumbs = [
    { label: 'Master' },
    { label: 'Product Category', onClick: viewMode === 'form' ? handleBackToList : undefined },
  ];
  if (viewMode === 'form') {
    breadcrumbs.push({
      label: selectedRecord ? (selectedRecord.name || `Category #${selectedRecord[productCategoryConfig.primaryKey]}`) : 'New Category',
    });
  }

  if (viewMode === 'form') {
    return (
      <DynamicFormView
        config={productCategoryConfig}
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
      config={productCategoryConfig}
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

