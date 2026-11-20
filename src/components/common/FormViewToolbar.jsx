import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  SaveOutlined as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

/**
 * FormViewToolbar
 *
 * Enterprise Odoo-style Single-Line Form View Header:
 * 
 * Single Horizontal Line Layout:
 *   Left Side:
 *     - [New] Button
 *     - Breadcrumb (immediately to right of New button: Parent / Record Name)
 *     - Save Icon & Discard Icon (unboxed, clean minimal, visible beside breadcrumb when isDirty=true)
 * 
 *   Right Side:
 *     - Page Counter (e.g. 1/80)
 *     - Previous Record Icon (<)
 *     - Next Record Icon (>)
 *     - Optional Extra Right Slot (e.g. Status chevrons)
 */
export default function FormViewToolbar({
  onNew,
  hasPrev = false,
  hasNext = false,
  onPrev,
  onNext,
  currentIndex = -1,
  totalRecords = 0,
  onSave,
  onDiscard,
  isDirty = false,
  saving = false,
  disabled = false,
  recordName = '',
  parentBreadcrumb = null,
  statSlot = null,
  extraRightSlot = null,
}) {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        gap: 1.5,
        py: 0.5,
        mb: 1.5,
        borderBottom: '1px solid #E2E8F0',
      }}
    >
      {/* ================= LEFT SIDE: New Button + Breadcrumb + Save/Discard ================= */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          minWidth: 0,
          flexShrink: 1,
        }}
      >
        {/* New Button */}
        <Button
          variant="outlined"
          size="small"
          onClick={onNew}
          disabled={disabled || saving}
          sx={{
            minWidth: 50,
            height: 28,
            px: 1.2,
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
          New
        </Button>

        {/* Breadcrumb immediately to the right of New button */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {parentBreadcrumb && (
            <Typography
              component="span"
              onClick={parentBreadcrumb.onClick}
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#0D9488', // Odoo teal accent
                cursor: parentBreadcrumb.onClick ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                userSelect: 'none',
                '&:hover': parentBreadcrumb.onClick ? { textDecoration: 'underline' } : {},
              }}
            >
              {parentBreadcrumb.label}
            </Typography>
          )}

          {parentBreadcrumb && (
            <Typography
              component="span"
              sx={{ color: '#94A3B8', fontSize: '0.75rem', flexShrink: 0, userSelect: 'none' }}
            >
              /
            </Typography>
          )}

          <Typography
            component="span"
            title={recordName || 'New'}
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: '#0F172A',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {recordName || 'New'}
          </Typography>
        </Box>

        {/* Save & Discard Buttons: positioned beside the breadcrumbs on the right side */}
        {isDirty && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, ml: 0.5, flexShrink: 0 }}>
            {/* Save Icon */}
            <Tooltip title="Save" arrow>
              <span>
                <IconButton
                  size="small"
                  onClick={onSave}
                  disabled={disabled || saving}
                  sx={{
                    p: 0.5,
                    color: '#262755',
                    borderRadius: '4px',
                    '&:hover': { color: '#1B1C3D', bgcolor: 'rgba(38,39,85,0.08)' },
                    '&.Mui-disabled': { opacity: 0.4 },
                  }}
                >
                  {saving ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SaveIcon sx={{ fontSize: '1.25rem' }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>

            {/* Discard Icon */}
            <Tooltip title="Discard changes" arrow>
              <span>
                <IconButton
                  size="small"
                  onClick={onDiscard}
                  disabled={disabled || saving}
                  sx={{
                    p: 0.5,
                    color: '#DC2626',
                    borderRadius: '4px',
                    '&:hover': { color: '#B91C1C', bgcolor: 'rgba(220,38,38,0.08)' },
                    '&.Mui-disabled': { opacity: 0.4 },
                  }}
                >
                  <CloseIcon sx={{ fontSize: '1.25rem' }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* ================= RIGHT SIDE: Stat Buttons, Page Counter, <, > ================= */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexShrink: 0,
        }}
      >
        {/* Optional Stat / Smart Buttons */}
        {statSlot}

        {/* Page Counter (e.g. 1/80) */}
        {totalRecords > 0 && currentIndex !== -1 && (
          <Typography
            variant="caption"
            sx={{
              color: '#64748B',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              mr: 0.5,
            }}
          >
            {currentIndex + 1}/{totalRecords}
          </Typography>
        )}

        {/* Previous Record Icon (<) - on right side of page counter */}
        <Tooltip title={hasPrev ? 'Previous record' : 'No previous record'} arrow>
          <span>
            <IconButton
              size="small"
              onClick={onPrev}
              disabled={!hasPrev || disabled || saving}
              sx={{
                p: 0.5,
                color: '#475569',
                borderRadius: '4px',
                '&:hover': { color: '#0F172A', bgcolor: 'rgba(0,0,0,0.04)' },
                '&.Mui-disabled': { opacity: 0.3 },
              }}
            >
              <NavigateBeforeIcon sx={{ fontSize: '1.25rem' }} />
            </IconButton>
          </span>
        </Tooltip>

        {/* Next Record Icon (>) - beside previous record */}
        <Tooltip title={hasNext ? 'Next record' : 'No next record'} arrow>
          <span>
            <IconButton
              size="small"
              onClick={onNext}
              disabled={!hasNext || disabled || saving}
              sx={{
                p: 0.5,
                color: '#475569',
                borderRadius: '4px',
                '&:hover': { color: '#0F172A', bgcolor: 'rgba(0,0,0,0.04)' },
                '&.Mui-disabled': { opacity: 0.3 },
              }}
            >
              <NavigateNextIcon sx={{ fontSize: '1.25rem' }} />
            </IconButton>
          </span>
        </Tooltip>

        {/* Optional Extra Slot (e.g. status bar / chevrons) */}
        {extraRightSlot}
      </Box>
    </Box>
  );
}
