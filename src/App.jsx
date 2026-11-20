import React, { useState } from 'react';
import MainLayout from './layouts/MainLayout';
import SaleOrder from './components/sales/SaleOrder';
import CRMModule from './components/crm/CRMModule';
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
import { Card, Typography, Button } from '@mui/material';
import { ConstructionOutlined } from '@mui/icons-material';

export default function App() {
  const [activeView, setActiveView] = useState({
    menuId: 'sale-order',
    moduleKey: 'salesOrders',
    title: 'Sale Order',
  });

  const handleNavigate = (moduleKey, title, menuId) => {
    setActiveView({ menuId, moduleKey, title });
  };

  const renderContent = () => {
    switch (activeView.moduleKey) {
      case 'salesOrders':
        return <SaleOrder key="sale-order-view" />;

      // CRM module — single entry point with top nav for Lead / Opportunity / Settings
      case 'crm':
        return <CRMModule key="crm-module-view" />;

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

      default:
        return (
          <Card sx={{ p: 4, textAlign: 'center', bgcolor: 'white' }}>
            <ConstructionOutlined sx={{ fontSize: 36, color: '#94A3B8', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#0F172A', mb: 1 }}>
              {activeView.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto', mb: 2 }}>
              Select Sale Order or any Master submenu item from the sidebar.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => handleNavigate('salesOrders', 'Sale Order', 'sale-order')}
            >
              Go to Sale Order
            </Button>
          </Card>
        );
    }
  };

  return (
    <MainLayout
      activeView={activeView}
      setActiveView={setActiveView}
      onNavigateModule={(moduleKey, title, menuLabel, menuId) => handleNavigate(moduleKey, title, menuId)}
    >
      {renderContent()}
    </MainLayout>
  );
}
