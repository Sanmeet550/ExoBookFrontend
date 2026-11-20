import React from 'react';
import {
  MonetizationOnOutlined,
  FolderSpecialOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';

/**
 * Global navigation menu configuration.
 */
export const menuConfig = [
  {
    id: 'sale-order',
    label: 'Sale Order',
    icon: 'MonetizationOnOutlined',
    hasSubmenu: false,
    viewKey: 'salesOrders',
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: 'TrendingUpOutlined',
    hasSubmenu: false,
    viewKey: 'crm',
  },
  {
    id: 'master',
    label: 'Master',
    icon: 'FolderSpecialOutlined',
    hasSubmenu: true,
    submenus: [
      { id: 'company', label: 'Company', moduleKey: 'company' },
      { id: 'contacts', label: 'Contacts', moduleKey: 'contacts' },
      { id: 'currencies', label: 'Currencies', moduleKey: 'currencies' },
      { id: 'product', label: 'Product', moduleKey: 'product' },
      { id: 'country', label: 'Country', moduleKey: 'country' },
      { id: 'state', label: 'State', moduleKey: 'state' },
      { id: 'warehouse', label: 'Warehouse', moduleKey: 'warehouse' },
      { id: 'productCategory', label: 'Product Category', moduleKey: 'productCategory' },
      { id: 'uom', label: 'UOM', moduleKey: 'uom' },
      { id: 'department', label: 'Department', moduleKey: 'department' },
      { id: 'jobPosition', label: 'Job Position', moduleKey: 'jobPosition' },
      { id: 'employee', label: 'Employee', moduleKey: 'employee' },
      { id: 'users', label: 'Users', moduleKey: 'users' },
    ],
  },
];
