import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  CalendarTodayOutlined as CalendarIcon,
  TagOutlined as TagIcon,
} from '@mui/icons-material';

/**
 * KanbanCard - Reusable enterprise card component for Kanban View
 * 
 * Works identically in both grouped (stages/columns) and ungrouped (card grid) layouts:
 * - Auto-detects primary/secondary/date/currency/extra fields from config.columns if kanbanCard is not specified
 * - Supports drag-and-drop if onDragStart is provided (disabled in ungrouped view)
 * - Renders consistent compact SaaS styling
 */
export default function KanbanCard({
  record,
  config,
  primaryKey = 'id',
  onClick,
  onDragStart,
  onDragEnd,
  isDragging = false,
  isDraggable = true,
}) {
  const cardConfig = config?.kanban?.kanbanCard || config?.kanbanCard || {};
  const columns = config?.columns || [];

  // 1. Resolve title field (fallback to first text column or 'name' or 'id')
  const titleField =
    cardConfig.titleField ||
    (columns.find((c) => c.field === 'name' || c.field === 'title')?.field) ||
    columns[1]?.field ||
    columns[0]?.field ||
    'name';

  // 2. Resolve subtitle field (fallback to second column or code / customer / email)
  const subtitleField =
    cardConfig.subtitleField !== undefined
      ? cardConfig.subtitleField
      : (columns.find((c) => ['customer_name', 'code', 'email', 'country_id', 'department_id'].includes(c.field))?.field) ||
        (columns[2]?.field !== titleField ? columns[2]?.field : null);

  // 3. Resolve monetary field (auto-detect type: 'currency' from config.columns if not explicitly configured)
  const monetaryField =
    cardConfig.monetaryField ||
    columns.find((c) => c.type === 'currency' || c.field?.includes('price') || c.field?.includes('revenue') || c.field?.includes('total') || c.field?.includes('amount'))?.field;

  // 4. Resolve date field (auto-detect date fields)
  const dateField =
    cardConfig.dateField ||
    columns.find((c) => c.field?.includes('date') || c.field?.includes('created_at'))?.field;

  // 5. Extra fields: auto-derive remaining columns (up to 3) if not explicitly set
  const extraFields = React.useMemo(() => {
    if (cardConfig.extraFields && cardConfig.extraFields.length > 0) {
      return cardConfig.extraFields;
    }
    // Auto-derive from columns not used as title, subtitle, monetary, or date
    const usedFields = new Set([primaryKey, titleField, subtitleField, monetaryField, dateField]);
    return columns
      .filter((col) => !usedFields.has(col.field) && col.field !== 'actions')
      .slice(0, 3)
      .map((col) => ({ name: col.field, label: col.headerName || col.field }));
  }, [cardConfig.extraFields, columns, primaryKey, titleField, subtitleField, monetaryField, dateField]);

  const tagsField = cardConfig.tagsField;
  const avatarField = cardConfig.avatarField;

  const id = record[primaryKey];
  const title = record[titleField] !== undefined && record[titleField] !== null && record[titleField] !== ''
    ? String(record[titleField])
    : `Record #${id}`;

  const subtitle = subtitleField && record[subtitleField] !== undefined && record[subtitleField] !== null
    ? String(record[subtitleField])
    : null;

  const monetaryValue = monetaryField ? record[monetaryField] : null;
  const dateValue = dateField ? record[dateField] : null;
  const tags = tagsField && Array.isArray(record[tagsField]) ? record[tagsField] : null;

  // Format monetary value
  const formattedMoney = React.useMemo(() => {
    if (monetaryValue === null || monetaryValue === undefined || monetaryValue === '') return null;
    const num = Number(monetaryValue);
    if (isNaN(num)) return String(monetaryValue);
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [monetaryValue]);

  const canDrag = Boolean(isDraggable && onDragStart);

  return (
    <Box
      draggable={canDrag}
      onDragStart={canDrag ? (e) => onDragStart(e, record) : undefined}
      onDragEnd={canDrag ? (e) => onDragEnd?.(e) : undefined}
      onClick={() => onClick?.(record)}
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: '8px',
        p: 1.5,
        border: '1px solid #E2E8F0',
        boxShadow: isDragging
          ? '0 10px 15px -3px rgba(38, 39, 85, 0.2), 0 4px 6px -2px rgba(38, 39, 85, 0.1)'
          : '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        cursor: canDrag ? 'grab' : 'pointer',
        opacity: isDragging ? 0.45 : 1,
        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        '&:hover': {
          borderColor: '#CBD5E1',
          boxShadow: '0 4px 6px -1px rgba(38, 39, 85, 0.08), 0 2px 4px -1px rgba(38, 39, 85, 0.04)',
          transform: 'translateY(-1px)',
        },
        '&:active': {
          cursor: canDrag ? 'grabbing' : 'pointer',
        },
      }}
    >
      {/* Top Section */}
      <Box>
        {/* Header: Title + Avatar */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              fontSize: '0.8rem',
              color: '#0F172A',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {title}
          </Typography>

          {avatarField && record[avatarField] ? (
            <Avatar
              sx={{
                width: 22,
                height: 22,
                fontSize: '0.625rem',
                bgcolor: '#262755',
                color: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              {String(record[avatarField]).charAt(0).toUpperCase()}
            </Avatar>
          ) : null}
        </Box>

        {/* Subtitle / Reference / Code */}
        {subtitle && subtitle !== '—' && (
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.6875rem',
              color: '#64748B',
              fontWeight: 500,
              mb: 0.8,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subtitle}
          </Typography>
        )}

        {/* Tags if available */}
        {tags && tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.8 }}>
            {tags.map((tag, idx) => (
              <Chip
                key={idx}
                label={tag}
                size="small"
                icon={<TagIcon sx={{ fontSize: '0.75rem !important' }} />}
                sx={{
                  height: 18,
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  bgcolor: '#F1F5F9',
                  color: '#475569',
                }}
              />
            ))}
          </Box>
        )}

        {/* Extra info fields */}
        {extraFields.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35, mb: 0.8 }}>
            {extraFields.map((field) => {
              const val = record[field.name];
              if (val === undefined || val === null || val === '' || val === '—') return null;
              return (
                <Box key={field.name} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                  <Typography component="span" sx={{ color: '#94A3B8', fontSize: 'inherit' }}>
                    {field.label}:
                  </Typography>
                  <Typography component="span" sx={{ color: '#334155', fontWeight: 600, fontSize: 'inherit' }}>
                    {String(val)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Footer: Date on left, Money / Key Metric on right */}
      {(dateValue || formattedMoney) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: 0.75,
            borderTop: '1px solid #F1F5F9',
            mt: 0.5,
          }}
        >
          {dateValue && dateValue !== '—' ? (
            <Tooltip title={`Date: ${dateValue}`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
                <CalendarIcon sx={{ fontSize: '0.8rem', color: '#94A3B8' }} />
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 500 }}>
                  {dateValue}
                </Typography>
              </Box>
            </Tooltip>
          ) : (
            <Box />
          )}

          {formattedMoney && (
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#262755',
                bgcolor: 'rgba(38, 39, 85, 0.06)',
                px: 0.8,
                py: 0.2,
                borderRadius: '4px',
              }}
            >
              {formattedMoney}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
