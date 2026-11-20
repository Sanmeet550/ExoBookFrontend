import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  Grid,
  Button,
  Typography,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import FormField from './common/FormField';
import FormViewToolbar from './common/FormViewToolbar';
import Chatter from './common/Chatter';
import { toChatterModel } from '../services/chatterService';
import useUnsavedWarning from '../navigation/useUnsavedWarning';
import { metadataService } from '../services/metadataService';
import { useCompany } from '../context/CompanyContext';

/**
 * DynamicFormView
 * 
 * Reusable compact full-page FormView component for ERP records:
 * - Odoo-Style Single-Line Form View Header:
 *     Left side: [New] Button + Breadcrumb (immediately to right of New)
 *     Right side: Page Counter (1/80) -> Previous (<) -> Next (>) -> Save (dirty only) -> Discard (dirty only)
 * - Record Navigation (< >) between existing records without returning to List View
 * - Form dirty-state tracking: Save & Discard buttons appear only when modifications are made
 * - Compact typography and high-density spacing
 * - Automatically defaults company_id to activeCompanyId for new records
 */
export default function DynamicFormView({
  config,
  initialData = null,
  records = [],
  onNavigateRecord,
  onNew,
  loading = false,
  error = null,
  fieldErrors = {},
  onSave,
  onBack,
  breadcrumbs = [],
  statusBarSlot = null,
}) {
  const {
    title,
    formFields: initialFormFields = [],
    primaryKey = 'id',
    model = null,
  } = config;

  const isEditMode = Boolean(initialData && initialData[primaryKey]);
  const { activeCompanyId } = useCompany();

  // Dynamic fields array
  const [formFields, setFormFields] = useState(initialFormFields);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Form data state and dirty tracking
  const [formData, setFormData] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const initialValuesRef = useRef({});
  useUnsavedWarning(isDirty);

  // Chatter: reload the timeline each time a save finishes (field changes are logged on save).
  const [savedCount, setSavedCount] = useState(0);
  const wasSaving = useRef(false);
  useEffect(() => {
    if (wasSaving.current && !loading) setSavedCount((count) => count + 1);
    wasSaving.current = loading;
  }, [loading]);

  // Record Navigation Indices
  const currentIndex = isEditMode && records.length > 0
    ? records.findIndex((r) => r[primaryKey] === initialData[primaryKey])
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < records.length - 1;

  useEffect(() => {
    let isMounted = true;
    if (model) {
      setLoadingMetadata(true);
      metadataService
        .getModelMetadata(model)
        .then((meta) => {
          if (isMounted && meta?.fields?.length > 0) {
            setFormFields(meta.fields);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoadingMetadata(false);
        });
    } else {
      setFormFields(initialFormFields);
    }
    return () => {
      isMounted = false;
    };
  }, [model, initialFormFields]);

  useEffect(() => {
    const vals = {};
    formFields.forEach((field) => {
      if (initialData && initialData[field.name] !== undefined && initialData[field.name] !== null) {
        vals[field.name] = initialData[field.name];
      } else if (field.name === 'company_id' && !isEditMode && activeCompanyId) {
        vals[field.name] = activeCompanyId;
      } else if (field.default !== undefined) {
        vals[field.name] = field.default;
      } else if (field.defaultValue !== undefined) {
        vals[field.name] = field.defaultValue;
      } else if (field.type === 'boolean') {
        vals[field.name] = false;
      } else {
        vals[field.name] = '';
      }
    });

    if (isEditMode) {
      vals[primaryKey] = initialData[primaryKey];
    }
    setFormData(vals);
    initialValuesRef.current = { ...vals };
    setIsDirty(false);
  }, [initialData, formFields, isEditMode, activeCompanyId, primaryKey]);

  const handleChange = (name, value) => {
    const newFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(newFormData);

    // Check if form has unsaved modifications compared to initial values
    const dirty = Object.keys(newFormData).some((key) => {
      const initialVal = initialValuesRef.current[key] ?? '';
      const currentVal = newFormData[key] ?? '';
      return String(initialVal).trim() !== String(currentVal).trim();
    });
    setIsDirty(dirty);
  };

  const getGridSpan = (cols) => {
    if (cols === 1) return { xs: 12 };
    if (cols === 2) return { xs: 12, sm: 6 };
    if (cols === 3) return { xs: 12, sm: 6, md: 4 };
    return { xs: 12, md: 6 };
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    // The form only becomes "clean" when the save succeeds: the parent then passes the saved
    // record as initialData, which resets the form below. A failed save stays dirty, so the
    // user can correct it and save again.
    onSave?.(formData);
  };

  const handleDiscard = () => {
    setFormData({ ...initialValuesRef.current });
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

  // Compute record display name without any 'Edit' prefix
  const recordName = isEditMode
    ? formData.name || formData.display_name || formData.title || formData.code || `${title?.slice(0, -1) || 'Record'} #${formData[primaryKey]}`
    : `New ${title?.slice(0, -1) || 'Record'}`;

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {/* Odoo-Style Single-Line Form View Header:
          Left: [New] Button + Breadcrumb (immediately to right)
          Right: Page Counter -> [<] -> [>] -> [Save] (dirty only) -> [Discard] (dirty only)
      */}
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
        recordName={recordName}
        parentBreadcrumb={{ label: title || 'Records', onClick: onBack }}
        extraRightSlot={statusBarSlot}
      />

      {/* General Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 1.5, py: 0.25, fontSize: '0.6875rem' }}>
          {error}
        </Alert>
      )}

      {/* Form Container */}
      <Card
        component="form"
        onSubmit={handleSubmit}
        sx={{ bgcolor: 'white', p: 2, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        {loadingMetadata ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ color: '#262755' }} />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1.5, fontSize: '0.6875rem' }}>
              Loading model form metadata...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {formFields.map((field) => {
              const span = getGridSpan(field.cols || field.colSpan || 2);
              const hasError = Boolean(fieldErrors[field.name]);
              const helperText = fieldErrors[field.name] || field.helperText;

              return (
                <Grid item {...span} key={field.name}>
                  <FormField
                    field={field}
                    value={formData[field.name]}
                    formData={formData}
                    onChange={handleChange}
                    error={hasError}
                    helperText={helperText}
                    disabled={loading}
                  />
                </Grid>
              );
            })}
          </Grid>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Bottom Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="text"
            color="inherit"
            onClick={isDirty ? handleDiscard : onBack}
            disabled={loading}
            sx={{ fontSize: '0.6875rem', height: 28, color: '#64748B' }}
          >
            {isDirty ? 'Discard' : 'Cancel'}
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={loading || !isDirty}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{
              backgroundColor: '#262755',
              color: '#FFFFFF',
              height: 28,
              fontSize: '0.6875rem',
              '&:hover': { backgroundColor: '#1B1C3D' },
              '&.Mui-disabled': { bgcolor: '#94A3B8', color: '#FFFFFF' },
            }}
          >
            {loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Record'}
          </Button>
        </Box>
      </Card>

      {/* Communication timeline and field-change history (existing records only) */}
      {isEditMode && (
        <Chatter
          model={config.chatterModel || toChatterModel(model)}
          recordId={initialData[primaryKey]}
          refreshKey={savedCount}
        />
      )}
    </Box>
  );
}
