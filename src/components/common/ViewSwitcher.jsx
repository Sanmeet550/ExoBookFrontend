import React from 'react';
import { ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import {
  FormatListBulleted as ListIcon,
  ViewKanbanOutlined as KanbanIcon,
} from '@mui/icons-material';

/**
 * ViewSwitcher - Compact toggle control between List View and Kanban View
 * Designed to fit cleanly in the top action bar alongside Export and New buttons.
 */
export default function ViewSwitcher({ currentView = 'list', onViewChange }) {
  const handleChange = (event, nextView) => {
    if (nextView !== null && nextView !== currentView) {
      onViewChange(nextView);
    }
  };

  return (
    <ToggleButtonGroup
      value={currentView}
      exclusive
      onChange={handleChange}
      size="small"
      sx={{
        height: 28,
        bgcolor: '#FFFFFF',
        borderRadius: '6px',
        border: '1px solid #E2E8F0',
        p: '2px',
        gap: '2px',
        '& .MuiToggleButtonGroup-grouped': {
          border: 'none',
          borderRadius: '4px !important',
          px: 0.9,
          py: 0.3,
          color: '#64748B',
          '&.Mui-selected': {
            bgcolor: '#262755',
            color: '#FFFFFF',
            '&:hover': {
              bgcolor: '#1B1C3D',
            },
          },
          '&:hover': {
            bgcolor: '#F1F5F9',
          },
        },
      }}
    >
      <Tooltip title="List View">
        <ToggleButton value="list" aria-label="list view">
          <ListIcon sx={{ fontSize: '1rem' }} />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Kanban View">
        <ToggleButton value="kanban" aria-label="kanban view">
          <KanbanIcon sx={{ fontSize: '1rem' }} />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
}

