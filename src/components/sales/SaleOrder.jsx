import React, { useState, useEffect, useCallback } from 'react';
import { DynamicListView, DynamicKanbanView, ViewSwitcher } from '../common';
import SaleOrderFormView from './SaleOrderFormView';
import { saleOrderService } from '../../services/resources/saleOrderService';
import { contactService } from '../../services/resources/contactService';

/**
 * SaleOrder Component
 * 
 * Fetches real live data exclusively from the FastAPI backend:
 * - GET /sales/view/all
 * - GET /sales/view/{id}
 * - POST /sales/create
 * - POST /sales/update/{id}
 * - DELETE /sales/delete/{id}
 */
export const saleOrderConfig = {
  title: 'Sale Orders',
  subtitle: 'Manage and track customer sales orders, quotation statuses, order lines, and fulfillment',
  primaryKey: 'id',
  createButtonText: 'New Sale Order',
  columns: [
    { field: 'id', headerName: 'Order ID', width: 110, sortable: true },
    { field: 'name', headerName: 'Order Number', width: 150, sortable: true },
    { field: 'customer_name', headerName: 'Customer / Partner', flex: 1, sortable: true },
    { field: 'validity_date', headerName: 'Order Date', width: 130, sortable: true },
    { field: 'totalAmount', headerName: 'Total Amount', width: 140, sortable: true, type: 'currency' },
  ],

  // Kanban View Configuration
  kanban: {
    defaultGroupField: 'client_order_ref',
    groupingOptions: [
      {
        field: 'client_order_ref',
        label: 'Status / Stage',
        columns: [
          { value: 'Quotation', label: 'Quotation', color: '#3B82F6' },
          { value: 'Quotation Sent', label: 'Quotation Sent', color: '#EAB308' },
          { value: 'Sales Order', label: 'Sales Order', color: '#10B981' },
          { value: 'Cancelled', label: 'Cancelled', color: '#94A3B8' },
        ],
      },
    ],
    kanbanCard: {
      titleField: 'name',
      subtitleField: 'customer_name',
      monetaryField: 'totalAmount',
      dateField: 'validity_date',
      extraFields: [
        { name: 'id', label: 'Order ID' },
      ],
    },
  },
};

