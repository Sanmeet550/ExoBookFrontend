import React from 'react';
import { Breadcrumbs, Link, Typography, Box } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

const cleanLabel = (text) => {
  if (typeof text !== 'string') return text;
  return text.replace(/^Edit\s*\((.*)\)$/i, '$1').replace(/^Edit\s+/i, '');
};

/**
 * AppBreadcrumbs
 * Compact enterprise breadcrumb trail placed directly under the page title in place of subtitles.
 * 
 * items: Array of { label: string, onClick?: () => void }
 */
export default function AppBreadcrumbs({ items = [] }) {
  if (!items.length) return null;

  return (
    <Box sx={{ mt: 0.25, mb: 0 }}>
      <Breadcrumbs
        separator={<NavigateNextIcon sx={{ fontSize: '0.75rem', color: '#94A3B8' }} />}
        aria-label="breadcrumb"
        sx={{
          fontSize: '0.65rem',
          '& .MuiBreadcrumbs-ol': {
            alignItems: 'center',
          },
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const displayLabel = cleanLabel(item.label);

          if (isLast || !item.onClick) {
            return (
              <Typography
                key={index}
                sx={{
                  color: isLast ? '#262755' : '#64748B',
                  fontWeight: isLast ? 600 : 400,
                  fontSize: '0.65rem',
                }}
              >
                {displayLabel}
              </Typography>
            );
          }

          return (
            <Link
              key={index}
              underline="hover"
              onClick={item.onClick}
              sx={{
                color: '#64748B',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.65rem',
                '&:hover': { color: '#262755' },
              }}
            >
              {displayLabel}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
