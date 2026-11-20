import React from 'react';
import { Box } from '@mui/material';
import CRM from './CRM';
import LeadStatus from '../master/LeadStatus/LeadStatus';
import SalesTeam from '../master/SalesTeam/SalesTeam';

/**
 * CRMModule
 *
 * Top-level CRM wrapper. The active tab (lead / opportunity / settings sub-items)
 * is managed by MainLayout and passed down as crmActiveTab.
 */
export default function CRMModule({ crmActiveTab = 'lead' }) {
  switch (crmActiveTab) {
    case 'opportunity':
      return <CRM key="crm-opportunity" recordType="opportunity" />;
    case 'leadStatus':
      return <LeadStatus key="crm-lead-status" statusType="lead" parentBreadcrumb="CRM" />;
    case 'opportunityStatus':
      return <LeadStatus key="crm-opportunity-status" statusType="opportunity" parentBreadcrumb="CRM" />;
    case 'salesTeam':
      return <SalesTeam key="crm-sales-team" parentBreadcrumb="CRM" />;
    case 'lead':
    default:
      return <CRM key="crm-lead" recordType="lead" />;
  }
}
