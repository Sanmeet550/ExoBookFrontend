import React, { useEffect, useState } from 'react';
import MainLayout from './layouts/MainLayout';
import SaleOrder from './components/sales/SaleOrder';
import CRMModule from './components/crm/CRMModule';
import HelpdeskModule from './components/helpdesk/HelpdeskModule';
import Company from './components/master/Company/Company';
import Contacts from './components/master/Contacts/Contacts';
import Currencies from './components/master/Currencies/Currencies';
import Product from './components/master/Product/Product';
import Country from './components/master/Country/Country';
import State from './components/master/State/State';
import Warehouse from './components/master/Warehouse/Warehouse';
import ProductCategory from './components/master/ProductCategory/ProductCategory';
import UOM from './components/master/UOM/UOM';
import Department from './components/master/Department/Department';
import JobPosition from './components/master/JobPosition/JobPosition';
import Employee from './components/master/Employee/Employee';
import Users from './components/master/Users/Users';
import FieldTracking from './components/master/FieldTracking/FieldTracking';
import ModelRegistry from './components/master/ModelRegistry/ModelRegistry';
import { Card, Typography, Button, CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from './theme';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AuthGate from './components/auth/AuthGate';
import { ConstructionOutlined } from '@mui/icons-material';
import { navigate, RouteBaseContext, toPath, useRoute } from './navigation/router';
import { resolveRoute, tabPath } from './navigation/appRoutes';

function ErpApp() {
  // The URL decides which screen is shown, so refresh, deep links and Back/Forward all work.
  const route = useRoute();
  const activeView = resolveRoute(route);
  const basePath = toPath(activeView.base);
  // Helpdesk supplies its own top navigation (it depends on the user's Helpdesk role).
  const [helpdeskNav, setHelpdeskNav] = useState(null);

  // Empty or unknown URL: settle on the resolved screen's URL (without adding a history entry).
  useEffect(() => {
    if (!activeView.matched) navigate(activeView.base, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView.matched, basePath]);

  const renderContent = () => {
    switch (activeView.moduleKey) {
      case 'salesOrders':
        return <SaleOrder key="sale-order-view" />;

      // CRM module — single entry point with top nav for Lead / Opportunity / Settings
      case 'crm':
        return <CRMModule key="crm-module-view" crmActiveTab={activeView.tab} />;

      // Helpdesk module — single entry point with top nav (tabs depend on the user's Helpdesk role)
      case 'helpdesk':
        return (
          <HelpdeskModule
            key="helpdesk-module-view"
            activeTab={activeView.tab}
            onTabChange={(tab) => navigate(tabPath('helpdesk', tab))}
            onRegisterNav={setHelpdeskNav}
          />
        );

      case 'company':
        return <Company key="company-view" />;
      case 'contacts':
        return <Contacts key="contacts-view" />;
      case 'currencies':
        return <Currencies key="currencies-view" />;
      case 'product':
        return <Product key="product-view" />;
      case 'country':
        return <Country key="country-view" />;
      case 'state':
        return <State key="state-view" />;
      case 'warehouse':
        return <Warehouse key="warehouse-view" />;
      case 'productCategory':
        return <ProductCategory key="productCategory-view" />;
      case 'uom':
        return <UOM key="uom-view" />;
      case 'department':
        return <Department key="department-view" />;
      case 'jobPosition':
        return <JobPosition key="jobPosition-view" />;
      case 'employee':
        return <Employee key="employee-view" />;
      case 'users':
        return <Users key="users-view" />;
      case 'fieldTracking':
        return <FieldTracking key="fieldTracking-view" />;
      case 'modelRegistry':
        return <ModelRegistry key="modelRegistry-view" />;

      default:
        return (
          <Card sx={{ p: 4, textAlign: 'center', bgcolor: 'white' }}>
            <ConstructionOutlined sx={{ fontSize: 36, color: '#94A3B8', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#0F172A', mb: 1 }}>
              {activeView.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto', mb: 2 }}>
              Select a module from the sidebar.
            </Typography>
            <Button variant="outlined" onClick={() => navigate([])}>
              Go to the start page
            </Button>
          </Card>
        );
    }
  };

  return (
    <MainLayout activeView={activeView} moduleTopNav={activeView.moduleKey === 'helpdesk' ? helpdeskNav : null}>
      {/* Screens read and write their record id relative to this base path */}
      <RouteBaseContext.Provider value={activeView.base}>{renderContent()}</RouteBaseContext.Provider>
    </MainLayout>
  );
}

/** Theme, notifications and sign-in wrap the whole app; ERP screens load only after sign-in. */
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <AuthProvider>
          <AuthGate>
            <ErpApp />
          </AuthGate>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
