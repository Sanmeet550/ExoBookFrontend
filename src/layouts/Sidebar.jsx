import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  MonetizationOnOutlined,
  FolderSpecialOutlined,
  TrendingUpOutlined,
  ExpandLess,
  ExpandMore,
  FiberManualRecord,
  CorporateFare,
} from '@mui/icons-material';

const iconMap = {
  MonetizationOnOutlined: <MonetizationOnOutlined sx={{ fontSize: 18 }} />,
  FolderSpecialOutlined: <FolderSpecialOutlined sx={{ fontSize: 18 }} />,
  TrendingUpOutlined: <TrendingUpOutlined sx={{ fontSize: 18 }} />,
};

export const SIDEBAR_EXPANDED_WIDTH = 220;
export const SIDEBAR_COLLAPSED_WIDTH = 56;

/**
 * Sidebar Component
 * - Collapsible state: Keeps visible with icons only when collapsed
 * - Expanded state: Displays icons with labels and accordion submenus
 * - Smooth transition between states
 * - Brand styling (#262755, #fdd53d)
 */
export default function Sidebar({
  menuConfig,
  activeMenuId,
  activeSubmenuId,
  isSidebarOpen,
  expandedMenus,
  onToggleMenu,
  onSelectSubmenu,
}) {
  const currentWidth = isSidebarOpen ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: currentWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        '& .MuiDrawer-paper': {
          width: currentWidth,
          transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          boxSizing: 'border-box',
          backgroundColor: '#262755', // Brand Navy
          color: '#F8FAFC',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          overflowX: 'hidden',
          zIndex: (theme) => theme.zIndex.drawer + 2,
        },
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          height: 42,
          px: isSidebarOpen ? 1.5 : 0.8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebarOpen ? 'flex-start' : 'center',
          gap: 1.2,
          bgcolor: '#1B1C3D',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <CorporateFare sx={{ color: '#fdd53d', fontSize: 20 }} />
        {isSidebarOpen && (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography
              sx={{
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: '#FFFFFF',
                lineHeight: 1.1,
                fontSize: '0.78rem',
              }}
            >
              EXOBOOK
            </Typography>
            <Typography sx={{ color: 'rgba(253, 213, 61, 0.85)', fontSize: '0.52rem', letterSpacing: '0.08em', fontWeight: 600 }}>
              ENTERPRISE ERP
            </Typography>
          </Box>
        )}
      </Box>

      {/* Menus */}
      <List sx={{ px: 0.8, py: 1 }}>
        {menuConfig.map((item) => {
          const isSelected = activeMenuId === item.id;
          const isExpanded = Boolean(expandedMenus[item.id]) && isSidebarOpen;
          const hasChildren = item.hasSubmenu && item.submenus?.length > 0;

          const buttonContent = (
            <ListItemButton
              onClick={() => onToggleMenu(item)}
              sx={{
                borderRadius: '5px',
                py: 0.6,
                px: isSidebarOpen ? 1 : 0.8,
                minHeight: 32,
                justifyContent: isSidebarOpen ? 'initial' : 'center',
                backgroundColor:
                  isSelected && !hasChildren
                    ? '#fdd53d'
                    : isSelected
                    ? 'rgba(253, 213, 61, 0.12)'
                    : 'transparent',
                color: isSelected && !hasChildren ? '#262755' : isSelected ? '#fdd53d' : '#CBD5E1',
                '&:hover': {
                  backgroundColor:
                    isSelected && !hasChildren
                      ? '#e6be27'
                      : 'rgba(255, 255, 255, 0.08)',
                  color: isSelected && !hasChildren ? '#262755' : '#FFFFFF',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: isSidebarOpen ? 1.2 : 'auto',
                  justifyContent: 'center',
                  color: isSelected && !hasChildren ? '#262755' : isSelected ? '#fdd53d' : '#CBD5E1',
                }}
              >
                {iconMap[item.icon] || <FolderSpecialOutlined sx={{ fontSize: 18 }} />}
              </ListItemIcon>

              {isSidebarOpen && (
                <>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.72rem',
                      fontWeight: isSelected ? 600 : 500,
                    }}
                  />
                  {hasChildren &&
                    (isExpanded ? (
                      <ExpandLess sx={{ fontSize: 15, color: '#94A3B8' }} />
                    ) : (
                      <ExpandMore sx={{ fontSize: 15, color: '#64748B' }} />
                    ))}
                </>
              )}
            </ListItemButton>
          );

          return (
            <React.Fragment key={item.id}>
              <ListItem disablePadding sx={{ mb: 0.3 }}>
                {!isSidebarOpen ? (
                  <Tooltip title={item.label} placement="right">
                    {buttonContent}
                  </Tooltip>
                ) : (
                  buttonContent
                )}
              </ListItem>

              {/* Submenus (Accordion) */}
              {hasChildren && isSidebarOpen && (
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 2, pb: 0.3 }}>
                    {item.submenus.map((sub) => {
                      const isSubSelected = activeSubmenuId === sub.id;

                      return (
                        <ListItem key={sub.id} disablePadding sx={{ mb: 0.2 }}>
                          <ListItemButton
                            onClick={() => onSelectSubmenu(item, sub)}
                            sx={{
                              borderRadius: '4px',
                              py: 0.45,
                              px: 1,
                              minHeight: 26,
                              backgroundColor: isSubSelected ? '#fdd53d' : 'transparent',
                              color: isSubSelected ? '#262755' : '#CBD5E1',
                              '&:hover': {
                                backgroundColor: isSubSelected ? '#e6be27' : 'rgba(255, 255, 255, 0.06)',
                                color: isSubSelected ? '#262755' : '#FFFFFF',
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 16, color: isSubSelected ? '#262755' : '#64748B' }}>
                              <FiberManualRecord sx={{ fontSize: 4 }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={sub.label}
                              primaryTypographyProps={{
                                fontSize: '0.6875rem',
                                fontWeight: isSubSelected ? 600 : 400,
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          );
        })}
      </List>
    </Drawer>
  );
}
