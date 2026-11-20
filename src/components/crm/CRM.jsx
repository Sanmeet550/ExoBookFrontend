import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DynamicListView, DynamicKanbanView, ViewSwitcher } from '../common';
import CRMFormView from './CRMFormView';
import { crmService } from '../../services/resources/crmService';
import { contactService } from '../../services/resources/contactService';
import { leadStatusService } from '../../services/resources/leadStatusService';
import { opportunityStatusService } from '../../services/resources/opportunityStatusService';
import { currencyService } from '../../services/resources/currencyService';
import { useCompany } from '../../context/CompanyContext';
import { MODEL_METADATA } from '../../config/modelMetadata';
import useRecordRoute from '../../navigation/useRecordRoute';
import { MESSAGES, useNotify } from '../../context/NotificationContext';

/**
 * CRM Lead / Opportunity Module Configuration
 *
 * Exclusively integrated with FastAPI backend:
 * - GET    /crm/view/all
 * - GET    /crm/view/{lead_id}
 * - POST   /crm/create
 * - PATCH  /crm/update/{lead_id}
 * - DELETE /crm/delete/{lead_id}
 */
export const baseCrmConfig = {
  title: 'CRM',
  primaryKey: 'id',
  createButtonText: 'New',
  model: 'crm',
  service: crmService,
  columns: [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'Name', flex: 1.2, sortable: true },
    { field: 'type', headerName: 'Type', width: 100, sortable: true },
    { field: 'stage_name', headerName: 'Stage', width: 130, sortable: true },
    { field: 'customer_name', headerName: 'Customer / Partner', flex: 1, sortable: true },
    { field: 'company_name', headerName: 'Company', width: 140, sortable: true },
    { field: 'currency_name', headerName: 'Currency', width: 90, sortable: true },
    { field: 'email', headerName: 'Email', flex: 1, sortable: true },
    { field: 'phone', headerName: 'Phone', width: 120, sortable: true },
    { field: 'expected_revenue', headerName: 'Expected Revenue', width: 130, sortable: true, type: 'currency' },
    { field: 'expected_closing_date', headerName: 'Closing Date', width: 110, sortable: true },
    { field: 'reference', headerName: 'Reference', width: 110, sortable: true },
  ],
  formFields: MODEL_METADATA.crm.fields,
};

// Stage badge colors for Kanban
const STAGE_COLORS = ['#3B82F6', '#EAB308', '#8B5CF6', '#10B981', '#EC4899', '#06B6D4', '#F97316'];

