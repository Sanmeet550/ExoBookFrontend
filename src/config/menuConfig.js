import React from 'react';
import {
  MonetizationOnOutlined,
  FolderSpecialOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';

/**
 * Global navigation menu configuration.
 *
 * URLs (see navigation/appRoutes.js):
 * - path:      URL segments of a menu entry or submenu, e.g. ['contacts'] -> /contacts
 * - tabPaths:  for modules with top-nav tabs, the URL segment of each tab id, after `path`
 *              (e.g. CRM tab "lead" -> /crm/leads); defaultTab opens when the URL names none.
 * A record id follows the screen's URL: /crm/leads/28, /contacts/12, /helpdesk/tickets/42.
 */
export const menuConfig = [
  {
    id: 'sale-order',
    label: 'Sale Order',
    icon: 'MonetizationOnOutlined',
    hasSubmenu: false,
    viewKey: 'salesOrders',
    path: ['sales', 'orders'],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: 'TrendingUpOutlined',
    hasSubmenu: false,
    viewKey: 'crm',
    path: ['crm'],
    defaultTab: 'lead',
    tabPaths: {
      lead: 'leads',
      opportunity: 'opportunities',
      leadStatus: 'lead-statuses',
      opportunityStatus: 'opportunity-statuses',
      salesTeam: 'sales-teams',
    },
  },
  {
    id: 'helpdesk',
    label: 'Helpdesk',
    icon: 'SupportAgentOutlined',
    hasSubmenu: false,
    viewKey: 'helpdesk',
    path: ['helpdesk'],
    defaultTab: 'dashboard',
    tabPaths: {
      dashboard: 'dashboard',
      myTickets: 'my-tickets',
      allTickets: 'tickets',
      ratings: 'ratings',
      reporting: 'reporting',
      teams: 'teams',
      ticketTypes: 'ticket-types',
      stages: 'stages',
      tags: 'tags',
      priorities: 'priorities',
      slaPolicies: 'sla-policies',
      slaStatus: 'sla-status',
      assignmentRules: 'assignment-rules',
      accessRights: 'access-rights',
    },
  },
  {
    id: 'master',
    label: 'Master',
    icon: 'FolderSpecialOutlined',
    hasSubmenu: true,
    submenus: [
      { id: 'company', label: 'Company', moduleKey: 'company', path: ['companies'] },
      { id: 'contacts', label: 'Contacts', moduleKey: 'contacts', path: ['contacts'] },
      { id: 'currencies', label: 'Currencies', moduleKey: 'currencies', path: ['currencies'] },
      { id: 'product', label: 'Product', moduleKey: 'product', path: ['products'] },
      { id: 'country', label: 'Country', moduleKey: 'country', path: ['countries'] },
      { id: 'state', label: 'State', moduleKey: 'state', path: ['states'] },
      { id: 'warehouse', label: 'Warehouse', moduleKey: 'warehouse', path: ['warehouses'] },
      { id: 'productCategory', label: 'Product Category', moduleKey: 'productCategory', path: ['product-categories'] },
      { id: 'uom', label: 'UOM', moduleKey: 'uom', path: ['uoms'] },
      { id: 'department', label: 'Department', moduleKey: 'department', path: ['departments'] },
      { id: 'jobPosition', label: 'Job Position', moduleKey: 'jobPosition', path: ['job-positions'] },
      { id: 'employee', label: 'Employee', moduleKey: 'employee', path: ['employees'] },
      { id: 'users', label: 'Users', moduleKey: 'users', path: ['users'] },
      { id: 'fieldTracking', label: 'Field Tracking', moduleKey: 'fieldTracking', path: ['field-tracking'] },
      { id: 'models', label: 'Models', moduleKey: 'modelRegistry', path: ['models'] },
    ],
  },
];
