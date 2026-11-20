import React, { useState } from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import Sidebar, { SIDEBAR_EXPANDED_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';
import { menuConfig } from '../config/menuConfig';
import { CompanyProvider } from '../context/CompanyContext';
import { navigate } from '../navigation/router';
import { menuPath } from '../navigation/appRoutes';

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

export default function MainLayout({ activeView, moduleTopNav = null, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState({ master: true });

  // The active menu, submenu and top-nav tab all come from the URL (see navigation/appRoutes.js).
  const activeMenu = menuConfig.find((item) => item.id === activeView.menuId);
  const activeMenuId = activeView.menuId;
  const activeSubmenuId = activeView.subId;
  const activeTab = activeView.tab;
  const changeTab = (tabId) => navigate(menuPath(activeMenu, tabId));

  // CRM's tabs are static; other modules (Helpdesk) hand in their own, e.g. role-dependent, tabs.
  const topNav = activeView.moduleKey === 'crm'
    ? { tabs: CRM_TOP_NAV_TABS, dropdowns: CRM_TOP_NAV_DROPDOWNS }
    : moduleTopNav;

  const handleToggleMenu = (menuItem) => {
    if (!menuItem.hasSubmenu) {
      // Re-entering a module with tabs opens its default tab.
      navigate(menuPath(menuItem));
      return;
    }
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
    }
    setExpandedMenus((prev) => ({ ...prev, [menuItem.id]: !prev[menuItem.id] }));
  };

  const handleSelectSubmenu = (parentMenu, submenuItem) => {
    navigate(menuPath(parentMenu, submenuItem.id));
  };

  const currentSidebarWidth = isSidebarOpen ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  return (
    <CompanyProvider>
        <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', bgcolor: 'background.default', overflowX: 'hidden' }}>

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
              topNavTabs={topNav ? topNav.tabs : null}
              activeTopNavTab={topNav ? activeTab : null}
              onTopNavTabChange={topNav ? changeTab : null}
              topNavDropdowns={topNav ? topNav.dropdowns : null}
            />

            <Box sx={{ p: 1.5, flexGrow: 1, minWidth: 0 }}>
              {children}
            </Box>
          </Box>
        </Box>
    </CompanyProvider>
  );
}
