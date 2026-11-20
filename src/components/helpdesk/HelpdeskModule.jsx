import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import HelpdeskDashboard from './HelpdeskDashboard';
import HelpdeskMaster from './HelpdeskMaster';
import SlaStatusList from './SlaStatusList';
import Tickets from './Tickets';
import { buildHelpdeskNav, HELPDESK_MASTERS, ROLE_OPTIONS } from './helpdeskConfig';
import { helpdeskService } from '../../services/resources/helpdeskService';
import { relationCacheService } from '../../services/relationCacheService';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { navigate } from '../../navigation/router';
import { tabPath } from '../../navigation/appRoutes';

/**
 * HelpdeskModule
 *
 * Top-level Helpdesk wrapper. Requires a signed-in user with a Helpdesk role in the active
 * company, registers the role-dependent top navigation with MainLayout and renders the
 * screen for the active tab.
 */
export default function HelpdeskModule({ activeTab = 'dashboard', onTabChange, onRegisterNav }) {
  const { user } = useAuth();
  const { activeCompanyId } = useCompany();
  const [me, setMe] = useState(null);
  const [accessError, setAccessError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Resolve the Helpdesk role whenever the user or the active company changes.
  useEffect(() => {
    let isMounted = true;
    setMe(null);
    setAccessError(null);
    onRegisterNav?.(null);
    if (!user || !activeCompanyId) return undefined;
    // Helpdesk dropdowns are company-specific; never reuse another company's cached options.
    relationCacheService.clear();
    setLoading(true);
    helpdeskService
      .me()
      .then((access) => {
        if (!isMounted) return;
        setMe(access);
        onRegisterNav?.(buildHelpdeskNav(access));
      })
      .catch((err) => isMounted && setAccessError(err.message || 'Unable to open Helpdesk.'))
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
    // onRegisterNav is a stable state setter from MainLayout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeCompanyId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={24} sx={{ color: '#262755' }} />
      </Box>
    );
  }

  const sessionBar = me ? (
    <Typography sx={{ fontSize: '0.6875rem', color: '#64748B', textAlign: 'right', mb: 1 }}>
      Helpdesk role: <strong>{ROLE_OPTIONS.find((option) => option.value === me.role)?.label}</strong>
    </Typography>
  ) : null;

  if (accessError || !me) {
    return (
      <Box>
        {sessionBar}
        <Alert severity="warning" sx={{ fontSize: '0.75rem' }}>
          {accessError || 'Select a company to open Helpdesk.'}
        </Alert>
      </Box>
    );
  }

  // Tickets are addressable by URL, so other screens open one simply by navigating to it.
  const openTicket = (ticketId) => navigate([...tabPath('helpdesk', 'allTickets'), String(ticketId)]);

  const renderTab = () => {
    // Remount on company change so no screen keeps another company's records.
    const key = `${activeTab}-${activeCompanyId}`;
    if (HELPDESK_MASTERS[activeTab]) {
      return <HelpdeskMaster key={key} definition={HELPDESK_MASTERS[activeTab]} />;
    }
    switch (activeTab) {
      case 'myTickets':
        return <Tickets key={key} mode="mine" me={me} />;
      case 'allTickets':
        return <Tickets key={key} mode="all" me={me} />;
      case 'ratings':
        return <Tickets key={key} mode="ratings" me={me} />;
      case 'reporting':
        return <HelpdeskDashboard key={key} variant="reporting" />;
      case 'slaStatus':
        return <SlaStatusList key={key} onOpenTicket={openTicket} />;
      case 'dashboard':
      default:
        return <HelpdeskDashboard key={key} variant="dashboard" />;
    }
  };

  return (
    <Box>
      {sessionBar}
      {renderTab()}
    </Box>
  );
}
