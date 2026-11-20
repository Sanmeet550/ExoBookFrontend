import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Avatar,
  Tooltip,
  Tab,
  Tabs,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  MenuOpen as MenuOpenIcon,
  Menu as MenuIcon,
  NotificationsNoneOutlined as NotificationsIcon,
  HelpOutline as HelpIcon,
  SettingsOutlined,
  ExpandMore as ExpandMoreIcon,
  Logout,
} from '@mui/icons-material';
import CompanySwitcher from '../components/CompanySwitcher';

/**
 * Header
 * Compact SaaS/ERP navigation bar with Odoo-style company switcher.
 * When topNavTabs is provided, renders tabs in place of the page title (e.g. CRM: Lead | Opportunity | Settings)
 */
export default function Header({
  pageTitle,
  onToggleSidebar,
  isSidebarOpen,
  // Top nav tabs support (Odoo-style module sub-navigation)
  topNavTabs = null,
  activeTopNavTab = null,
  onTopNavTabChange = null,
  topNavDropdowns = null,
}) {
  const [settingsAnchor, setSettingsAnchor] = React.useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = React.useState(null);
  const { user, logout } = useAuth();
  const userInitials = (user?.name || '?').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const [openDropdownId, setOpenDropdownId] = React.useState(null);

  const handleDropdownClick = (dropdownId, event) => {
    setOpenDropdownId(dropdownId);
    setSettingsAnchor(event.currentTarget);
  };

  const handleDropdownClose = () => {
    setOpenDropdownId(null);
    setSettingsAnchor(null);
  };

  const handleDropdownSelect = (tabId) => {
    if (onTopNavTabChange) onTopNavTabChange(tabId);
    handleDropdownClose();
  };

  const hasTopNav = topNavTabs && topNavTabs.length > 0;

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        variant="dense"
        disableGutters
        sx={{
          minHeight: 42,
          height: 42,
          px: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Sidebar Toggle + Title or Tabs */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Tooltip title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            <IconButton
              size="small"
              onClick={onToggleSidebar}
              sx={{
                color: '#262755',
                bgcolor: 'rgba(38, 39, 85, 0.05)',
                '&:hover': { bgcolor: 'rgba(38, 39, 85, 0.1)' },
                width: 28,
                height: 28,
                flexShrink: 0,
              }}
            >
              {isSidebarOpen ? <MenuOpenIcon sx={{ fontSize: 17 }} /> : <MenuIcon sx={{ fontSize: 17 }} />}
            </IconButton>
          </Tooltip>

          {hasTopNav ? (
            /* Module sub-navigation tabs inline in the header */
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, ml: 0.5 }}>
              <Tabs
                value={topNavTabs.some((t) => t.id === activeTopNavTab) ? activeTopNavTab : false}
                onChange={(_e, val) => onTopNavTabChange && onTopNavTabChange(val)}
                sx={{
                  minHeight: 42,
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#714B67',
                    height: 2.5,
                  },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#64748B',
                    minHeight: 42,
                    px: 2,
                    py: 0,
                    '&.Mui-selected': {
                      color: '#0F172A',
                    },
                    '&:hover': {
                      color: '#0F172A',
                      bgcolor: 'rgba(0,0,0,0.02)',
                    },
                  },
                }}
              >
                {topNavTabs.map((tab) => (
                  <Tab key={tab.id} value={tab.id} label={tab.label} />
                ))}
              </Tabs>

              {/* Dropdown menus (e.g. Settings) */}
              {topNavDropdowns && topNavDropdowns.map((dropdown) => {
                const isActive = dropdown.children.some((c) => c.id === activeTopNavTab);
                return (
                  <React.Fragment key={dropdown.id}>
                    <Box
                      onClick={(e) => handleDropdownClick(dropdown.id, e)}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.4,
                        cursor: 'pointer',
                        px: 1.5,
                        height: 42,
                        borderBottom: isActive ? '2.5px solid #714B67' : '2.5px solid transparent',
                        color: isActive ? '#0F172A' : '#64748B',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        userSelect: 'none',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          color: '#0F172A',
                          bgcolor: 'rgba(0,0,0,0.02)',
                        },
                      }}
                    >
                      {dropdown.icon || <SettingsOutlined sx={{ fontSize: 15 }} />}
                      <Typography component="span" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {dropdown.label}
                      </Typography>
                      <ExpandMoreIcon sx={{ fontSize: 15, ml: -0.2 }} />
                    </Box>

                    <Menu
                      anchorEl={settingsAnchor}
                      open={openDropdownId === dropdown.id && Boolean(settingsAnchor)}
                      onClose={handleDropdownClose}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                      slotProps={{
                        paper: {
                          sx: {
                            mt: 0.5,
                            minWidth: 160,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                            border: '1px solid #E2E8F0',
                            borderRadius: '6px',
                          },
                        },
                      }}
                    >
                      {dropdown.children.map((child) => (
                        <MenuItem
                          key={child.id}
                          onClick={() => handleDropdownSelect(child.id)}
                          selected={activeTopNavTab === child.id}
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: activeTopNavTab === child.id ? 700 : 500,
                            py: 0.8,
                          }}
                        >
                          {child.label}
                        </MenuItem>
                      ))}
                    </Menu>
                  </React.Fragment>
                );
              })}
            </Box>
          ) : (
            /* Default: plain page title */
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#0F172A',
                fontSize: '0.8rem',
                letterSpacing: '-0.01em',
              }}
            >
              {pageTitle || 'Exobook ERP'}
            </Typography>
          )}
        </Box>

        {/* Right: Company Switcher + Actions and User Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <CompanySwitcher />

          <Tooltip title="Documentation">
            <IconButton size="small" sx={{ color: '#64748B', width: 28, height: 28 }}>
              <HelpIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton size="small" sx={{ color: '#64748B', width: 28, height: 28 }}>
              <Badge
                badgeContent={3}
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: '#fdd53d',
                    color: '#262755',
                    fontSize: '0.55rem',
                    height: 14,
                    minWidth: 14,
                    fontWeight: 700,
                  },
                }}
              >
                <NotificationsIcon sx={{ fontSize: 16 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Box
            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              ml: 0.5,
              pl: 1,
              borderLeft: '1px solid #E2E8F0',
              cursor: 'pointer',
            }}
          >
            <Avatar
              alt={user?.name || 'User'}
              sx={{
                width: 24,
                height: 24,
                bgcolor: '#262755',
                color: '#fdd53d',
                fontSize: '0.625rem',
                fontWeight: 700,
              }}
            >
              {userInitials}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.6875rem', lineHeight: 1.1 }}>
                {user?.name}
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '0.58rem' }}>
                {user?.login}
              </Typography>
            </Box>
          </Box>
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={() => setUserMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem
              onClick={() => {
                setUserMenuAnchor(null);
                logout();
              }}
              sx={{ fontSize: '0.75rem', gap: 1 }}
            >
              <Logout sx={{ fontSize: 16 }} /> Sign out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
