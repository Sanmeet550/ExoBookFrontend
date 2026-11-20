import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Checkbox,
  Divider,
  Radio,
  Tooltip,
} from '@mui/material';
import {
  CorporateFare,
  KeyboardArrowDown,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useCompany } from '../context/CompanyContext';

/**
 * CompanySwitcher
 * 
 * Odoo-style multi-company switcher widget in the top navigation bar:
 * - Displays active company name and building icon
 * - Dropdown listing all available companies from Company Master
 * - Highlights current active company
 * - Radio-style primary company selection or checkbox multi-selection
 * - Instant update without page reload
 */
export default function CompanySwitcher() {
  const {
    companies,
    activeCompany,
    activeCompanyId,
    selectedCompanyIds,
    switchCompany,
    toggleCompanySelection,
  } = useCompany();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectPrimary = (companyId, e) => {
    e.stopPropagation();
    switchCompany(companyId);
  };

  const handleToggle = (companyId, e) => {
    e.stopPropagation();
    toggleCompanySelection(companyId);
  };

  const displayName = activeCompany?.name || 'Select Company';

  return (
    <>
      <Tooltip title="Switch Company">
        <Button
          size="small"
          onClick={handleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1,
            py: 0.35,
            height: 28,
            borderRadius: '5px',
            bgcolor: 'rgba(38, 39, 85, 0.05)',
            border: '1px solid #E2E8F0',
            color: '#262755',
            textTransform: 'none',
            '&:hover': {
              bgcolor: 'rgba(38, 39, 85, 0.1)',
              borderColor: '#CBD5E1',
            },
          }}
        >
          <CorporateFare sx={{ fontSize: 16, color: '#262755' }} />
          <Typography
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              maxWidth: { xs: 100, sm: 160, md: 220 },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: '#0F172A',
            }}
          >
            {displayName}
          </Typography>
          <KeyboardArrowDown sx={{ fontSize: 15, color: '#64748B' }} />
        </Button>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 0.5,
            minWidth: 220,
            maxWidth: 320,
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            p: 0,
          },
        }}
      >
        <Box sx={{ px: 1.5, py: 1, bgcolor: '#F8FAFC' }}>
          <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Companies
          </Typography>
        </Box>
        <Divider sx={{ m: 0 }} />

        {companies.length === 0 ? (
          <Box sx={{ px: 2, py: 1.5, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
              No companies found
            </Typography>
          </Box>
        ) : (
          companies.map((company) => {
            const isActive = company.id === activeCompanyId;
            const isChecked = selectedCompanyIds.includes(company.id);

            return (
              <MenuItem
                key={company.id}
                onClick={(e) => handleSelectPrimary(company.id, e)}
                sx={{
                  py: 0.6,
                  px: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                  bgcolor: isActive ? 'rgba(38, 39, 85, 0.06)' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(38, 39, 85, 0.1)' : 'rgba(0, 0, 0, 0.03)',
                  },
                }}
              >
                {/* Left: Radio for primary switch + Name */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                  <Radio
                    checked={isActive}
                    size="small"
                    onClick={(e) => handleSelectPrimary(company.id, e)}
                    sx={{
                      p: 0.25,
                      color: '#94A3B8',
                      '&.Mui-checked': { color: '#262755' },
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: '0.6875rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#262755' : '#0F172A',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {company.name}
                  </Typography>
                </Box>

                {/* Right: Multi-company branch toggle checkbox (Odoo style) */}
                <Tooltip title={isChecked ? 'Active branch (included)' : 'Enable branch access'}>
                  <Checkbox
                    checked={isChecked}
                    size="small"
                    onChange={(e) => handleToggle(company.id, e)}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      p: 0.25,
                      color: '#94A3B8',
                      '&.Mui-checked': { color: '#262755' },
                    }}
                  />
                </Tooltip>
              </MenuItem>
            );
          })
        )}
      </Menu>
    </>
  );
}

