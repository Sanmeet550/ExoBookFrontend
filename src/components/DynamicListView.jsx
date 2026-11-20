import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Button,
  IconButton,
  Chip,
  Typography,
  Tooltip,
  CircularProgress,
  Alert,
  Checkbox,
  Select,
  MenuItem,
  Divider,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  DeleteOutline as DeleteIcon,
  FileDownloadOutlined as ExportIcon,
  DragIndicator as DragIndicatorIcon,
  NavigateBefore as ChevronLeftIcon,
  NavigateNext as ChevronRightIcon,
  Tune as TuneIcon,
  ContentCopy as ContentCopyIcon,
  ArchiveOutlined as ArchiveIcon,
  RestartAlt as ResetIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import AppBreadcrumbs from './AppBreadcrumbs';
import SearchFacets from './common/SearchFacets';
import useFacetSearch from './common/useFacetSearch';
import { metadataService } from '../services/metadataService';

/**
 * DynamicListView
 *
 * Enterprise compact reusable data grid across all ERP modules:
 * 1. New button positioned at the top-left corner (consistent with Form View).
 * 2. Modern, compact pagination controls at the top-right corner.
 * 3. Bulk Record Actions toolbar (Delete, Archive, Duplicate) with confirmations and notifications.
 * 4. Dynamic Column Configuration popover (Tune icon in header) with field checkboxes,
 *    drag-and-drop column reordering, Reset to Default, and per-user/model localStorage persistence.
 * 5. Full row selection (checkbox per row + master header checkbox) and optional row reordering.
 */
