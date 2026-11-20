import React from 'react';
import { Box, Card, Tooltip, Typography } from '@mui/material';

const DEFAULT_COLOR = '#262755';
const cardSx = { p: 2, bgcolor: 'white', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', height: '100%' };

const formatValue = (value, suffix) => `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;

function EmptyChart() {
  return <Typography sx={{ fontSize: '0.6875rem', color: '#94A3B8', py: 3, textAlign: 'center' }}>No data for this period.</Typography>;
}

export function ChartCard({ title, children }) {
  return (
    <Card sx={cardSx}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#0F172A', mb: 1.5 }}>{title}</Typography>
      {children}
    </Card>
  );
}

/** Horizontal bars for categories (stage, priority, team, agent ...). */
export function HorizontalBarChart({ points = [], suffix = '' }) {
  const max = Math.max(...points.map((point) => point.value), 0);
  if (max === 0) return <EmptyChart />;
  return (
    <Box>
      {points.map((point) => (
        <Box key={point.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
          <Typography noWrap sx={{ width: 120, flexShrink: 0, fontSize: '0.6875rem', color: '#475569' }} title={point.label}>{point.label}</Typography>
          <Box sx={{ flexGrow: 1, height: 12, bgcolor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
            <Box sx={{ width: `${(point.value / max) * 100}%`, height: '100%', bgcolor: point.color || DEFAULT_COLOR, borderRadius: '3px' }} />
          </Box>
          <Typography sx={{ width: 48, flexShrink: 0, textAlign: 'right', fontSize: '0.6875rem', fontWeight: 700, color: '#0F172A' }}>
            {formatValue(point.value, suffix)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

/** Vertical columns for a time series (one column per day). */
export function ColumnChart({ points = [], color = DEFAULT_COLOR }) {
  const max = Math.max(...points.map((point) => point.value), 0);
  if (max === 0) return <EmptyChart />;
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 120 }}>
        {points.map((point) => (
          <Tooltip key={point.label} title={`${point.label}: ${formatValue(point.value, '')}`} arrow>
            <Box sx={{ flex: 1, minWidth: 3, height: `${Math.max((point.value / max) * 100, 2)}%`, bgcolor: color, borderRadius: '2px 2px 0 0' }} />
          </Tooltip>
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography sx={{ fontSize: '0.625rem', color: '#94A3B8' }}>{points[0].label}</Typography>
        <Typography sx={{ fontSize: '0.625rem', color: '#94A3B8' }}>{points[points.length - 1].label}</Typography>
      </Box>
    </Box>
  );
}