export default function CRM({ recordType = 'lead' }) {
  // Company context for company-based record isolation
  const { activeCompanyId, activeCompany, companies } = useCompany();

  // recordType: 'lead' or 'opportunity' — filters and defaults the type field
  const typeLabel = recordType === 'opportunity' ? 'Opportunity' : 'Lead';
  const typeValue = recordType === 'opportunity' ? 'opportunity' : 'lead';
  const [data, setData] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(null);

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban' | 'form'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const notify = useNotify();

  const isOpportunity = recordType === 'opportunity';
  const statusService = isOpportunity ? opportunityStatusService : leadStatusService;
  const statusFieldKey = isOpportunity ? 'opportunity_status' : 'lead_status';
  const statusFieldIdKey = isOpportunity ? 'opportunity_status_id' : 'lead_status_id';

  /**
   * Loads CRM leads, contacts, stages, and currencies dynamically,
   * filtered strictly by the currently active company at API and UI level.
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const [records, partners, stageRecords, currencyRecords] = await Promise.all([
        crmService.getAll(activeCompanyId ? { company_id: activeCompanyId } : {}),
        contactService.getAll().catch(() => []),
        statusService.getAll().catch(() => []),
        currencyService.getAll().catch(() => []),
      ]);

      // Sort and store stages
      const sortedStages = Array.isArray(stageRecords)
        ? [...stageRecords].sort((a, b) => (a.sequence ?? a.id ?? 10) - (b.sequence ?? b.id ?? 10))
        : [];
      setStages(sortedStages);

      // Map partners
      const partnerMap = {};
      if (Array.isArray(partners)) {
        partners.forEach((p) => {
          if (p && p.id) {
            partnerMap[p.id] = p.name;
          }
        });
      }

      // Map stages by id
      const stageMap = {};
      sortedStages.forEach((s) => {
        stageMap[s.id] = s.name;
      });

      // Map companies by id
      const companyMap = {};
      (companies || []).forEach((c) => {
        if (c && c.id) {
          companyMap[c.id] = c.name;
        }
      });

      // Map currencies by id
      const currencyMap = {};
      if (Array.isArray(currencyRecords)) {
        currencyRecords.forEach((c) => {
          if (c && c.id) {
            currencyMap[c.id] = c.symbol || c.name;
          }
        });
      }

      if (Array.isArray(records)) {
        const formatted = records.map((r) => {
          const rawStatusId = isOpportunity
            ? (r.opportunity_status ?? r.opportunity_status_id ?? null)
            : (r.lead_status ?? r.lead_status_id ?? null);
          const statusId = rawStatusId !== null && rawStatusId !== undefined ? Number(rawStatusId) : null;

          return {
            ...r,
            type: r.type || 'lead',
            [statusFieldKey]: statusId,
            [statusFieldIdKey]: statusId,
            lead_status: r.lead_status !== undefined && r.lead_status !== null ? Number(r.lead_status) : null,
            opportunity_status: r.opportunity_status !== undefined && r.opportunity_status !== null ? Number(r.opportunity_status) : null,
            customer_name: partnerMap[r.partner_id] || (r.partner_id ? `Partner #${r.partner_id}` : '—'),
            stage_name: stageMap[statusId] || (statusId ? `Stage #${statusId}` : 'Unassigned'),
            company_id: r.company_id ? Number(r.company_id) : null,
            company_name: companyMap[r.company_id] || (r.company_id ? `Company #${r.company_id}` : '—'),
            currency_id: r.currency_id ? Number(r.currency_id) : null,
            currency_name: currencyMap[r.currency_id] || '—',
            expected_revenue: r.expected_revenue ?? 0,
            expected_closing_date: r.expected_closing_date || '—',
            email: r.email || '—',
            phone: r.phone || '—',
            reference: r.reference || '—',
          };
        });
        // Filter records by type (lead / opportunity) and active company
        const filtered = formatted.filter((r) => {
          const rType = (r.type || 'lead').toLowerCase();
          const typeMatch = rType === typeValue;
          const companyMatch = activeCompanyId ? Number(r.company_id) === Number(activeCompanyId) : true;
          return typeMatch && companyMatch;
        });
        setData(filtered);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('FastAPI CRM fetch error:', err);
      setListError(err.message || 'Failed to load live CRM records from backend.');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [typeValue, isOpportunity, statusService, statusFieldKey, statusFieldIdKey, activeCompanyId, companies]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Dynamic Kanban configuration built from backend stages
   */
  const dynamicConfig = useMemo(() => {
    const kanbanColumns = stages.map((s, idx) => ({
      value: s.id,
      label: s.name,
      color: s.is_won ? '#10B981' : STAGE_COLORS[idx % STAGE_COLORS.length],
    }));

    return {
      ...baseCrmConfig,
      title: typeLabel === 'Opportunity' ? 'Opportunities' : 'Leads',
      createButtonText: `New ${typeLabel}`,
      columns: [
        { field: 'id', headerName: 'ID', width: 80, sortable: true },
        { field: 'name', headerName: 'Name', flex: 1.2, sortable: true },
        { field: 'type', headerName: 'Type', width: 100, sortable: true },
        { field: 'stage_name', headerName: isOpportunity ? 'Opportunity Status' : 'Lead Status', width: 150, sortable: true },
        { field: 'customer_name', headerName: 'Customer / Partner', flex: 1, sortable: true },
        { field: 'company_name', headerName: 'Company', width: 140, sortable: true },
        { field: 'currency_name', headerName: 'Currency', width: 90, sortable: true },
        { field: 'email', headerName: 'Email', flex: 1, sortable: true },
        { field: 'phone', headerName: 'Phone', width: 120, sortable: true },
        { field: 'expected_revenue', headerName: 'Expected Revenue', width: 130, sortable: true, type: 'currency' },
        { field: 'expected_closing_date', headerName: 'Closing Date', width: 110, sortable: true },
        { field: 'reference', headerName: 'Reference', width: 110, sortable: true },
      ],
      kanban: {
        defaultGroupField: statusFieldKey,
        groupingOptions: [
          {
            field: statusFieldKey,
            label: 'Stage / Pipeline',
            columns: kanbanColumns.length > 0 ? kanbanColumns : [
              { value: null, label: 'Default Stage', color: '#3B82F6' },
            ],
          },
        ],
        kanbanCard: {
          titleField: 'name',
          subtitleField: 'customer_name',
          monetaryField: 'expected_revenue',
          dateField: 'expected_closing_date',
          badgeField: 'stage_name',
          extraFields: [
            { name: 'company_name', label: 'Company' },
            { name: 'currency_name', label: 'Currency' },
            { name: 'phone', label: 'Phone' },
            { name: 'email', label: 'Email' },
          ],
        },
      },
    };
  }, [stages, typeLabel, statusFieldKey]);

  /**
   * Opens the FormView for creating or editing a lead
   */
  const handleOpenForm = async (record = null) => {
    setFormError(null);
    setFieldErrors({});
    if (record && record.id) {
      try {
        setFormLoading(true);
        const detailed = await crmService.getById(record.id);
        const rawStatusId = isOpportunity
          ? (detailed?.opportunity_status ?? detailed?.opportunity_status_id ?? record?.opportunity_status ?? null)
          : (detailed?.lead_status ?? detailed?.lead_status_id ?? record?.lead_status ?? null);
        const statusId = rawStatusId !== null && rawStatusId !== undefined ? Number(rawStatusId) : null;
        const compId = detailed?.company_id ?? record?.company_id ?? activeCompanyId ?? null;
        const currId = detailed?.currency_id ?? record?.currency_id ?? activeCompany?.currency_id ?? null;

        setSelectedRecord({
          ...(detailed || record),
          [statusFieldKey]: statusId,
          [statusFieldIdKey]: statusId,
          lead_status: detailed?.lead_status ?? record?.lead_status ?? null,
          opportunity_status: detailed?.opportunity_status ?? record?.opportunity_status ?? null,
          company_id: compId ? Number(compId) : null,
          currency_id: currId ? Number(currId) : null,
        });
      } catch (err) {
        console.error('Failed to fetch detailed lead record:', err);
        const rawStatusId = isOpportunity
          ? (record?.opportunity_status ?? record?.opportunity_status_id ?? null)
          : (record?.lead_status ?? record?.lead_status_id ?? null);
        const fallbackStatus = rawStatusId !== null && rawStatusId !== undefined ? Number(rawStatusId) : null;
        const compId = record?.company_id ?? activeCompanyId ?? null;
        const currId = record?.currency_id ?? activeCompany?.currency_id ?? null;
        setSelectedRecord({
          ...record,
          [statusFieldKey]: fallbackStatus,
          [statusFieldIdKey]: fallbackStatus,
          lead_status: record?.lead_status ?? null,
          opportunity_status: record?.opportunity_status ?? null,
          company_id: compId ? Number(compId) : null,
          currency_id: currId ? Number(currId) : null,
        });
      } finally {
        setFormLoading(false);
      }
    } else {
      // For new records, set default company from active company, its currency, and current view type
      const defaultCompanyId = activeCompanyId || (companies[0]?.id ?? null);
      const defaultCompanyObj = companies.find((c) => Number(c.id) === Number(defaultCompanyId)) || activeCompany;
      const defaultCurrencyId = defaultCompanyObj?.currency_id || (companies[0]?.currency_id ?? null);

      setSelectedRecord({
        ...(record || {}),
        type: typeValue,
        company_id: defaultCompanyId ? Number(defaultCompanyId) : null,
        currency_id: defaultCurrencyId ? Number(defaultCurrencyId) : null,
      });
    }
    setViewMode('form');
  };

  const handleBackToList = () => {
    setSelectedRecord(null);
    setFormError(null);
    setFieldErrors({});
    setViewMode('list');
  };

  /**
   * Saves or updates a lead, strictly matching FastAPI Pydantic schemas:
   * CrmLeadCreate / CrmLeadUpdate
   */
  const handleSave = async (formData) => {
    setFormLoading(true);
    setFormError(null);
    setFieldErrors({});

    const pKey = baseCrmConfig.primaryKey;
    const isExisting = Boolean(selectedRecord && selectedRecord[pKey]);
    const recordTypeToSave = formData.type || typeValue;
    const isRecordOpp = recordTypeToSave === 'opportunity';

    const resolvedStatus = isRecordOpp
      ? (formData.opportunity_status ?? formData.opportunity_status_id ?? null)
      : (formData.lead_status ?? formData.lead_status_id ?? null);

    // Construct backend payload conforming to CrmLeadCreate / CrmLeadUpdate
    const payload = {
      name: formData.name ? formData.name.trim() : '',
      type: recordTypeToSave,
      expected_revenue:
        formData.expected_revenue !== '' &&
        formData.expected_revenue !== null &&
        formData.expected_revenue !== undefined
          ? Number(formData.expected_revenue)
          : null,
      partner_id: formData.partner_id ? Number(formData.partner_id) : null,
      lead_status: !isRecordOpp && resolvedStatus ? Number(resolvedStatus) : (formData.lead_status ? Number(formData.lead_status) : null),
      opportunity_status: isRecordOpp && resolvedStatus ? Number(resolvedStatus) : (formData.opportunity_status ? Number(formData.opportunity_status) : null),
      email: formData.email && formData.email.trim() ? formData.email.trim().toLowerCase() : null,
      phone: formData.phone && formData.phone.trim() ? formData.phone.trim() : null,
      pan: formData.pan && formData.pan.trim() ? formData.pan.trim().toUpperCase() : null,
      reference: formData.reference && formData.reference.trim() ? formData.reference.trim() : null,
      notes: formData.notes && formData.notes.trim() ? formData.notes.trim() : null,
      expected_closing_date: formData.expected_closing_date || null,
      company_id: formData.company_id ? Number(formData.company_id) : (activeCompanyId || null),
      currency_id: formData.currency_id ? Number(formData.currency_id) : (activeCompany?.currency_id || null),
    };

    try {
      let savedRecord;
      if (isExisting) {
        savedRecord = await crmService.update(selectedRecord[pKey], payload);
      } else {
        savedRecord = await crmService.create(payload);
      }
      await loadData();
      notify.success(isExisting ? MESSAGES.updated : MESSAGES.created);
      // Stay on form view: update selectedRecord with saved data instead of navigating away
      if (isExisting) {
        setSelectedRecord((prev) => ({ ...prev, ...payload }));
      } else if (savedRecord && savedRecord.id) {
        // For new records, navigate to the created record's form
        setSelectedRecord({ ...payload, id: savedRecord.id });
      } else {
        handleBackToList();
      }
    } catch (err) {
      console.error('CRM save error:', err);
      setFormError(err.message || 'Failed to save CRM lead.');
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Deletes a lead
   */
  const handleDelete = async (id, options = {}) => {
    if (!options?.skipConfirm && !window.confirm('Are you sure you want to delete this CRM lead?')) return;
    try {
      await crmService.delete(id);
      notify.success(MESSAGES.deleted);
      setData((prev) => prev.filter((item) => item[baseCrmConfig.primaryKey] !== id));
    } catch (err) {
      console.error('Failed to delete CRM lead:', err);
      setListError(err.message || 'Failed to delete CRM lead.');
      throw err;
    }
  };

  /**
   * Handles optimistic drag-and-drop card move between columns in Kanban
   */
  const handleRecordMove = async (record, targetValue, groupField) => {
    const previousValue = record[groupField];
    const recordId = record[baseCrmConfig.primaryKey];
    const targetNum = targetValue ? Number(targetValue) : null;
    const isRecordOpp = (record.type || typeValue) === 'opportunity';
    const backendStatusField = isRecordOpp ? 'opportunity_status' : 'lead_status';

    // Optimistic update
    setData((prev) =>
      prev.map((item) =>
        item[baseCrmConfig.primaryKey] === recordId
          ? {
              ...item,
              [groupField]: targetNum,
              [backendStatusField]: targetNum,
              stage_name: stages.find((s) => s.id === targetNum)?.name || item.stage_name,
            }
          : item
      )
    );

    try {
      await crmService.update(recordId, {
        [backendStatusField]: targetNum,
      });
      await loadData();
    } catch (err) {
      // Revert on failure
      setData((prev) =>
        prev.map((item) =>
          item[baseCrmConfig.primaryKey] === recordId ? { ...item, [groupField]: previousValue } : item
        )
      );
      throw err;
    }
  };

  // URL <-> screen sync: refresh, deep links and Back/Forward reopen the same record.
  useRecordRoute({ viewMode, selectedRecord, data, loading, onOpen: handleOpenForm, onClose: handleBackToList });

  const breadcrumbs = [
    { label: 'CRM' },
    { label: typeLabel === 'Opportunity' ? 'Opportunities' : 'Leads', onClick: viewMode === 'form' ? handleBackToList : undefined },
  ];
  if (viewMode === 'form') {
    breadcrumbs.push({
      label: selectedRecord ? (selectedRecord.name || `${typeLabel} #${selectedRecord[baseCrmConfig.primaryKey]}`) : `New ${typeLabel}`,
    });
  }

  // Render Full-Page CRM FormView with Odoo Status Progression bar
  if (viewMode === 'form') {
    return (
      <CRMFormView
        initialData={selectedRecord}
        recordType={typeValue}
        records={data}
        activeCompanyId={activeCompanyId}
        activeCompany={activeCompany}
        companies={companies}
        onNavigateRecord={(rec) => handleOpenForm(rec)}
        onNew={() => handleOpenForm(null)}
        loading={formLoading}
        error={formError}
        fieldErrors={fieldErrors}
        onSave={handleSave}
        onBack={handleBackToList}
        breadcrumbs={breadcrumbs}
        stages={stages}
        onStageUpdated={(newStageId) => {
          setSelectedRecord((prev) =>
            prev
              ? {
                  ...prev,
                  [statusFieldKey]: newStageId,
                  [statusFieldIdKey]: newStageId,
                }
              : prev
          );
          loadData();
        }}
        onTypeConverted={() => {
          loadData();
        }}
      />
    );
  }

  // View Switcher component to pass into both List and Kanban views
  const viewSwitchControl = (
    <ViewSwitcher
      currentView={viewMode}
      onViewChange={(newMode) => setViewMode(newMode)}
    />
  );

  // Render Dynamic Kanban View
  if (viewMode === 'kanban') {
    return (
      <DynamicKanbanView
        config={dynamicConfig}
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

  // Render Dynamic ListView
  return (
    <DynamicListView
      config={dynamicConfig}
      data={data}
      loading={loading}
      error={listError}
      onRowClick={(rec) => handleOpenForm(rec)}
      onCreateClick={() => handleOpenForm(null)}
      onDeleteClick={handleDelete}
      onRefresh={loadData}
      breadcrumbs={breadcrumbs}
      viewSwitchControl={viewSwitchControl}
    />
  );
}