export default function SaleOrder() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(null);

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban' | 'form'
  const [selectedRecord, setSelectedRecord] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      // Fetch live sales orders and partner names concurrently
      const [records, partners] = await Promise.all([
        saleOrderService.getAll(),
        contactService.getAll().catch(() => []),
      ]);

      const partnerMap = {};
      if (Array.isArray(partners)) {
        partners.forEach((p) => {
          if (p && p.id) {
            partnerMap[p.id] = p.name;
          }
        });
      }

      if (Array.isArray(records)) {
        const formatted = records.map((r, index) => {
          const lines = Array.isArray(r.order_lines) ? r.order_lines : [];
          const calculatedTotal = lines.reduce(
            (acc, l) => acc + (Number(l.quantity) || 0) * (Number(l.price_unit) || 0),
            0
          );

          return {
            ...r,
            id: r.id || index + 1,
            name: r.name || `SO-${1000 + (r.id || index + 1)}`,
            customer_name: partnerMap[r.partner_id] || (r.partner_id ? `Partner #${r.partner_id}` : '—'),
            totalAmount: calculatedTotal,
            validity_date: r.validity_date || '—',
          };
        });

        setData(formatted);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('FastAPI sales order fetch error:', err);
      setListError(err.message || 'Failed to load live sale orders from backend.');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenForm = async (record = null) => {
    if (record && record.id) {
      try {
        setLoading(true);
        const detailed = await saleOrderService.getById(record.id);
        setSelectedRecord(detailed || record);
      } catch (err) {
        console.error('Failed to fetch detailed sale order:', err);
        setSelectedRecord(record);
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedRecord(null);
    }
    setViewMode('form');
  };

  const handleBackToList = () => {
    setSelectedRecord(null);
    setViewMode('list');
  };

  const handleSave = async (orderPayload) => {
    const pKey = saleOrderConfig.primaryKey;
    const isExisting = Boolean(selectedRecord && selectedRecord[pKey]);

    if (isExisting) {
      await saleOrderService.update(selectedRecord[pKey], orderPayload);
    } else {
      await saleOrderService.create(orderPayload);
    }

    await loadData();
    handleBackToList();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sales order?')) return;
    try {
      await saleOrderService.delete(id);
      setData((prev) => prev.filter((item) => item[saleOrderConfig.primaryKey] !== id));
    } catch (err) {
      console.error('Failed to delete sales order:', err);
      setListError(err.message || 'Failed to delete sales order.');
    }
  };

  /**
   * Handles optimistic drag-and-drop card move between stages
   */
  const handleRecordMove = async (record, targetValue, groupField) => {
    const previousValue = record[groupField];
    const recordId = record[saleOrderConfig.primaryKey];

    // Optimistically update local state
    setData((prev) =>
      prev.map((item) =>
        item[saleOrderConfig.primaryKey] === recordId ? { ...item, [groupField]: targetValue } : item
      )
    );

    try {
      // Build update payload for FastAPI
      const payload = {
        partner_id: Number(record.partner_id),
        currency_id: Number(record.currency_id),
        warehouse_id: record.warehouse_id ? Number(record.warehouse_id) : 1,
        company_id: Number(record.company_id),
        validity_date: record.validity_date !== '—' ? record.validity_date : undefined,
        client_order_ref: targetValue,
        order_lines: Array.isArray(record.order_lines)
          ? record.order_lines
              .filter((l) => typeof l.id === 'number')
              .map((l) => ({
                id: l.id,
                product_id: Number(l.product_id),
                description: l.description || '',
                quantity: Number(l.quantity) || 0,
                price_unit: Number(l.price_unit) || 0,
              }))
          : [],
      };

      await saleOrderService.update(recordId, payload);
    } catch (err) {
      // Revert local state on failure
      setData((prev) =>
        prev.map((item) =>
          item[saleOrderConfig.primaryKey] === recordId ? { ...item, [groupField]: previousValue } : item
        )
      );
      throw err;
    }
  };

  const breadcrumbs = [
    { label: 'Sale Order', onClick: viewMode === 'form' ? handleBackToList : undefined },
  ];
  if (viewMode === 'form') {
    breadcrumbs.push({
      label: selectedRecord ? (selectedRecord.name || `SO-${selectedRecord[saleOrderConfig.primaryKey]}`) : 'New Sale Order',
    });
  }

  // Render Full-Page FormView on row click or create
  if (viewMode === 'form') {
    return (
      <SaleOrderFormView
        initialData={selectedRecord}
        records={data}
        onNavigateRecord={(rec) => handleOpenForm(rec)}
        onNew={() => handleOpenForm(null)}
        onSave={handleSave}
        onBack={handleBackToList}
        breadcrumbs={breadcrumbs}
      />
    );
  }

  // View Switcher control
  const viewSwitchControl = (
    <ViewSwitcher
      currentView={viewMode}
      onViewChange={(newMode) => setViewMode(newMode)}
    />
  );

  // Render Kanban View
  if (viewMode === 'kanban') {
    return (
      <DynamicKanbanView
        config={saleOrderConfig}
        data={data}
        loading={loading}
        error={listError}
        onCardClick={(rec) => handleOpenForm(rec)}
        onCreateClick={(defaults) => handleOpenForm(defaults ? { ...defaults } : null)}
        onRecordMove={handleRecordMove}
        breadcrumbs={breadcrumbs}
        viewSwitchControl={viewSwitchControl}
      />
    );
  }

  // Render ListView
  return (
    <DynamicListView
      config={saleOrderConfig}
      data={data}
      loading={loading}
      error={listError}
      onRowClick={(rec) => handleOpenForm(rec)}
      onCreateClick={() => handleOpenForm(null)}
      onEditClick={(rec) => handleOpenForm(rec)}
      onDeleteClick={handleDelete}
      breadcrumbs={breadcrumbs}
      viewSwitchControl={viewSwitchControl}
    />
  );
}
