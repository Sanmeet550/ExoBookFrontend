import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CircularProgress, Grid, MenuItem, TextField, Typography } from '@mui/material';
import AppBreadcrumbs from '../AppBreadcrumbs';
import { helpdeskService, helpdeskTeamService } from '../../services/resources/helpdeskService';
import { ChartCard, ColumnChart, HorizontalBarChart } from './HelpdeskCharts';

const inputSx = { sx: { fontSize: '0.6875rem' } };

const KPI_DEFINITIONS = [
  { key: 'total', label: 'Total Tickets', color: '#262755' },
  { key: 'open', label: 'Open Tickets', color: '#2563EB' },
  { key: 'mine', label: 'My Tickets', color: '#7C3AED' },
  { key: 'unassigned', label: 'Unassigned Tickets', color: '#D97706' },
  { key: 'overdue', label: 'Overdue Tickets', color: '#DC2626' },
  { key: 'resolved', label: 'Resolved Tickets', color: '#059669' },
  { key: 'sla_breached', label: 'SLA Breached', color: '#DC2626' },
  { key: 'sla_achievement_rate', label: 'SLA Achievement Rate', color: '#059669', suffix: '%' },
];

const displayKpi = (value, suffix = '') => (value === null || value === undefined ? '—' : `${value}${suffix}`);

function KpiCard({ label, value, color }) {
  return (
    <Card sx={{ p: 1.5, bgcolor: 'white', border: '1px solid #E2E8F0', borderLeft: `3px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: '#64748B' }}>{label}</Typography>
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>{value}</Typography>
    </Card>
  );
}

/**
 * HelpdeskDashboard
 *
 * variant="dashboard": KPIs and the current distribution of tickets.
 * variant="reporting": trends over time, resolution time and SLA performance.
 * All figures come from GET /helpdesk/dashboard for the active company and date range.
 */
export default function HelpdeskDashboard({ variant = 'dashboard' }) {
  const isReporting = variant === 'reporting';
  const [filters, setFilters] = useState({ date_from: '', date_to: '', team_id: '' });
  const [teams, setTeams] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await helpdeskService.dashboard(filters));
    } catch (err) {
      setError(err.message || 'Failed to load Helpdesk figures.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    helpdeskTeamService.getAll({ active_only: true }).then(setTeams).catch(() => setTeams([]));
  }, []);

  const setFilter = (name) => (event) => setFilters((current) => ({ ...current, [name]: event.target.value }));
  const kpis = data?.kpis;

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
        <AppBreadcrumbs items={[{ label: 'Helpdesk' }, { label: isReporting ? 'Reporting' : 'Dashboard' }]} />
        <Box sx={{ flexGrow: 1 }} />
        <TextField size="small" type="date" label="From" value={filters.date_from} onChange={setFilter('date_from')} InputLabelProps={{ shrink: true, ...inputSx }} InputProps={inputSx} />
        <TextField size="small" type="date" label="To" value={filters.date_to} onChange={setFilter('date_to')} InputLabelProps={{ shrink: true, ...inputSx }} InputProps={inputSx} />
        <TextField select size="small" label="Team" value={filters.team_id} onChange={setFilter('team_id')} sx={{ minWidth: 140 }} InputLabelProps={inputSx} InputProps={inputSx}>
          <MenuItem value="" sx={{ fontSize: '0.6875rem' }}><em>All teams</em></MenuItem>
          {teams.map((team) => (
            <MenuItem key={team.id} value={team.id} sx={{ fontSize: '0.6875rem' }}>{team.name}</MenuItem>
          ))}
        </TextField>
        <Button size="small" variant="outlined" onClick={loadData} disabled={loading} sx={{ height: 28, fontSize: '0.6875rem' }}>
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 1.5, py: 0.25, fontSize: '0.6875rem' }}>{error}</Alert>}
      {loading && !data && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={24} sx={{ color: '#262755' }} />
        </Box>
      )}

      {data && (
        <>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            {KPI_DEFINITIONS.map((kpi) => (
              <Grid item xs={6} sm={4} md={3} key={kpi.key}>
                <KpiCard label={kpi.label} value={displayKpi(kpis[kpi.key], kpi.suffix)} color={kpi.color} />
              </Grid>
            ))}
          </Grid>

          {isReporting ? (
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}><ChartCard title="Tickets Created Over Time"><ColumnChart points={data.created_over_time} /></ChartCard></Grid>
              <Grid item xs={12} md={6}><ChartCard title="Tickets Resolved Over Time"><ColumnChart points={data.resolved_over_time} color="#10B981" /></ChartCard></Grid>
              <Grid item xs={12} md={6}>
                <ChartCard title={`Average Resolution Time by Team (overall: ${displayKpi(kpis.avg_resolution_hours, ' h')})`}>
                  <HorizontalBarChart points={data.avg_resolution_by_team} suffix=" h" />
                </ChartCard>
              </Grid>
              <Grid item xs={12} md={6}><ChartCard title="SLA Performance"><HorizontalBarChart points={data.sla_performance} /></ChartCard></Grid>
              <Grid item xs={12} md={6}><ChartCard title="Tickets by Agent"><HorizontalBarChart points={data.by_agent} /></ChartCard></Grid>
              <Grid item xs={12} md={6}>
                <ChartCard title={`Tickets by Team (average rating: ${displayKpi(kpis.avg_rating, ' / 5')})`}>
                  <HorizontalBarChart points={data.by_team} />
                </ChartCard>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}><ChartCard title="Tickets by Stage"><HorizontalBarChart points={data.by_stage} /></ChartCard></Grid>
              <Grid item xs={12} md={6}><ChartCard title="Tickets by Priority"><HorizontalBarChart points={data.by_priority} /></ChartCard></Grid>
              <Grid item xs={12} md={6}><ChartCard title="Tickets by Team"><HorizontalBarChart points={data.by_team} /></ChartCard></Grid>
              <Grid item xs={12} md={6}><ChartCard title="Tickets by Agent"><HorizontalBarChart points={data.by_agent} /></ChartCard></Grid>
            </Grid>
          )}
        </>
      )}
    </Box>
  );
}
