import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  ReceiptLong,
  Inventory2,
  People,
  ArrowForward,
} from '@mui/icons-material';
import { mockDashboardStats } from '../data/mockData';

export default function DashboardPage({ onNavigateModule }) {
  const stats = mockDashboardStats;

  const kpis = [
    {
      title: 'Total Revenue',
      value: stats.totalRevenue,
      growth: stats.revenueGrowth,
      icon: <TrendingUp sx={{ color: '#2563EB' }} />,
      bg: '#EFF6FF',
    },
    {
      title: 'Sales Orders',
      value: stats.totalOrders,
      growth: stats.ordersGrowth,
      icon: <ReceiptLong sx={{ color: '#059669' }} />,
      bg: '#ECFDF5',
    },
    {
      title: 'Inventory SKUs',
      value: stats.inventoryItems,
      growth: stats.lowStockAlerts,
      growthLabel: 'alerts',
      icon: <Inventory2 sx={{ color: '#D97706' }} />,
      bg: '#FFFBEB',
    },
    {
      title: 'Active Clients',
      value: stats.activeClients,
      growth: stats.clientsGrowth,
      icon: <People sx={{ color: '#7C3AED' }} />,
      bg: '#F5F3FF',
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Banner */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>
          Enterprise Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Real-time summary of operations, sales pipeline, inventory status, and finances.
        </Typography>
      </Box>

      {/* KPI Cards Row */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {kpis.map((kpi, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ bgcolor: 'white', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {kpi.title}
                  </Typography>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: kpi.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {kpi.icon}
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
                  {kpi.value}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={kpi.growth}
                    size="small"
                    color={kpi.growth.startsWith('+') ? 'success' : 'warning'}
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {kpi.growthLabel || 'vs last month'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Detailed Widgets Grid */}
      <Grid container spacing={3}>
        {/* Recent Orders Card */}
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: 'white', height: '100%' }}>
            <Box
              sx={{
                p: 2.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Recent Sales Activity
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Latest placed orders across accounts
                </Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowForward fontSize="small" />}
                onClick={() => onNavigateModule?.('salesOrders', 'Sales — Sales Orders')}
                sx={{ textTransform: 'none' }}
              >
                View All
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.recentOrders.map((ord) => (
                    <TableRow key={ord.id} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#2563EB' }}>{ord.id}</TableCell>
                      <TableCell>{ord.customer}</TableCell>
                      <TableCell>{ord.date}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{ord.amount}</TableCell>
                      <TableCell>
                        <Chip
                          label={ord.status}
                          size="small"
                          color={
                            ord.status === 'Completed'
                              ? 'success'
                              : ord.status === 'In Progress'
                              ? 'info'
                              : ord.status === 'Pending'
                              ? 'warning'
                              : 'default'
                          }
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Top Products Card */}
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: 'white', height: '100%' }}>
            <Box
              sx={{
                p: 2.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Top Performing Products
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Fastest moving catalog items
                </Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowForward fontSize="small" />}
                onClick={() => onNavigateModule?.('products', 'Inventory — Products & Items')}
                sx={{ textTransform: 'none' }}
              >
                Catalog
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Units Sold</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.topProducts.map((p, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                      <TableCell align="right">{p.sales}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {p.revenue}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

