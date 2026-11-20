import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  Grid,
  TextField,
  MenuItem,
  Divider,
  Alert,
  Snackbar,
  InputAdornment,
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  DescriptionOutlined as DescriptionOutlinedIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import FormViewToolbar from '../common/FormViewToolbar';
import StatusProgression from './StatusProgression';
import { contactService } from '../../services/resources/contactService';
import { crmService } from '../../services/resources/crmService';
import { opportunityStatusService } from '../../services/resources/opportunityStatusService';
import { currencyService } from '../../services/resources/currencyService';
import { useCompany } from '../../context/CompanyContext';

/**
 * CRMFormView
 * 
 * Full-Page Odoo-style CRM FormView integrated with FastAPI:
 * - Single-Line Header: [New] [Breadcrumb] [Save] [Discard] ... [Status Progression Chevrons] [Page Counter] [<] [>]
 * - Stages displayed cleanly without enclosing box or container
 * - Dynamic stages fetched from LeadStatus master
 * - Clicking a stage updates the lead via PATCH /crm/update/{id}
 * - Customer / Partner dropdown loaded dynamically from contacts
 */
export default function CRMFormView({
  initialData = null,
  records = [],
  onNavigateRecord,
  onNew,
  loading = false,
  error = null,
  fieldErrors = {},
  onSave,
  onBack,
  stages = [],
  onStageUpdated,
  onTypeConverted,
  recordType = 'lead',
  activeCompanyId: propActiveCompanyId = null,
  activeCompany: propActiveCompany = null,
  companies: propCompanies = [],
}) {
  const isEditMode = Boolean(initialData && initialData.id);

  // Company and Currency context integration
  const companyContext = useCompany() || {};
  const companies = propCompanies.length > 0 ? propCompanies : (companyContext.companies || []);
  const activeCompanyId = propActiveCompanyId || companyContext.activeCompanyId;
  const activeCompany = propActiveCompany || companyContext.activeCompany;

  const [currencies, setCurrencies] = useState([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);

  // Form fields state and dirty tracking
  const [formData, setFormData] = useState({
    name: '',
    type: recordType || 'lead',
    expected_revenue: '',
    partner_id: '',
    company_id: '',
    currency_id: '',
    email: '',
    phone: '',
    pan: '',
    reference: '',
    expected_closing_date: '',
    notes: '',
    lead_status: '',
    lead_status_id: '',
    opportunity_status: '',
    opportunity_status_id: '',
  });

  const activeCurrency = useMemo(
    () => currencies.find((c) => Number(c.id) === Number(formData.currency_id)),
    [currencies, formData.currency_id]
  );
  const activeCurrencySymbol = activeCurrency?.symbol || activeCurrency?.name || '';

  const [isDirty, setIsDirty] = useState(false);
  const initialValuesRef = useRef({});

  // Current stage state
  const [currentStageId, setCurrentStageId] = useState(null);
  const [stageUpdating, setStageUpdating] = useState(false);
  const [stageMessage, setStageMessage] = useState(null);
  const [converting, setConverting] = useState(false);

  // Customer / Partner dropdown options
  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);

  // Record navigation indices
  const currentIndex = isEditMode
    ? records.findIndex((r) => r.id === initialData.id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < records.length - 1;

  // Load partners and currencies on mount
  useEffect(() => {
    let mounted = true;
    setLoadingPartners(true);
    setLoadingCurrencies(true);

    contactService
      .getAll()
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setPartners(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load contacts for CRM form:', err);
      })
      .finally(() => {
        if (mounted) setLoadingPartners(false);
      });

    currencyService
      .getAll()
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setCurrencies(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load currencies for CRM form:', err);
      })
      .finally(() => {
        if (mounted) setLoadingCurrencies(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Initialize form data when initialData, stages, or active company changes
  useEffect(() => {
    let initialVals = {};
    const effectiveType = initialData?.type || recordType || 'lead';
    const isOpp = effectiveType === 'opportunity';

    if (initialData) {
      // Extract active status based on record type
      const rawLeadStatus = initialData.lead_status ?? initialData.lead_status_id ?? null;
      const leadStatusId = rawLeadStatus !== null && rawLeadStatus !== undefined ? Number(rawLeadStatus) : null;
      const rawOppStatus = initialData.opportunity_status ?? initialData.opportunity_status_id ?? null;
      const oppStatusId = rawOppStatus !== null && rawOppStatus !== undefined ? Number(rawOppStatus) : null;

      const activeStatusId = isOpp ? oppStatusId : leadStatusId;

      // Retain previously selected company or fallback to active company
      const compId = initialData.company_id || activeCompanyId || (companies[0]?.id ?? '');
      const compObj = companies.find((c) => Number(c.id) === Number(compId)) || activeCompany;
      const currId = initialData.currency_id || compObj?.currency_id || (currencies[0]?.id ?? '');

      initialVals = {
        name: initialData.name || '',
        type: effectiveType,
        expected_revenue: initialData.expected_revenue ?? '',
        partner_id: initialData.partner_id || '',
        company_id: compId ? Number(compId) : '',
        currency_id: currId ? Number(currId) : '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        pan: initialData.pan || '',
        reference: initialData.reference || '',
        expected_closing_date: initialData.expected_closing_date || '',
        notes: initialData.notes || '',
        lead_status: leadStatusId || '',
        lead_status_id: leadStatusId || '',
        opportunity_status: oppStatusId || '',
        opportunity_status_id: oppStatusId || '',
      };
      setFormData(initialVals);
      setCurrentStageId(activeStatusId || (stages[0]?.id ?? null));
    } else {
      const defaultStageId = stages[0]?.id || null;
      // Default to active company and its configured currency
      const compId = activeCompanyId || (companies[0]?.id ?? '');
      const compObj = companies.find((c) => Number(c.id) === Number(compId)) || activeCompany;
      const currId = compObj?.currency_id || (currencies[0]?.id ?? '');

      initialVals = {
        name: '',
        type: effectiveType,
        expected_revenue: '',
        partner_id: '',
        company_id: compId ? Number(compId) : '',
        currency_id: currId ? Number(currId) : '',
        email: '',
        phone: '',
        pan: '',
        reference: '',
        expected_closing_date: '',
        notes: '',
        lead_status: !isOpp ? (defaultStageId || '') : '',
        lead_status_id: !isOpp ? (defaultStageId || '') : '',
        opportunity_status: isOpp ? (defaultStageId || '') : '',
        opportunity_status_id: isOpp ? (defaultStageId || '') : '',
      };
      setFormData(initialVals);
      setCurrentStageId(defaultStageId);
    }
    initialValuesRef.current = { ...initialVals };
    setIsDirty(false);
  }, [initialData, stages, recordType, activeCompanyId, activeCompany, companies, currencies]);

  // Automatic currency update when company changes
  const handleCompanyChange = (e) => {
    const newCompId = e.target.value ? Number(e.target.value) : '';
    const foundComp = companies.find((c) => Number(c.id) === newCompId);
    const autoCurrencyId = foundComp?.currency_id || '';

    setFormData((prev) => ({
      ...prev,
      company_id: newCompId,
      currency_id: autoCurrencyId,
    }));
    setIsDirty(true);
  };

  // Handle stage change from StatusProgression or Stage dropdown
  const handleStageChange = async (newStageId) => {
    // Normalize both to numbers for reliable comparison
    const nextId = newStageId !== null && newStageId !== undefined ? Number(newStageId) : null;
    const prevId = currentStageId !== null && currentStageId !== undefined ? Number(currentStageId) : null;
    if (!nextId || nextId === prevId) return;

    const targetStage = stages.find((s) => Number(s.id) === nextId);
    const stageName = targetStage?.name || `Stage #${nextId}`;
    const isOpp = (formData.type || recordType) === 'opportunity';
    const statusField = isOpp ? 'opportunity_status' : 'lead_status';
    const statusFieldId = isOpp ? 'opportunity_status_id' : 'lead_status_id';

    if (isEditMode) {
      // Optimistic update: show immediately
      setCurrentStageId(nextId);
      setFormData((prev) => ({ ...prev, [statusField]: nextId, [statusFieldId]: nextId }));
      try {
        setStageUpdating(true);
        await crmService.update(initialData.id, { [statusField]: nextId });
        setStageMessage(`Advanced to "${stageName}"`);
        if (onStageUpdated) onStageUpdated(nextId);
      } catch (err) {
        // Revert on failure
        console.error('Failed to update stage status:', err);
        setCurrentStageId(prevId);
        setFormData((prev) => ({ ...prev, [statusField]: prevId, [statusFieldId]: prevId }));
        setStageMessage(`Error updating stage: ${err.message || 'Server error'}`);
      } finally {
        setStageUpdating(false);
      }
    } else {
      setCurrentStageId(nextId);
      setFormData((prev) => {
        const next = { ...prev, [statusField]: nextId, [statusFieldId]: nextId };
        const dirty = Object.keys(next).some((k) => {
          const initV = initialValuesRef.current[k] ?? '';
          const currV = next[k] ?? '';
          return String(initV).trim() !== String(currV).trim();
        });
        setIsDirty(dirty);
        return next;
      });
    }
  };

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    const newFormData = { ...formData, [field]: val };
    setFormData(newFormData);

    // Check if form is modified compared to initial values
    const dirty = Object.keys(newFormData).some((k) => {
      const initV = initialValuesRef.current[k] ?? '';
      const currV = newFormData[k] ?? '';
      return String(initV).trim() !== String(currV).trim();
    });
    setIsDirty(dirty);

    if (
      field === 'lead_status' ||
      field === 'lead_status_id' ||
      field === 'opportunity_status' ||
      field === 'opportunity_status_id'
    ) {
      const numVal = val ? Number(val) : null;
      handleStageChange(numVal);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (onSave) {
      const isOpp = (formData.type || recordType) === 'opportunity';
      const chosenStatus = currentStageId || (isOpp ? (formData.opportunity_status || formData.opportunity_status_id) : (formData.lead_status || formData.lead_status_id)) || null;
      const statusNum = chosenStatus ? Number(chosenStatus) : null;

      const payload = {
        ...formData,
        type: formData.type || recordType || 'lead',
        lead_status: !isOpp ? statusNum : null,
        lead_status_id: !isOpp ? statusNum : null,
        opportunity_status: isOpp ? statusNum : null,
        opportunity_status_id: isOpp ? statusNum : null,
      };
      onSave(payload);
      initialValuesRef.current = { ...payload };
      setIsDirty(false);
    }
  };

  const handleDiscard = () => {
    setFormData({ ...initialValuesRef.current });
    const isOpp = (initialValuesRef.current.type || recordType) === 'opportunity';
    const revertStatus = isOpp
      ? (initialValuesRef.current.opportunity_status || initialValuesRef.current.opportunity_status_id || null)
      : (initialValuesRef.current.lead_status || initialValuesRef.current.lead_status_id || null);
    setCurrentStageId(revertStatus ? Number(revertStatus) : null);
    setIsDirty(false);
  };

  const handlePrev = () => {
    if (hasPrev && onNavigateRecord) {
      onNavigateRecord(records[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigateRecord) {
      onNavigateRecord(records[currentIndex + 1]);
    }
  };

  const handleNew = () => {
    if (onNew) {
      onNew();
    }
  };

  const handleWon = async () => {
    // Dynamic won stage finding based on is_won boolean
    const wonStage = stages.find((s) => Boolean(s.is_won));
    if (wonStage) {
      await handleStageChange(wonStage.id);
    } else {
      setStageMessage('No stage is marked as Won in the status master configuration.');
    }
  };

  const handleLost = async () => {
    // Find stage containing 'lost'
    const lostStage = stages.find((s) => /lost/i.test(s.name));
    if (lostStage) {
      await handleStageChange(lostStage.id);
    } else {
      setStageMessage('Record marked as Lost');
    }
  };

  const handleConvertToOpportunity = async () => {
    if (!isEditMode) return;
    setConverting(true);
    setStageMessage(null);

    try {
      // 1. Fetch available opportunity statuses to find default
      let defaultOppStageId = null;
      try {
        const oppStatuses = await opportunityStatusService.getAll();
        if (Array.isArray(oppStatuses) && oppStatuses.length > 0) {
          const sorted = [...oppStatuses].sort((a, b) => (a.sequence ?? 10) - (b.sequence ?? 10));
          defaultOppStageId = sorted[0]?.id ?? null;
        }
      } catch (e) {
        console.warn('Could not fetch opportunity statuses for conversion:', e);
      }

      // 2. Prepare payload to convert lead to opportunity, preserving all fields
      const convertPayload = {
        type: 'opportunity',
        lead_status: null,
        lead_status_id: null,
        opportunity_status: defaultOppStageId,
        opportunity_status_id: defaultOppStageId,
      };

      // 3. Save via backend API
      await crmService.update(initialData.id, convertPayload);

      // 4. Update local state
      setFormData((prev) => ({
        ...prev,
        ...convertPayload,
      }));
      setCurrentStageId(defaultOppStageId);
      setIsDirty(false);
      setStageMessage('Successfully converted Lead to Opportunity!');

      // 5. Notify parent to refresh list/Kanban view
      if (onTypeConverted) {
        onTypeConverted();
      }
    } catch (err) {
      console.error('Failed to convert to opportunity:', err);
      setStageMessage(err.message || 'Failed to convert to opportunity.');
    } finally {
      setConverting(false);
    }
  };

  const handleNewQuotation = () => {
    setStageMessage('New quotation creation initiated');
  };

  // Odoo-style smart stat buttons in the toolbar
  const statSlot = (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.75, mr: 1 }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<CalendarTodayIcon sx={{ fontSize: '0.8125rem !important', color: '#714B67' }} />}
        sx={{
          height: 28,
          px: 1,
          py: 0,
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: '#475569',
          borderColor: '#CBD5E1',
          bgcolor: '#FFFFFF',
          textTransform: 'none',
          borderRadius: '4px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' },
        }}
      >
        No Meeting
      </Button>

      <Button
        variant="outlined"
        size="small"
        startIcon={<DescriptionOutlinedIcon sx={{ fontSize: '0.875rem !important', color: '#714B67' }} />}
        sx={{
          height: 28,
          px: 1,
          py: 0,
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: '#475569',
          borderColor: '#CBD5E1',
          bgcolor: '#FFFFFF',
          textTransform: 'none',
          borderRadius: '4px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' },
        }}
      >
        Quotations <Box component="span" sx={{ ml: 0.5, color: '#714B67', fontWeight: 700 }}>1</Box>
      </Button>

      <Button
        variant="outlined"
        size="small"
        startIcon={<StarBorderIcon sx={{ fontSize: '0.875rem !important', color: '#D97706' }} />}
        sx={{
          height: 28,
          px: 1,
          py: 0,
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: '#475569',
          borderColor: '#CBD5E1',
          bgcolor: '#FFFFFF',
          textTransform: 'none',
          borderRadius: '4px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' },
        }}
      >
        Similar Leads <Box component="span" sx={{ ml: 0.5, color: '#475569', fontWeight: 700 }}>6</Box>
      </Button>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', p: 0 }}>
      {/* 1. Odoo-Style Single-Line Form View Toolbar */}
      <FormViewToolbar
        onNew={handleNew}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={handlePrev}
        onNext={handleNext}
        currentIndex={currentIndex}
        totalRecords={records.length}
        onSave={handleSubmit}
        onDiscard={handleDiscard}
        isDirty={isDirty}
        saving={loading}
        disabled={stageUpdating}
        recordName={formData.name || (initialData?.id ? `${recordType === 'opportunity' ? 'Opportunity' : 'Lead'} #${initialData.id}` : `New ${recordType === 'opportunity' ? 'Opportunity' : 'Lead'}`)}
        parentBreadcrumb={{ label: recordType === 'opportunity' ? 'Opportunities' : 'Leads', onClick: onBack }}
        statSlot={statSlot}
      />

      {/* General Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 1.5, py: 0.25, fontSize: '0.6875rem' }}>
          {error}
        </Alert>
      )}

      {/* Form Container Card / Sheet */}
      <Card
        component="form"
        onSubmit={handleSubmit}
        sx={{
          bgcolor: 'white',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        {/* Odoo Form Statusbar: Action buttons on left, Status Progression on right */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            px: 2,
            py: 1,
            borderBottom: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
          }}
        >
          {/* Action buttons on left: New Quotation, Won, Lost */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleNewQuotation}
              disabled={loading || stageUpdating}
              sx={{
                bgcolor: '#714B67',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'none',
                px: 1.5,
                py: 0.4,
                boxShadow: 'none',
                borderRadius: '4px',
                '&:hover': {
                  bgcolor: '#5B3953',
                  boxShadow: 'none',
                },
              }}
            >
              New Quotation
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={handleWon}
              disabled={loading || stageUpdating}
              sx={{
                bgcolor: '#FFFFFF',
                color: '#1E293B',
                borderColor: '#CBD5E1',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'none',
                px: 1.5,
                py: 0.4,
                borderRadius: '4px',
                '&:hover': {
                  bgcolor: '#F1F5F9',
                  borderColor: '#94A3B8',
                },
              }}
            >
              Won
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={handleLost}
              disabled={loading || stageUpdating}
              sx={{
                bgcolor: '#FFFFFF',
                color: '#1E293B',
                borderColor: '#CBD5E1',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'none',
                px: 1.5,
                py: 0.4,
                borderRadius: '4px',
                '&:hover': {
                  bgcolor: '#F1F5F9',
                  borderColor: '#94A3B8',
                },
              }}
            >
              Lost
            </Button>

            {/* Convert to Opportunity Button: Visible ONLY for Leads */}
            {(formData.type || recordType) === 'lead' && isEditMode && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleConvertToOpportunity}
                disabled={loading || stageUpdating || converting}
                sx={{
                  bgcolor: '#F8FAFC',
                  color: '#2563EB',
                  borderColor: '#93C5FD',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 1.5,
                  py: 0.4,
                  borderRadius: '4px',
                  '&:hover': {
                    bgcolor: '#EFF6FF',
                    borderColor: '#60A5FA',
                  },
                }}
              >
                {converting ? 'Converting...' : 'Convert to Opportunity'}
              </Button>
            )}
          </Box>

          {/* Status Progression Chevrons on right */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            <StatusProgression
              stages={stages}
              currentStageId={currentStageId}
              onStageChange={handleStageChange}
              loading={stageUpdating}
              disabled={loading}
            />
          </Box>
        </Box>

        {/* Form Body */}
        <Box sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
          {/* Opportunity / Lead Name (Prominent Header Input) */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              required
              label="Opportunity / Lead Name"
              placeholder="e.g. Enterprise Cloud ERP Implementation"
              value={formData.name}
              onChange={handleChange('name')}
              error={Boolean(fieldErrors.name)}
              helperText={fieldErrors.name}
              disabled={loading}
              inputProps={{ style: { fontSize: '0.8125rem', fontWeight: 600 } }}
              InputLabelProps={{ style: { fontSize: '0.75rem' } }}
            />
          </Grid>

          {/* Type (Lead / Opportunity) */}
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Type"
              value={formData.type || recordType || 'lead'}
              onChange={handleChange('type')}
              error={Boolean(fieldErrors.type)}
              helperText={fieldErrors.type}
              disabled={loading}
              inputProps={{ style: { fontSize: '0.75rem' } }}
              InputLabelProps={{ style: { fontSize: '0.75rem' } }}
            >
              <MenuItem value="lead" sx={{ fontSize: '0.75rem' }}>Lead</MenuItem>
              <MenuItem value="opportunity" sx={{ fontSize: '0.75rem' }}>Opportunity</MenuItem>
            </TextField>
          </Grid>

          {/* Expected Revenue */}
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Expected Revenue"
              placeholder="0.00"
              value={formData.expected_revenue}
              onChange={handleChange('expected_revenue')}
              error={Boolean(fieldErrors.expected_revenue)}
              helperText={fieldErrors.expected_revenue}
              disabled={loading}
              InputProps={{
                startAdornment: activeCurrencySymbol ? (
                  <InputAdornment position="start" sx={{ '& p': { fontSize: '0.75rem', fontWeight: 600, color: '#475569' } }}>
                    {activeCurrencySymbol}
                  </InputAdornment>
                ) : null,
              }}
              inputProps={{ min: 0, step: 'any', style: { fontSize: '0.75rem' } }}
              InputLabelProps={{ style: { fontSize: '0.75rem' } }}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 0.5 }} />
          </Grid>

          {/* Customer / Partner Dropdown */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Customer / Partner"
              value={formData.partner_id || ''}
              onChange={handleChange('partner_id')}
              error={Boolean(fieldErrors.partner_id)}
              helperText={fieldErrors.partner_id}
              disabled={loading || loadingPartners}
              inputProps={{ style: { fontSize: '0.75rem' } }}
              InputLabelProps={{ style: { fontSize: '0.75rem' } }}
            >
              <MenuItem value="" sx={{ fontSize: '0.75rem' }}>
                <em>None</em>
              </MenuItem>
              {partners.map((p) => (
                <MenuItem key={p.id} value={p.id} sx={{ fontSize: '0.75rem' }}>
                  {p.name} {p.email ? `(${p.email})` : ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Company Dropdown (Multi-company support) */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Company"
              value={formData.company_id || ''}
              onChange={handleCompanyChange}
              error={Boolean(fieldErrors.company_id)}
              helperText={fieldErrors.company_id}
              disabled={loading}
              inputProps={{ style: { fontSize: '0.75rem' } }}
              InputLabelProps={{ style: { fontSize: '0.75rem' } }}
            >
              {companies.map((c) => (
                <MenuItem key={c.id} value={c.id} sx={{ fontSize: '0.75rem' }}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Currency Dropdown (Derived from selected company, overrideable) */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Currency"
              value={formData.currency_id || ''}
              onChange={handleChange('currency_id')}
              error={Boolean(fieldErrors.currency_id)}
              helperText={fieldErrors.currency_id}
              disabled={loading || loadingCurrencies}
              inputProps={{ style: { fontSize: '0.75rem' } }}
              InputLabelProps={{ style: { fontSize: '0.75rem' } }}
            >
              {currencies.map((curr) => (
                <MenuItem key={curr.id} value={curr.id} sx={{ fontSize: '0.75rem' }}>
                  {curr.name} ({curr.symbol || curr.name})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Conditional Status Dropdown based on CRM Type */}
          {(formData.type || recordType) === 'lead' ? (
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                select
                label="Lead Status"
                value={formData.lead_status || ''}
                onChange={handleChange('lead_status')}
                error={Boolean(fieldErrors.lead_status)}
                helperText={fieldErrors.lead_status}
                disabled={loading || stageUpdating}
                inputProps={{ style: { fontSize: '0.75rem' } }}
                InputLabelProps={{ style: { fontSize: '0.75rem' } }}
              >
                <MenuItem value="" sx={{ fontSize: '0.75rem' }}>
                  <em>None</em>
                </MenuItem>
                {stages.map((s) => (
                  <MenuItem key={s.id} value={s.id} sx={{ fontSize: '0.75rem' }}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          ) : (
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                select
                label="Opportunity Status"
                value={formData.opportunity_status || ''}
                onChange={handleChange('opportunity_status')}
                error={Boolean(fieldErrors.opportunity_status)}
                helperText={fieldErrors.opportunity_status}
                disabled={loading || stageUpdating}
                inputProps={{ style: { fontSize: '0.75rem' } }}
                InputLabelProps={{ style: { fontSize: '0.75rem' } }}
              >
                <MenuItem value="" sx={{ fontSize: '0.75rem' }}>
                  <em>None</em>
                </MenuItem>
                {stages.map((s) => (
                  <MenuItem key={s.id} value={s.id} sx={{ fontSize: '0.75rem' }}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {/* Expected Closing Date */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Expected Closing Date"
              value={formData.expected_closing_date || ''}
              onChange={handleChange('expected_closing_date')}
              error={Boolean(fieldErrors.expected_closing_date)}
              helperText={fieldErrors.expected_closing_date}
              disabled={loading}
              InputLabelProps={{ shrink: true, style: { fontSize: '0.75rem' } }}
              inputProps={{ style: { fontSize: '0.75rem' } }}
            />
          </Grid>

          {/* Email */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              type="email"
              label="Email"
              placeholder="client@example.com"
              value={formData.email}
              onChange={handleChange('email')}
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email}
              disabled={loading}
              inputProps={{ style: { fontSize: '0.75rem' } }}
              InputLabelProps={{ style: { fontSize: '0.75rem' } }}
            />
          </Grid>

          {/* Phone */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Phone"
              placeholder="+1234567890"
              value={formData.phone}
              onChange={handleChange('phone')}
              error={Boolean(fieldErrors.phone)}
              helperText={fieldErrors.phone}
              disabled={loading}
              inputProps={{ style: { fontSize: '0.75rem' } }}
              InputLabelProps={{ style: { fontSize: '0.75rem' } }}
            />
          </Grid>

          {/* Reference */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Reference / Source"
              placeholder="e.g. Website, Referral, Cold Call"
              value={formData.reference}
              onChange={handleChange('reference')}
              error={Boolean(fieldErrors.reference)}
              helperText={fieldErrors.reference}
              disabled={loading}
              inputProps={{ style: { fontSize: '0.75rem' } }}
              InputLabelProps={{ style: { fontSize: '0.75rem' } }}
            />
          </Grid>

          {/* Internal Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={3}
              label="Internal Notes"
              placeholder="Add key deal details, client requirements, or follow-up notes..."
              value={formData.notes}
              onChange={handleChange('notes')}
              error={Boolean(fieldErrors.notes)}
              helperText={fieldErrors.notes}
              disabled={loading}
              inputProps={{ style: { fontSize: '0.75rem' } }}
              InputLabelProps={{ style: { fontSize: '0.75rem' } }}
            />
          </Grid>
        </Grid>
        </Box>
      </Card>

      {/* Snackbar feedback for stage change */}
      <Snackbar
        open={Boolean(stageMessage)}
        autoHideDuration={3000}
        onClose={() => setStageMessage(null)}
        message={stageMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
