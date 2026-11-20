import React, { useCallback, useEffect, useState } from 'react';
import { DynamicListView } from '../common';
import { helpdeskService } from '../../services/resources/helpdeskService';
import { SLA_CHIP_COLORS, SLA_STATUS_LABELS } from './helpdeskConfig';

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '—');

const slaStatusConfig = {
  title: 'SLA Status',
  primaryKey: 'id',
  modelName: 'helpdesk_sla_status',
  registryModel: 'helpdesk_sla_status',
  columns: [
    { field: 'ticket_name', headerName: 'Ticket', width: 110, sortable: true },
    { field: 'ticket_subject', headerName: 'Subject', flex: 1.4, sortable: true },
    { field: 'policy_name', headerName: 'SLA Policy', flex: 1, sortable: true },
    { field: 'response_due', headerName: 'Response Deadline', width: 160, sortable: true },
    { field: 'resolution_due', headerName: 'Resolution Deadline', width: 160, sortable: true },
    { field: 'status_label', headerName: 'Status', width: 110, sortable: true, type: 'chip', chipColors: SLA_CHIP_COLORS },
  ],
};

/**
 * SLA Status (read-only): the state of every SLA policy applied to a ticket.
 * Statuses are calculated by the backend SLA engine and cannot be edited here.
 */
export default function SlaStatusList({ onOpenTicket }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await helpdeskService.slaStatuses();
      setData(
        (Array.isArray(records) ? records : []).map((record) => ({
          ...record,
          response_due: formatDateTime(record.response_deadline),
          resolution_due: formatDateTime(record.resolution_deadline),
          status_label: SLA_STATUS_LABELS[record.status] || record.status,
        }))
      );
    } catch (err) {
      setError(err.message || 'Failed to load SLA statuses.');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <DynamicListView
      config={slaStatusConfig}
      data={data}
      loading={loading}
      error={error}
      onRowClick={(record) => onOpenTicket?.(record.ticket_id)}
      onRefresh={loadData}
      breadcrumbs={[{ label: 'Helpdesk' }, { label: 'Configuration' }, { label: 'SLA Status' }]}
    />
  );
}
