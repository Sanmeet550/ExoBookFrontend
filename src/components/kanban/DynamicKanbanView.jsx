import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  TablePagination,
} from '@mui/material';
import {
} from '@mui/icons-material';
import AppBreadcrumbs from '../AppBreadcrumbs';
import SearchFacets from '../common/SearchFacets';
import useFacetSearch from '../common/useFacetSearch';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';

/**
 * DynamicKanbanView - Universal, Reusable enterprise Kanban View for ExoBook ERP
 * 
 * Supports two operating modes automatically:
 * 1. GROUPED MODE (Stages / Status / Grouping field available):
 *    - Records are partitioned into distinct stage columns
 *    - Supports fluid drag-and-drop between columns with optimistic update
 *    - Dynamic column sums and counters
 * 
 * 2. UNGROUPED MODE (No stages / no grouping field configured):
 *    - Automatically detected when grouping is not configured or no valid group field exists
 *    - Displays records directly in an elegant, responsive Kanban card grid (Odoo style)
 *    - Supports pagination, search, sorting, and clicking records to open FormView
 *    - No artificial stages or backend modifications required
 */
export default function DynamicKanbanView({
  config,
  data = [],
  loading = false,
  error = null,
  onCardClick,
  onCreateClick,
  onRecordMove,
  breadcrumbs = [],
  viewSwitchControl = null,
}) {
  const kanbanConfig = config?.kanban || {};
  const primaryKey = config?.primaryKey || 'id';
  const title = config?.title || 'Kanban';
  const createButtonText = config?.createButtonText || 'New Record';

  // Grouping configuration detection
  const groupingOptions = kanbanConfig.groupingOptions || [];
  const defaultGrouping = kanbanConfig.defaultGroupField || groupingOptions[0]?.field || null;

  // Has valid grouping? (true if explicit columns or groupingOptions/defaultGroupField is defined)
  const isGrouped = Boolean(
    (defaultGrouping && defaultGrouping !== 'none') ||
    (kanbanConfig.columns && kanbanConfig.columns.length > 0) ||
    groupingOptions.length > 0
  );

  const [activeGroupField, setActiveGroupField] = useState(defaultGrouping || '');


  // Pagination for ungrouped grid mode
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // Dragging state for grouped mode
  const [draggedCard, setDraggedCard] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [movingId, setMovingId] = useState(null);

  // Active grouping details
  const activeGroup = useMemo(() => {
    if (!isGrouped) return null;
    return groupingOptions.find((g) => g.field === activeGroupField) || {
      field: activeGroupField,
      label: 'Stage',
      columns: kanbanConfig.columns || [],
    };
  }, [isGrouped, groupingOptions, activeGroupField, kanbanConfig.columns]);

  // Determine distinct columns when in grouped mode
  const columns = useMemo(() => {
    if (!isGrouped || !activeGroup) return [];

    if (activeGroup.columns && activeGroup.columns.length > 0) {
      return activeGroup.columns;
    }

    // Auto-discover distinct values from data if not explicitly declared
    const distinctVals = Array.from(
      new Set(data.map((item) => item[activeGroupField]).filter((val) => val !== undefined && val !== null))
    );

    if (distinctVals.length === 0) {
      return [
        { value: 'default', label: 'All Records', color: '#262755' },
      ];
    }

    return distinctVals.map((val) => ({
      value: val,
      label: String(val).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      color: '#262755',
    }));
  }, [isGrouped, activeGroup, data, activeGroupField]);

  // Odoo-style field search, shared with the List view of the same screen.
  const { filteredData, searchProps } = useFacetSearch({ config: config || {}, data, onFacetsChange: () => setPage(0) });

  // Group filtered records by column (for grouped mode)
  const groupedRecords = useMemo(() => {
    if (!isGrouped) return {};

    const map = {};
    columns.forEach((col) => {
      map[col.value] = [];
    });

    const definedVals = new Set(columns.map((c) => String(c.value)));
    const unassignedKey = columns[0]?.value || 'unassigned';

    filteredData.forEach((record) => {
      const groupVal = record[activeGroupField];
      const strVal = groupVal !== undefined && groupVal !== null ? String(groupVal) : '';

      if (definedVals.has(strVal)) {
        map[groupVal].push(record);
      } else {
        const matchedCol = columns.find((c) => String(c.value).toLowerCase() === strVal.toLowerCase());
        if (matchedCol) {
          map[matchedCol.value].push(record);
        } else if (map[unassignedKey]) {
          map[unassignedKey].push(record);
        }
      }
    });

    return map;
  }, [isGrouped, columns, filteredData, activeGroupField]);

  // Paginated records for ungrouped card grid mode
  const paginatedGridData = useMemo(() => {
    if (isGrouped) return filteredData;
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [isGrouped, filteredData, page, rowsPerPage]);

  // Drag-and-drop handlers (grouped mode only)
  const handleDragStart = (e, record) => {
    if (!isGrouped) return;
    setDraggedCard(record);
    setActionError(null);
    e.dataTransfer.setData('text/plain', String(record[primaryKey]));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
  };

  const handleDropCard = async (targetColumnValue) => {
    if (!draggedCard || !isGrouped) return;

    const sourceColumnValue = draggedCard[activeGroupField];
    if (sourceColumnValue === targetColumnValue) {
      setDraggedCard(null);
      return;
    }

    const cardToMove = draggedCard;
    setDraggedCard(null);
    setMovingId(cardToMove[primaryKey]);
    setActionError(null);

    try {
      if (onRecordMove) {
        await onRecordMove(cardToMove, targetColumnValue, activeGroupField);
      }
    } catch (err) {
      console.error('Failed to move Kanban card:', err);
      setActionError(err.message || 'Failed to update record stage. Changes reverted.');
    } finally {
      setMovingId(null);
    }
  };

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {/* Top Bar: New + Title & Breadcrumbs on Left, Central Search, Controls on Right */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
          gap: 2,
          flexWrap: { xs: 'wrap', md: 'nowrap' },
        }}
      >
        {/* Left: New button + Page Title + Breadcrumbs (same position and style as the List View) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 160, flexShrink: 0 }}>
          {onCreateClick && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => onCreateClick()}
              disabled={loading}
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
                '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' },
              }}
            >
              {createButtonText === 'New Record' ? 'New' : createButtonText}
            </Button>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              {title}
            </Typography>
            <AppBreadcrumbs items={breadcrumbs} />
          </Box>
        </Box>

        {/* Center: Search Input Bar */}
        <Box
          sx={{
            flex: '1 1 auto',
            display: 'flex',
            justifyContent: 'center',
            maxWidth: { xs: '100%', md: 400 },
            mx: { md: 'auto' },
            width: { xs: '100%', md: 'auto' },
          }}
        >
          <SearchFacets {...searchProps} placeholder="Search..." />
        </Box>

        {/* Right: Actions, Group By Selector, and View Switcher */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
          {/* Group By selector if multiple grouping options configured */}
          {groupingOptions.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={activeGroupField}
                onChange={(e) => setActiveGroupField(e.target.value)}
                sx={{
                  height: 28,
                  fontSize: '0.6875rem',
                  bgcolor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  color: '#475569',
                }}
              >
                {groupingOptions.map((opt) => (
                  <MenuItem key={opt.field} value={opt.field} sx={{ fontSize: '0.72rem' }}>
                    Group: {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* View Switch Buttons (List / Kanban) */}
          {viewSwitchControl}
        </Box>
      </Box>

      {/* API / Move Error Notification */}
      {(error || actionError) && (
        <Alert severity="error" sx={{ mb: 1.5, py: 0.25, fontSize: '0.6875rem' }}>
          {error || actionError}
        </Alert>
      )}

      {/* Main Content Area */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress size={32} sx={{ color: '#262755' }} />
        </Box>
      ) : isGrouped ? (
        /* 1. GROUPED MODE: Horizontal Stage Columns with Drag & Drop */
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
            pt: 0.5,
            width: '100%',
            minHeight: 'calc(100vh - 200px)',
            alignItems: 'flex-start',
            '&::-webkit-scrollbar': { height: 8 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 4 },
            '&::-webkit-scrollbar-track': { bgcolor: '#F1F5F9' },
          }}
        >
          {columns.map((col) => (
            <KanbanColumn
              key={String(col.value)}
              column={col}
              records={groupedRecords[col.value] || []}
              config={config}
              primaryKey={primaryKey}
              onCardClick={onCardClick}
              onAddClick={onCreateClick ? (stageVal) => onCreateClick({ [activeGroupField]: stageVal }) : null}
              onDropCard={handleDropCard}
              onCardDragStart={onRecordMove ? handleDragStart : undefined}
              onCardDragEnd={handleDragEnd}
              draggedCard={draggedCard}
            />
          ))}
        </Box>
      ) : (
        /* 2. UNGROUPED MODE: Universal Responsive Card Grid */
        <Box sx={{ width: '100%' }}>
          {paginatedGridData.length > 0 ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 1.5,
                pb: 2,
                pt: 0.5,
              }}
            >
              {paginatedGridData.map((rec) => (
                <KanbanCard
                  key={rec[primaryKey]}
                  record={rec}
                  config={config}
                  primaryKey={primaryKey}
                  onClick={onCardClick}
                  isDraggable={false}
                />
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                py: 8,
                textAlign: 'center',
                bgcolor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px dashed #CBD5E1',
              }}
            >
              <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                No records found.
              </Typography>
            </Box>
          )}

          {/* Grid Pagination */}
          {filteredData.length > rowsPerPage && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                bgcolor: '#FFFFFF',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                mt: 1,
              }}
            >
              <TablePagination
                component="div"
                count={filteredData.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[12, 24, 48]}
                sx={{
                  '& .MuiTablePagination-toolbar': { minHeight: 36, height: 36, fontSize: '0.6875rem' },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontSize: '0.6875rem',
                    color: '#475569',
                  },
                }}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
