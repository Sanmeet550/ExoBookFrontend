import React, { useState } from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import Header from './Header';
import Sidebar, { SIDEBAR_EXPANDED_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';
import { menuConfig } from '../config/menuConfig';
import { theme } from '../theme';
import { CompanyProvider } from '../context/CompanyContext';

/**
 * CRM top-nav configuration
 * Tabs: Lead, Opportunity
 * Dropdowns: Settings → Lead Status
 */
const CRM_TOP_NAV_TABS = [
  { id: 'lead', label: 'Lead' },
  { id: 'opportunity', label: 'Opportunity' },
];

const CRM_TOP_NAV_DROPDOWNS = [
  {
    id: 'settings',
    label: 'Settings',
    children: [
      { id: 'leadStatus', label: 'Lead Status' },
      { id: 'opportunityStatus', label: 'Opportunity Status' },
      { id: 'salesTeam', label: 'Sales Team' },
    ],
  },
];

export default function MainLayout({ activeView, setActiveView, onNavigateModule, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(activeView?.menuId || 'sale-order');
  const [activeSubmenuId, setActiveSubmenuId] = useState(
    activeView?.menuId === 'master' ? activeView?.moduleKey : null
  );
  const [expandedMenus, setExpandedMenus] = useState({ master: true });

  // CRM sub-navigation state (Lead / Opportunity / Lead Status)
  const [crmActiveTab, setCrmActiveTab] = useState('lead');

  const isCrmActive = activeView?.moduleKey === 'crm';

  const handleToggleMenu = (menuItem) => {
    setActiveMenuId(menuItem.id);

    if (!menuItem.hasSubmenu) {
      setActiveSubmenuId(null);
      if (onNavigateModule) {
        onNavigateModule(menuItem.viewKey, menuItem.label, menuItem.label, menuItem.id);
      }
      // Reset CRM tab to Lead when re-entering CRM
      if (menuItem.id === 'crm') {
        setCrmActiveTab('lead');
      }
    } else {
      if (!isSidebarOpen) {
        setIsSidebarOpen(true);
      }
      setExpandedMenus((prev) => ({
        ...prev,
        [menuItem.id]: !prev[menuItem.id],
      }));
    }
  };

  const handleSelectSubmenu = (parentMenu, submenuItem) => {
    setActiveMenuId(parentMenu.id);
    setActiveSubmenuId(submenuItem.id);
    if (onNavigateModule) {
      onNavigateModule(submenuItem.moduleKey, submenuItem.label, parentMenu.label, parentMenu.id);
    }
  };

  const handleCrmTabChange = (tabId) => {
    setCrmActiveTab(tabId);
  };

  const currentSidebarWidth = isSidebarOpen ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  return (
    <ThemeProvider theme={theme}>
      <CompanyProvider>
        <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', bgcolor: 'background.default', overflowX: 'hidden' }}>
          <CssBaseline />

          <Sidebar
            menuConfig={menuConfig}
            activeMenuId={activeMenuId}
            activeSubmenuId={activeSubmenuId}
            isSidebarOpen={isSidebarOpen}
            expandedMenus={expandedMenus}
            onToggleMenu={handleToggleMenu}
            onSelectSubmenu={handleSelectSubmenu}
          />

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
              minWidth: 0,
              width: `calc(100% - ${currentSidebarWidth}px)`,
              transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Header
              pageTitle={activeView.title}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
              // CRM top-nav: pass tabs and dropdowns when CRM is active
              topNavTabs={isCrmActive ? CRM_TOP_NAV_TABS : null}
              activeTopNavTab={isCrmActive ? crmActiveTab : null}
              onTopNavTabChange={isCrmActive ? handleCrmTabChange : null}
              topNavDropdowns={isCrmActive ? CRM_TOP_NAV_DROPDOWNS : null}
            />

            <Box sx={{ p: 1.5, flexGrow: 1, minWidth: 0 }}>
              {/* Inject crmActiveTab into CRM children */}
              {isCrmActive
                ? React.Children.map(children, (child) =>
                    React.isValidElement(child)
                      ? React.cloneElement(child, { crmActiveTab })
                      : child
                  )
                : children}
            </Box>
          </Box>
        </Box>
      </CompanyProvider>
    </ThemeProvider>
  );
}
