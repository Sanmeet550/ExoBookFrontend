import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import KanbanCard from './KanbanCard';

/**
 * KanbanColumn - Reusable column component representing a group/stage
 * 
 * Responsibilities:
 * - Displays column header with title, color indicator, record count, and total sum (if monetary field configured)
 * - Droppable container receiving dragged cards
 * - Renders KanbanCard components
 * - Clean empty state when no cards match the group
 */
export default function KanbanColumn({
  column,
  records = [],
  config,
  primaryKey = 'id',
  onCardClick,
  onAddClick,
  onDropCard,
  draggedCard,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const cardConfig = config?.kanbanCard || {};
  const monetaryField = cardConfig.monetaryField;

  // Calculate total sum of monetary field in this column
  const columnTotal = React.useMemo(() => {
    if (!monetaryField) return null;
    const sum = records.reduce((acc, r) => acc + (Number(r[monetaryField]) || 0), 0);
    return sum;
  }, [records, monetaryField]);

  const formattedTotal = React.useMemo(() => {
    if (columnTotal === null) return null;
    return `$${columnTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }, [columnTotal]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only deactivate if leaving the column boundary
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    onDropCard?.(column.value);
  };

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        width: 300,
        minWidth: 280,
        maxWidth: 340,
        bgcolor: isDragOver ? 'rgba(38, 39, 85, 0.04)' : '#F8FAFC',
        borderRadius: '10px',
        border: '1px solid',
        borderColor: isDragOver ? '#262755' : '#E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 190px)',
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
        flexShrink: 0,
      }}
    >
      {/* Column Header */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          borderTopLeftRadius: '9px',
          borderTopRightRadius: '9px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          {/* Status Color Dot or Bar */}
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: column.color || '#262755',
              flexShrink: 0,
            }}
          />

          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              fontSize: '0.78rem',
              color: '#0F172A',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {column.label}
          </Typography>

          <Chip
            label={records.length}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.625rem',
              fontWeight: 700,
              bgcolor: '#F1F5F9',
              color: '#475569',
              px: 0.2,
            }}
          />
        </Box>

        {/* Right Header Side: Column Sum + Quick Add */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          {formattedTotal !== null && (
            <Typography
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#64748B',
                mr: 0.5,
              }}
            >
              {formattedTotal}
            </Typography>
          )}

          {onAddClick && (
            <Tooltip title={`Add ${config.createButtonText || 'Record'} to ${column.label}`}>
              <IconButton
                size="small"
                onClick={() => onAddClick(column.value)}
                sx={{
                  width: 22,
                  height: 22,
                  color: '#64748B',
                  '&:hover': { bgcolor: '#F1F5F9', color: '#262755' },
                }}
              >
                <AddIcon sx={{ fontSize: '0.95rem' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Cards Scrollable Container */}
      <Box
        sx={{
          p: 1.25,
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          '&::-webkit-scrollbar': { width: 5 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 4 },
        }}
      >
        {records.length > 0 ? (
          records.map((rec) => (
            <KanbanCard
              key={rec[primaryKey]}
              record={rec}
              config={config}
              primaryKey={primaryKey}
              onClick={onCardClick}
              isDragging={draggedCard && draggedCard[primaryKey] === rec[primaryKey]}
            />
          ))
        ) : (
          <Box
            sx={{
              py: 4,
              px: 2,
              textAlign: 'center',
              border: '1px dashed #CBD5E1',
              borderRadius: '6px',
              bgcolor: 'rgba(255, 255, 255, 0.6)',
              mt: 1,
            }}
          >
            <Typography variant="body2" sx={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
              No records in this stage
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

