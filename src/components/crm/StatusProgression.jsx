import React from 'react';
import { Box, Typography, Tooltip, CircularProgress } from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  NavigateNext as ChevronIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

/**
 * StatusProgression
 *
 * Modern line statusbar progression component for CRM stages.
 * - Sleek line statusbar layout with connected stages and chevron flow
 * - Bottom progression indicator line displaying pipeline completion %
 * - Active stage: distinct brand highlight pill (#262755) with contrast text & pulsing dot/spinner
 * - Completed stages: elegant slate styling with emerald checkmark
 * - Upcoming stages: clean light slate with subtle hover states
 * - Won stage: distinguished with gold trophy icon
 * - 100% preserves original click, hover, loading, and disabled functionality
 */
export default function StatusProgression({
  stages = [],
  currentStageId = null,
  onStageChange,
  loading = false,
  disabled = false,
}) {
  if (!stages || stages.length === 0) return null;

  // Normalize IDs to numbers for reliable comparison
  const normalizedCurrentId =
    currentStageId !== null && currentStageId !== undefined
      ? Number(currentStageId)
      : null;

  const currentIndex = stages.findIndex(
    (s) => Number(s.id) === normalizedCurrentId
  );

  // Calculate progression percentage for the status line (0 to 100)
  const progressPercent =
    stages.length > 0 && currentIndex >= 0
      ? Math.min(100, Math.round(((currentIndex + 1) / stages.length) * 100))
      : 0;

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        bgcolor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '6px',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Main Statusbar Items Row */}
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          overflowX: 'auto',
          maxWidth: '100%',
          py: '3px',
          px: '4px',
          gap: 0.5,
          '&::-webkit-scrollbar': { height: 3 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 2 },
        }}
      >
        {stages.map((stage, idx) => {
          const isActive = Number(stage.id) === normalizedCurrentId;
          const isCompleted = currentIndex !== -1 && idx < currentIndex;
          const isWon = Boolean(stage.is_won);
          const isUpdating = loading && isActive;
          const isClickable = !isActive && !disabled && !loading;

          // Colors & styling based on state
          let bg = 'transparent';
          let textColor = '#64748B';
          let fontWeight = 500;
          let hoverBg = '#F1F5F9';

          if (isActive) {
            bg = '#262755';
            textColor = '#FFFFFF';
            fontWeight = 700;
            hoverBg = '#262755';
          } else if (isCompleted) {
            textColor = '#334155';
            fontWeight = 600;
            hoverBg = '#F1F5F9';
          }

          return (
            <React.Fragment key={stage.id}>
              {/* Chevron Arrow Divider between stages */}
              {idx > 0 && (
                <ChevronIcon
                  sx={{
                    fontSize: 14,
                    color: isCompleted || isActive ? '#94A3B8' : '#CBD5E1',
                    mx: -0.25,
                    flexShrink: 0,
                    transition: 'color 0.15s ease',
                  }}
                />
              )}

              <Tooltip
                title={`${stage.name}${
                  isActive
                    ? ' (Current)'
                    : isCompleted
                    ? ' (Completed)'
                    : ''
                }`}
                arrow
              >
                <span>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => {
                      if (isClickable && onStageChange) {
                        onStageChange(Number(stage.id));
                      }
                    }}
                    disabled={disabled || loading}
                    sx={{
                      appearance: 'none',
                      fontFamily: 'inherit',
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.6,
                      height: 26,
                      px: 1.25,
                      borderRadius: '4px',
                      border: 'none',
                      bgcolor: bg,
                      color: textColor,
                      cursor: isClickable ? 'pointer' : 'default',
                      userSelect: 'none',
                      boxShadow: isActive
                        ? '0 1px 3px rgba(38, 39, 85, 0.25)'
                        : 'none',
                      transition:
                        'background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, transform 0.1s ease',
                      pointerEvents: disabled || loading ? 'none' : 'auto',
                      '&:hover': {
                        bgcolor: isClickable ? hoverBg : bg,
                        color: isClickable ? '#0F172A' : textColor,
                        transform: isClickable ? 'translateY(-1px)' : 'none',
                      },
                      '&:active': {
                        transform: isClickable ? 'translateY(0)' : 'none',
                      },
                      '&:focus-visible': {
                        outline: '2px solid #262755',
                        outlineOffset: 1,
                      },
                      '&:disabled': {
                        opacity: 1,
                        cursor: 'default',
                      },
                    }}
                  >
                    {/* Status Leading Icon */}
                    {isUpdating ? (
                      <CircularProgress
                        size={11}
                        sx={{ color: '#FFFFFF', flexShrink: 0 }}
                      />
                    ) : isActive ? (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: '#4ADE80',
                          boxShadow: '0 0 5px rgba(74, 222, 128, 0.8)',
                          flexShrink: 0,
                        }}
                      />
                    ) : isCompleted ? (
                      <CheckIcon
                        sx={{
                          fontSize: 12,
                          color: '#10B981',
                          flexShrink: 0,
                          strokeWidth: 1,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          bgcolor: '#CBD5E1',
                          flexShrink: 0,
                        }}
                      />
                    )}

                    {/* Won Trophy */}
                    {isWon && !isUpdating && (
                      <TrophyIcon
                        sx={{
                          fontSize: '0.8125rem',
                          color: isActive
                            ? '#FCD34D'
                            : isCompleted
                            ? '#D97706'
                            : '#94A3B8',
                          flexShrink: 0,
                        }}
                      />
                    )}

                    {/* Stage Name */}
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: fontWeight,
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.01em',
                        lineHeight: 1,
                      }}
                    >
                      {stage.name}
                    </Typography>
                  </Box>
                </span>
              </Tooltip>
            </React.Fragment>
          );
        })}
      </Box>

      {/* Sleek Line Progression Bar at Bottom */}
      <Box
        sx={{
          height: 2.5,
          bgcolor: '#F1F5F9',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${progressPercent}%`,
            bgcolor: '#262755',
            transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundImage:
              'linear-gradient(90deg, #37397b 0%, #262755 70%, #fdd53d 100%)',
          }}
        />
      </Box>
    </Box>
  );
}