export default function DynamicListView({
  config,
  data = [],
  loading = false,
  error = null,
  onRowClick,
  onCreateClick,
  onDeleteClick,
  onBulkDelete,
  onBulkArchive,
  onBulkDuplicate,
  onRefresh,
  onReorderRows,
  breadcrumbs = [],
  viewSwitchControl = null,
}) {
  if (!config) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No configuration found for this view.
        </Typography>
      </Box>
    );
  }

  const {
    title = 'Records',
    primaryKey = 'id',
    columns: initialConfigColumns = [],
    createButtonText = 'New',
    model,
    modelName,
    service,
  } = config;

  // Model key for localStorage persistence
  const effectiveModelKey = (model || modelName || title || 'default')
    .toLowerCase()
    .replace(/\s+/g, '_');
  const storageKey = `exobook_columns_${effectiveModelKey}`;

  // ---------------------------------------------------------
  // State: Search, Sort, Pagination
  // ---------------------------------------------------------
  // Search, sorting and pagination are remembered per list for the browser session, so going
  // into a record (or refreshing) and coming back restores the list as the user left it.
  const listStateKey = `exobook_list_${effectiveModelKey}`;
  const [savedListState] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(listStateKey)) || {};
    } catch {
      return {};
    }
  });
  const [orderBy, setOrderBy] = useState(
    savedListState.orderBy ??
    (config.draggableRows
      ? config.defaultOrderBy || 'sequence'
      : initialConfigColumns[0]?.field || 'id')
  );
  const [order, setOrder] = useState(savedListState.order ?? 'asc');
  const [page, setPage] = useState(savedListState.page ?? 0);
  const [rowsPerPage, setRowsPerPage] = useState(savedListState.rowsPerPage ?? (config.draggableRows ? 50 : 10));

  useEffect(() => {
    try {
      sessionStorage.setItem(listStateKey, JSON.stringify({ orderBy, order, page, rowsPerPage }));
    } catch {
      // storage unavailable: the list simply starts fresh next time
    }
  }, [listStateKey, orderBy, order, page, rowsPerPage]);

  // ---------------------------------------------------------
  // State: Row Selection & Bulk Actions
  // ---------------------------------------------------------
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: null, // 'delete' | 'archive' | 'duplicate'
    count: 0,
  });
  const [notification, setNotification] = useState(null);

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  // ---------------------------------------------------------
  // State: Row Drag-and-Drop (when draggableRows is true)
  // ---------------------------------------------------------
  const [draggedRowIndex, setDraggedRowIndex] = useState(null);
  const [dragOverRowIndex, setDragOverRowIndex] = useState(null);

  // ---------------------------------------------------------
  // State: Dynamic Column Configuration
  // ---------------------------------------------------------
  const [columnAnchorEl, setColumnAnchorEl] = useState(null);
  const [columnSearchTerm, setColumnSearchTerm] = useState('');
  const [metadataFields, setMetadataFields] = useState([]);
  const [columnPrefs, setColumnPrefs] = useState([]);
  const [draggedColIndex, setDraggedColIndex] = useState(null);
  const [dragOverColIndex, setDragOverColIndex] = useState(null);

  // Fetch model metadata dynamically if available
  useEffect(() => {
    let isMounted = true;
    const targetModel = model || modelName;
    if (targetModel) {
      metadataService
        .getModelMetadata(targetModel)
        .then((meta) => {
          if (isMounted && meta?.fields && Array.isArray(meta.fields)) {
            setMetadataFields(meta.fields);
          }
        })
        .catch(() => { });
    }
    return () => {
      isMounted = false;
    };
  }, [model, modelName]);

  // Initialize and merge column preferences (config columns + metadata + localStorage)
  const initializeColumns = useCallback(
    (defaultCols = [], metaFields = [], sampleData = []) => {
      let savedList = null;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) savedList = JSON.parse(saved);
      } catch {
        savedList = null;
      }

      const fieldMap = new Map();

      // 1. Add configured default columns
      defaultCols.forEach((col) => {
        fieldMap.set(col.field, {
          ...col,
          headerName: col.headerName || col.label || col.field,
          visible: col.visible !== false,
          sortable: col.sortable !== false,
        });
      });

      // 2. Add metadata fields if not already defined
      metaFields.forEach((meta) => {
        const fieldKey = meta.name || meta.field;
        if (!fieldKey || fieldMap.has(fieldKey)) return;
        fieldMap.set(fieldKey, {
          field: fieldKey,
          headerName:
            meta.label ||
            meta.title ||
            fieldKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          type: meta.type || 'text',
          width: 130,
          sortable: true,
          visible: false,
        });
      });

      // 3. Add fields from sample data row
      if (sampleData && sampleData.length > 0) {
        Object.keys(sampleData[0]).forEach((k) => {
          if (k.startsWith('_') || fieldMap.has(k)) return;
          fieldMap.set(k, {
            field: k,
            headerName: k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            type: typeof sampleData[0][k] === 'number' ? 'number' : 'text',
            width: 120,
            sortable: true,
            visible: false,
          });
        });
      }

      const allFields = Array.from(fieldMap.values());

      // 4. Apply saved preferences if they exist
      if (Array.isArray(savedList) && savedList.length > 0) {
        const ordered = [];
        savedList.forEach((s) => {
          const found = fieldMap.get(s.field);
          if (found) {
            ordered.push({ ...found, visible: s.visible !== false });
            fieldMap.delete(s.field);
          }
        });
        // Append any remaining newly-discovered fields (respect default column visibility)
        fieldMap.forEach((remaining) => {
          const isConfigDefault = defaultCols.some((dc) => dc.field === remaining.field);
          const defaultColObj = defaultCols.find((dc) => dc.field === remaining.field);
          const isVis = isConfigDefault ? (defaultColObj?.visible !== false) : false;
          ordered.push({ ...remaining, visible: isVis });
        });
        setColumnPrefs(ordered);
      } else {
        setColumnPrefs(allFields);
      }
    },
    [storageKey]
  );

  // Initialize columns on mount or when dependencies update
  useEffect(() => {
    initializeColumns(initialConfigColumns, metadataFields, data);
  }, [initializeColumns, initialConfigColumns, metadataFields, data]);

  // Active columns currently rendered in the table
  const activeColumns = useMemo(() => {
    return columnPrefs.filter((c) => c.visible !== false);
  }, [columnPrefs]);

  // Filtered available columns in the configuration popover
  const filteredAvailableColumns = useMemo(() => {
    if (!columnSearchTerm.trim()) return columnPrefs;
    const term = columnSearchTerm.toLowerCase();
    return columnPrefs.filter(
      (c) =>
        (c.headerName && c.headerName.toLowerCase().includes(term)) ||
        (c.field && c.field.toLowerCase().includes(term))
    );
  }, [columnPrefs, columnSearchTerm]);

  // Toggle single column visibility
  const handleToggleColumn = (field) => {
    const target = columnPrefs.find((c) => c.field === field);
    if (!target) return;

    const isCurrentlyVisible = target.visible !== false;
    const visibleCount = columnPrefs.filter((c) => c.visible !== false).length;

    if (isCurrentlyVisible && visibleCount <= 1) {
      setNotification({
        type: 'warning',
        message: 'At least one column must remain visible in the List View.',
      });
      return;
    }

    const updated = columnPrefs.map((c) =>
      c.field === field ? { ...c, visible: !isCurrentlyVisible } : c
    );
    setColumnPrefs(updated);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(
          updated.map((c) => ({
            field: c.field,
            visible: c.visible !== false,
          }))
        )
      );
    } catch (err) {
      console.warn('Failed to save column preferences to localStorage:', err);
    }
  };

  // Drag and Drop reordering of columns in the Popover
  const handleColDragStart = (e, index) => {
    setDraggedColIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleColDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColIndex !== index) {
      setDragOverColIndex(index);
    }
  };

  const handleColDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === targetIndex) {
      setDraggedColIndex(null);
      setDragOverColIndex(null);
      return;
    }
    const updated = [...columnPrefs];
    const [moved] = updated.splice(draggedColIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setColumnPrefs(updated);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(
          updated.map((c) => ({
            field: c.field,
            visible: c.visible !== false,
          }))
        )
      );
    } catch (err) {
      console.warn('Failed to save column preferences to localStorage:', err);
    }
    setDraggedColIndex(null);
    setDragOverColIndex(null);
  };

  // Reset columns back to initial config
  const handleResetColumns = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.warn('Failed to remove column preferences from localStorage:', err);
    }
    initializeColumns(initialConfigColumns, metadataFields, data);
    setNotification({
      type: 'info',
      message: 'Columns have been reset to default configuration.',
    });
  };

  // ---------------------------------------------------------
  // Sorting & Filtering
  // ---------------------------------------------------------
  const handleSort = (field) => {
    const isAsc = orderBy === field && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(field);
  };

  // Odoo-style field search (fields from the model registry); a new search starts on page 1.
  const { filteredData, searchProps } = useFacetSearch({ config, data, onFacetsChange: () => setPage(0) });

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let aVal = a[orderBy];
      let bVal = b[orderBy];

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return order === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, orderBy, order]);

  // ---------------------------------------------------------
  // Pagination Calculations
  // ---------------------------------------------------------
  const totalCount = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
  const currentPageClamped = Math.min(page, totalPages - 1);

  const paginatedData = useMemo(() => {
    const start = currentPageClamped * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPageClamped, rowsPerPage]);

  const startRecord = totalCount === 0 ? 0 : currentPageClamped * rowsPerPage + 1;
  const endRecord = Math.min(totalCount, (currentPageClamped + 1) * rowsPerPage);

  // ---------------------------------------------------------
  // Row Selection Handlers
  // ---------------------------------------------------------
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allPageIds = paginatedData.map((row) => row[primaryKey]);
      const union = Array.from(new Set([...selectedIds, ...allPageIds]));
      setSelectedIds(union);
    } else {
      const pageIdSet = new Set(paginatedData.map((row) => row[primaryKey]));
      setSelectedIds(selectedIds.filter((id) => !pageIdSet.has(id)));
    }
  };

  const handleSelectRow = (event, id) => {
    event.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedIds.includes(row[primaryKey]));
  const isSomeSelected =
    paginatedData.some((row) => selectedIds.includes(row[primaryKey])) &&
    !isAllSelected;

  // ---------------------------------------------------------
  // Bulk Actions Handlers (Delete, Archive, Duplicate)
  // ---------------------------------------------------------
  const handleTriggerBulkAction = (type) => {
    if (selectedIds.length === 0) return;
    setConfirmDialog({
      open: true,
      type,
      count: selectedIds.length,
    });
  };

  const handleConfirmBulkAction = async () => {
    const actionType = confirmDialog.type;
    const count = confirmDialog.count;
    setConfirmDialog({ open: false, type: null, count: 0 });
    setBulkLoading(true);

    try {
      const selectedRecords = data.filter((r) => selectedIds.includes(r[primaryKey]));

      if (actionType === 'delete') {
        if (onBulkDelete) {
          await onBulkDelete(selectedIds);
        } else if (service?.delete) {
          await Promise.all(selectedIds.map((id) => service.delete(id)));
        } else if (onDeleteClick) {
          for (const id of selectedIds) {
            await onDeleteClick(id, { skipConfirm: true });
          }
        }
        setSelectedIds([]);
        if (onRefresh) await onRefresh();
        setNotification({
          type: 'success',
          message: `Successfully deleted ${count} selected record${count > 1 ? 's' : ''}.`,
        });
      } else if (actionType === 'archive') {
        if (onBulkArchive) {
          await onBulkArchive(selectedIds, selectedRecords);
        } else if (service?.update) {
          await Promise.all(
            selectedIds.map((id) => service.update(id, { active: false }))
          );
        } else if (service?.patch) {
          await Promise.all(
            selectedIds.map((id) => service.patch(id, { active: false }))
          );
        }
        setSelectedIds([]);
        if (onRefresh) await onRefresh();
        setNotification({
          type: 'success',
          message: `Successfully archived ${count} selected record${count > 1 ? 's' : ''}.`,
        });
      } else if (actionType === 'duplicate') {
        if (onBulkDuplicate) {
          await onBulkDuplicate(selectedIds, selectedRecords);
        } else if (service?.create) {
          await Promise.all(
            selectedRecords.map((record) => {
              const payload = { ...record };
              delete payload[primaryKey];
              delete payload.id;
              delete payload.created_at;
              delete payload.updated_at;
              if (payload.name) {
                payload.name = `${payload.name} (Copy)`;
              }
              return service.create(payload);
            })
          );
        }
        setSelectedIds([]);
        if (onRefresh) await onRefresh();
        setNotification({
          type: 'success',
          message: `Successfully duplicated ${count} record${count > 1 ? 's' : ''}.`,
        });
      }
    } catch (err) {
      console.error(`Bulk ${actionType} error:`, err);
      setNotification({
        type: 'error',
        message: err.message || `Failed to perform bulk ${actionType}.`,
      });
    } finally {
      setBulkLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Row Drag-and-Drop (when draggableRows is enabled)
  // ---------------------------------------------------------
  const handleDragStart = (e, index, row) => {
    setDraggedRowIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));

    // Custom Odoo-style black drag preview badge: [ Not Contacted ]
    try {
      const label = row?.name || row?.title || row?.stage_name || row?.code || 'Record';
      const dragPill = document.createElement('div');
      dragPill.innerText = label;
      dragPill.style.position = 'fixed';
      dragPill.style.top = '-9999px';
      dragPill.style.left = '-9999px';
      dragPill.style.backgroundColor = '#000000';
      dragPill.style.color = '#FFFFFF';
      dragPill.style.padding = '4px 10px';
      dragPill.style.borderRadius = '4px';
      dragPill.style.fontSize = '12px';
      dragPill.style.fontWeight = '600';
      dragPill.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      dragPill.style.boxShadow = '0 2px 10px rgba(0,0,0,0.4)';
      dragPill.style.zIndex = '999999';
      dragPill.style.pointerEvents = 'none';
      document.body.appendChild(dragPill);
      e.dataTransfer.setDragImage(dragPill, 20, 15);
      setTimeout(() => {
        if (document.body.contains(dragPill)) {
          document.body.removeChild(dragPill);
        }
      }, 0);
    } catch {
      // Fallback to standard drag ghost if DOM manipulation fails
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverRowIndex !== index) {
      setDragOverRowIndex(index);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedRowIndex === null || draggedRowIndex === targetIndex) {
      setDraggedRowIndex(null);
      setDragOverRowIndex(null);
      return;
    }
    if (onReorderRows) {
      onReorderRows(draggedRowIndex, targetIndex, paginatedData);
    }
    setDraggedRowIndex(null);
    setDragOverRowIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedRowIndex(null);
    setDragOverRowIndex(null);
  };

  // ---------------------------------------------------------
  // Render Cell Content
  // ---------------------------------------------------------
  const renderCellContent = (row, col) => {
    let value = row[col.field];

    // Handle nested relation objects (e.g. partner.name or partner_name)
    if (value === undefined && row[`${col.field}_name`]) {
      value = row[`${col.field}_name`];
    } else if (value && typeof value === 'object' && value.name) {
      value = value.name;
    }

    if (col.type === 'chip') {
      const color = col.chipColors?.[value] || 'default';
      return (
        <Chip
          label={value || 'N/A'}
          size="small"
          color={color}
          variant="filled"
          sx={{ fontWeight: 600, fontSize: '0.625rem', height: 18 }}
        />
      );
    }

    if (col.type === 'currency') {
      const num = Number(value) || 0;
      const currSymbol = row.currency_symbol || row.currency_name || '$';
      return (
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.6875rem' }}>
          {currSymbol} {num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      );
    }

    if (col.type === 'boolean' || typeof value === 'boolean') {
      return (
        <Chip
          label={value ? 'Yes' : 'No'}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.625rem',
            height: 18,
            bgcolor: value ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.15)',
            color: value ? '#059669' : '#64748B',
          }}
        />
      );
    }

    return (
      <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.6875rem' }}>
        {value !== undefined && value !== null ? String(value) : '—'}
      </Typography>
    );
  };

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {/* =========================================================
          Top Bar:
          - Left: [New] Button + Page Title + Breadcrumbs
          - Center: Search Bar
          - Right: Modern Compact Pagination + ViewSwitcher + Export
         ========================================================= */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
          gap: 1.5,
          flexWrap: { xs: 'wrap', md: 'nowrap' },
        }}
      >
        {/* Left Side: New Button (Consistent with Form View) + Title + Breadcrumbs */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            minWidth: 0,
            flexShrink: 0,
          }}
        >
          {onCreateClick && (
            <Button
              variant="outlined"
              size="small"
              onClick={onCreateClick}
              disabled={loading || bulkLoading}
              sx={{
                minWidth: 50,
                height: 28,
                px: 1.4,
                py: 0,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#262755',
                borderColor: '#CBD5E1',
                bgcolor: '#FFFFFF',
                textTransform: 'none',
                borderRadius: '4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                flexShrink: 0,
                '&:hover': {
                  bgcolor: '#F8FAFC',
                  borderColor: '#94A3B8',
                },
              }}
            >
              {'New'}
              {/* {createButtonText === 'New Record' ? 'New' : createButtonText} */}
            </Button>
          )}

          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: '#0F172A',
                  fontSize: '0.95rem',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </Typography>
              {config.showSettingsIcon && (
                <SettingsIcon sx={{ fontSize: 15, color: '#475569', cursor: 'pointer' }} />
              )}
            </Box>
            <AppBreadcrumbs items={breadcrumbs} />
          </Box>
        </Box>

        {/* Center: Search Input Bar */}
        <Box
          sx={{
            flex: '1 1 auto',
            display: 'flex',
            justifyContent: 'center',
            maxWidth: { xs: '100%', md: 380 },
            mx: { md: 'auto' },
            width: { xs: '100%', md: 'auto' },
          }}
        >
          <SearchFacets {...searchProps} placeholder="Search..." />
        </Box>

        {/* Right Side: Modern Compact Pagination Bar, ViewSwitcher, and Export */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
          {/* Modern Compact Pagination Controls (replaces former New button spot) */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              px: 1,
              height: 28,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            {/* Records per page selector */}
            <Select
              size="small"
              variant="standard"
              disableUnderline
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
                '& .MuiSelect-select': { py: 0.2, pr: '18px !important' },
              }}
            >
              <MenuItem value={10} sx={{ fontSize: '0.6875rem' }}>10 / page</MenuItem>
              <MenuItem value={25} sx={{ fontSize: '0.6875rem' }}>25 / page</MenuItem>
              <MenuItem value={50} sx={{ fontSize: '0.6875rem' }}>50 / page</MenuItem>
              <MenuItem value={100} sx={{ fontSize: '0.6875rem' }}>100 / page</MenuItem>
            </Select>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ height: 16, my: 'auto', borderColor: '#E2E8F0' }}
            />

            {/* Range & Total Records Indicator */}
            <Tooltip
              title={`Page ${currentPageClamped + 1} of ${totalPages} (${totalCount} records)`}
              arrow
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: '#334155',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                {totalCount === 0
                  ? '0-0 / 0'
                  : `${startRecord}-${endRecord} / ${totalCount}`}
              </Typography>
            </Tooltip>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ height: 16, my: 'auto', borderColor: '#E2E8F0' }}
            />

            {/* Prev & Next Navigation Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title={currentPageClamped === 0 ? 'First page' : 'Previous page'}>
                <span>
                  <IconButton
                    size="small"
                    disabled={currentPageClamped === 0 || loading || bulkLoading}
                    onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                    sx={{
                      p: 0.25,
                      color: '#475569',
                      '&:disabled': { color: '#CBD5E1' },
                      '&:hover': { bgcolor: '#F1F5F9' },
                    }}
                  >
                    <ChevronLeftIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip
                title={
                  currentPageClamped >= totalPages - 1 ? 'Last page' : 'Next page'
                }
              >
                <span>
                  <IconButton
                    size="small"
                    disabled={
                      currentPageClamped >= totalPages - 1 ||
                      loading ||
                      bulkLoading
                    }
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages - 1, prev + 1))
                    }
                    sx={{
                      p: 0.25,
                      color: '#475569',
                      '&:disabled': { color: '#CBD5E1' },
                      '&:hover': { bgcolor: '#F1F5F9' },
                    }}
                  >
                    <ChevronRightIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>

          {/* Optional View Switcher control */}
          {viewSwitchControl}

          {/* Export Button */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<ExportIcon sx={{ fontSize: '0.85rem' }} />}
            sx={{
              borderColor: '#E2E8F0',
              color: '#475569',
              height: 28,
              fontSize: '0.6875rem',
              px: 1.2,
              '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' },
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* =========================================================
          Bulk Record Actions Toolbar (Appears when >= 1 row selected)
         ========================================================= */}
      {selectedIds.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: '6px',
            px: 2,
            py: 0.75,
            mb: 1.5,
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            flexWrap: 'wrap',
            gap: 1,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1' }}>
              {selectedIds.length} {selectedIds.length === 1 ? 'record' : 'records'} selected
            </Typography>
            <Button
              size="small"
              onClick={() => setSelectedIds([])}
              sx={{
                fontSize: '0.6875rem',
                textTransform: 'none',
                color: '#0284C7',
                p: 0,
                minWidth: 'auto',
                fontWeight: 600,
                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
              }}
            >
              Clear selection
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Duplicate Button */}
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopyIcon sx={{ fontSize: 13 }} />}
              onClick={() => handleTriggerBulkAction('duplicate')}
              disabled={bulkLoading}
              sx={{
                height: 28,
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'none',
                borderColor: '#CBD5E1',
                bgcolor: '#FFFFFF',
                color: '#334155',
                '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' },
              }}
            >
              Duplicate
            </Button>

            {/* Archive Button */}
            <Button
              size="small"
              variant="outlined"
              startIcon={<ArchiveIcon sx={{ fontSize: 13 }} />}
              onClick={() => handleTriggerBulkAction('archive')}
              disabled={bulkLoading}
              sx={{
                height: 28,
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'none',
                borderColor: '#CBD5E1',
                bgcolor: '#FFFFFF',
                color: '#334155',
                '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' },
              }}
            >
              Archive
            </Button>

            {/* Delete Button */}
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<DeleteIcon sx={{ fontSize: 13 }} />}
              onClick={() => handleTriggerBulkAction('delete')}
              disabled={bulkLoading}
              sx={{
                height: 28,
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: '#DC2626',
                '&:hover': { bgcolor: '#B91C1C' },
              }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      )}

      {/* Notifications / Alerts */}
      {notification && (
        <Alert
          severity={notification.type}
          onClose={() => setNotification(null)}
          sx={{ mb: 1.5, py: 0.25, fontSize: '0.6875rem' }}
        >
          {notification.message}
        </Alert>
      )}

      {/* API Error Notification */}
      {error && (
        <Alert severity="error" sx={{ mb: 1.5, py: 0.25, fontSize: '0.6875rem' }}>
          {error}
        </Alert>
      )}

      {/* =========================================================
          Main Card with Dynamic Table
         ========================================================= */}
      <Card
        sx={{
          bgcolor: 'white',
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
      >
        <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
          <Table size="small" sx={{ width: '100%' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                {/* Multi-record Selection Master Checkbox */}
                <TableCell padding="checkbox" sx={{ width: 34, minWidth: 34, pl: 1, pr: 0 }}>
                  <Checkbox
                    indeterminate={isSomeSelected}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    inputProps={{ 'aria-label': 'select all records' }}
                  />
                </TableCell>

                {/* Reorder drag handle column when draggableRows is enabled */}
                {config.draggableRows && (
                  <TableCell sx={{ width: 28, minWidth: 28, p: 0 }} />
                )}

                {/* Active Dynamic Columns */}
                {activeColumns.map((col) => (
                  <TableCell
                    key={col.field}
                    sx={{
                      width: col.width,
                      minWidth: col.width,
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      color: '#475569',
                      py: 0.85,
                    }}
                  >
                    {col.sortable !== false ? (
                      <TableSortLabel
                        active={orderBy === col.field}
                        direction={orderBy === col.field ? order : 'asc'}
                        onClick={() => handleSort(col.field)}
                      >
                        {col.headerName}
                      </TableSortLabel>
                    ) : (
                      col.headerName
                    )}
                  </TableCell>
                ))}

                {/* Configure Columns (Tune / Sliders Icon Button matching Image 2) */}
                <TableCell
                  align="right"
                  sx={{
                    width: 44,
                    minWidth: 44,
                    p: 0,
                    pr: 1,
                    textAlign: 'right',
                  }}
                >
                  <Tooltip title="Configure Columns" arrow>
                    <IconButton
                      size="small"
                      onClick={(e) => setColumnAnchorEl(e.currentTarget)}
                      sx={{
                        width: 24,
                        height: 24,
                        p: 0.25,
                        borderRadius: '3px',
                        border: '1px solid #1E293B',
                        color: '#1E293B',
                        bgcolor: '#FFFFFF',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        '&:hover': {
                          bgcolor: '#F1F5F9',
                          borderColor: '#0F172A',
                        },
                      }}
                    >
                      <TuneIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading || bulkLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      activeColumns.length + (config.draggableRows ? 3 : 2)
                    }
                    align="center"
                    sx={{ py: 4 }}
                  >
                    <CircularProgress size={24} sx={{ color: '#262755' }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5, fontSize: '0.6875rem' }}
                    >
                      {bulkLoading ? 'Processing records...' : 'Loading data...'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      activeColumns.length + (config.draggableRows ? 3 : 2)
                    }
                    align="center"
                    sx={{ py: 4 }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.6875rem' }}
                    >
                      No records found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => {
                  const rowId = row[primaryKey];
                  const isSelected = selectedIds.includes(rowId);
                  const isDraggingThis = draggedRowIndex === index;
                  const isDragOverThis = dragOverRowIndex === index;

                  return (
                    <TableRow
                      key={rowId}
                      hover
                      selected={isSelected}
                      onClick={() => onRowClick?.(row)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      sx={{
                        cursor: 'pointer',
                        opacity: isDraggingThis ? 0.35 : 1,
                        bgcolor: isDragOverThis ? 'rgba(37, 99, 235, 0.08)' : 'inherit',
                        borderTop: isDragOverThis ? '2px solid #2563EB' : 'none',
                        transition: 'background-color 0.15s ease',
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(38, 39, 85, 0.05)',
                        },
                        '&.Mui-selected:hover': {
                          backgroundColor: 'rgba(38, 39, 85, 0.08)',
                        },
                      }}
                    >
                      {/* Selection Checkbox */}
                      <TableCell
                        padding="checkbox"
                        onClick={(e) => handleSelectRow(e, rowId)}
                        sx={{ pl: 1, pr: 0, width: 34, minWidth: 34 }}
                      >
                        <Checkbox checked={isSelected} />
                      </TableCell>

                      {/* Drag Handle Column */}
                      {config.draggableRows && (
                        <TableCell
                          draggable
                          onDragStart={(e) => handleDragStart(e, index, row)}
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            width: 28,
                            minWidth: 28,
                            p: 0,
                            textAlign: 'center',
                            cursor: 'grab',
                            userSelect: 'none',
                            '&:active': { cursor: 'grabbing' },
                          }}
                        >
                          <DragIndicatorIcon
                            sx={{
                              fontSize: '1.05rem',
                              color: '#94A3B8',
                              verticalAlign: 'middle',
                              '&:hover': { color: '#334155' },
                            }}
                          />
                        </TableCell>
                      )}

                      {/* Dynamic Columns Data */}
                      {activeColumns.map((col) => (
                        <TableCell key={col.field}>
                          {renderCellContent(row, col)}
                        </TableCell>
                      ))}

                      {/* Single Record Row Actions (Delete) */}
                      <TableCell
                        align="right"
                        onClick={(e) => e.stopPropagation()}
                        sx={{ width: 44, minWidth: 44, p: 0, pr: 1, textAlign: 'right' }}
                      >
                        <Tooltip title="Delete record">
                          <IconButton
                            size="small"
                            onClick={() => onDeleteClick?.(rowId)}
                            sx={{
                              color: '#94A3B8',
                              p: 0.25,
                              opacity: 0.6,
                              '&:hover': { color: '#EF4444', opacity: 1, bgcolor: 'rgba(239, 68, 68, 0.08)' },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: '0.875rem' }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* =========================================================
          Popover: Configure Columns / Fields (Odoo-Style Dropdown matching Image 2)
         ========================================================= */}
      <Popover
        open={Boolean(columnAnchorEl)}
        anchorEl={columnAnchorEl}
        onClose={() => setColumnAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 240,
            maxHeight: 440,
            borderRadius: '4px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #CBD5E1',
            py: 0.75,
            px: 0,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Scrollable Columns List matching Image 2 */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: 380,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 3 },
            '&::-webkit-scrollbar-thumb:hover': { bgcolor: '#94A3B8' },
          }}
        >
          {columnPrefs.map((col) => {
            const isVisible = col.visible !== false;

            return (
              <Box
                key={col.field}
                onClick={() => handleToggleColumn(col.field)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 1.5,
                  py: 0.6,
                  cursor: 'pointer',
                  userSelect: 'none',
                  '&:hover': { bgcolor: '#F1F5F9' },
                  transition: 'background-color 0.1s ease',
                }}
              >
                <Checkbox
                  size="small"
                  checked={isVisible}
                  sx={{
                    p: 0,
                    mr: 1.5,
                    color: '#CBD5E1',
                    '&.Mui-checked': {
                      color: '#008784', // Odoo's exact teal green
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: 18,
                      borderRadius: '2px',
                    },
                  }}
                />
                <Typography
                  sx={{
                    fontSize: '0.8125rem',
                    color: isVisible ? '#0F172A' : '#475569',
                    fontWeight: isVisible ? 500 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {col.headerName || col.label || col.field}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Subtle Reset link at bottom */}
        <Divider sx={{ my: 0.5, borderColor: '#F1F5F9' }} />
        <Box sx={{ px: 1.5, py: 0.25, display: 'flex', justifyContent: 'flex-end' }}>
          <Typography
            variant="caption"
            onClick={handleResetColumns}
            sx={{
              fontSize: '0.6875rem',
              color: '#94A3B8',
              cursor: 'pointer',
              fontWeight: 500,
              '&:hover': { color: '#008784', textDecoration: 'underline' },
            }}
          >
            Reset to default
          </Typography>
        </Box>
      </Popover>

      {/* =========================================================
          Bulk Action Confirmation Dialog
         ========================================================= */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: null, count: 0 })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '0.875rem', fontWeight: 700, pb: 1 }}>
          {confirmDialog.type === 'delete'
            ? 'Confirm Bulk Deletion'
            : confirmDialog.type === 'archive'
              ? 'Confirm Bulk Archive'
              : 'Confirm Bulk Duplicate'}
        </DialogTitle>
        <DialogContent sx={{ pb: 1.5 }}>
          <DialogContentText sx={{ fontSize: '0.75rem', color: '#475569' }}>
            {confirmDialog.type === 'delete'
              ? `Are you sure you want to permanently delete the ${confirmDialog.count} selected record(s)? This action cannot be undone.`
              : confirmDialog.type === 'archive'
                ? `Are you sure you want to archive the ${confirmDialog.count} selected record(s)? They will be marked as inactive.`
                : `Create duplicate copies of the ${confirmDialog.count} selected record(s)?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button
            size="small"
            onClick={() => setConfirmDialog({ open: false, type: null, count: 0 })}
            sx={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color={confirmDialog.type === 'delete' ? 'error' : 'primary'}
            onClick={handleConfirmBulkAction}
            sx={{
              fontSize: '0.75rem',
              textTransform: 'none',
              bgcolor:
                confirmDialog.type === 'delete'
                  ? '#DC2626'
                  : '#262755',
            }}
          >
            {confirmDialog.type === 'delete'
              ? 'Delete Records'
              : confirmDialog.type === 'archive'
                ? 'Archive Records'
                : 'Duplicate Records'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
