import React, { useState, useEffect, useCallback } from 'react';
import { UniversalDataView, DynamicFormView } from '../../common';
import { productService } from '../../../services/resources/productService';
import { MODEL_METADATA } from '../../../config/modelMetadata';

/**
 * Product Master Component
 * 
 * Configured with dynamic model metadata:
 * - Foreign Keys (many2one): categ_id (Product Category), uom_id (UOM)
 * - Enum / Selection: product_type ('stockable', 'consumable', 'service')
 * - Booleans: is_sellable, is_purchasable
 */
export const productConfig = {
  title: 'Products',
  subtitle: 'Master catalog of inventory items, sale products, retail pricing and specifications',
  formDescription: 'Configure product master identifiers, category classification, pricing schedules and stock units.',
  primaryKey: 'id',
  createButtonText: 'New Product',
  model: 'product',
  columns: [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'Product Name', flex: 1, sortable: true },
    { field: 'code', headerName: 'Product Code / SKU', width: 160, sortable: true },
    { field: 'product_type', headerName: 'Product Type', width: 140 },
    {
      field: 'sales_price',
      headerName: 'Sales Price',
      width: 140,
      sortable: true,
      type: 'currency',
    },
  ],
  formFields: MODEL_METADATA.product.fields,
};

export default function Product() {
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
      const records = await productService.getAll();
      setData(Array.isArray(records) ? records : []);
    } catch (err) {
      setListError(err.message || 'Failed to load products.');
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

    const pKey = productConfig.primaryKey;
    const isExisting = Boolean(selectedRecord && selectedRecord[pKey]);

    const payload = {
      name: formData.name,
      code: formData.code,
      product_type: formData.product_type || 'stockable',
      categ_id: Number(formData.categ_id) || 1,
      uom_id: Number(formData.uom_id) || 1,
      sales_price: formData.sales_price ? Number(formData.sales_price) : 0,
      is_sellable: Boolean(formData.is_sellable),
      is_purchasable: Boolean(formData.is_purchasable),
      sales_description: formData.sales_description || '',
      purchase_description: formData.purchase_description || '',
    };

    try {
      if (isExisting) {
        await productService.update(selectedRecord[pKey], payload);
      } else {
        await productService.create(payload);
      }
      await loadData();
      handleBackToList();
    } catch (err) {
      setFormError(err.message || 'Failed to save product record.');
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productService.delete(id);
      setData((prev) => prev.filter((item) => item[productConfig.primaryKey] !== id));
    } catch (err) {
      setListError(err.message || 'Failed to delete product.');
    }
  };

  const breadcrumbs = [
    { label: 'Master' },
    { label: 'Product', onClick: viewMode === 'form' ? handleBackToList : undefined },
  ];
  if (viewMode === 'form') {
    breadcrumbs.push({
      label: selectedRecord ? (selectedRecord.name || `Product #${selectedRecord[productConfig.primaryKey]}`) : 'New Product',
    });
  }

  if (viewMode === 'form') {
    return (
      <DynamicFormView
        config={productConfig}
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
      config={productConfig}
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
