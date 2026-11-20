import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import AppBreadcrumbs from '../AppBreadcrumbs';
import FormViewToolbar from '../common/FormViewToolbar';
import Chatter from '../common/Chatter';
import useUnsavedWarning from '../../navigation/useUnsavedWarning';
import { contactService } from '../../services/resources/contactService';
import { currencyService } from '../../services/resources/currencyService';
import { companyService } from '../../services/resources/companyService';
import { productService } from '../../services/resources/productService';
import apiClient from '../../services/apiClient';
import { useCompany } from '../../context/CompanyContext';

/**
 * SaleOrderFormView
 * 
 * Enhanced Full-Page FormView for Sale Orders integrated with FastAPI backend schemas:
 * - SaleOrderCreate: { partner_id, currency_id, warehouse_id, company_id, name, validity_date, client_order_ref, order_lines }
 * - SaleOrderLineCreate: { product_id, description, quantity, price_unit }
 * - Multi-Company: Automatically preselects globally active company on new orders, while strictly preserving existing order company.
 */
export default function SaleOrderFormView({
  initialData = null,
  records = [],
  onNavigateRecord,
  onNew,
  onSave,
  onBack,
  breadcrumbs = [],
}) {
  const isEditMode = Boolean(initialData && initialData.id);
  const { activeCompanyId } = useCompany();

  // Record Navigation Indices
  const currentIndex = isEditMode && records.length > 0
    ? records.findIndex((r) => r.id === initialData.id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < records.length - 1;

  // Tab State: 0: Order Lines, 1: Other Info, 2: Customer Notes
  const [currentTab, setCurrentTab] = useState(0);

  // Lookup options loaded from FastAPI
  const [partners, setPartners] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  useUnsavedWarning(isDirty);
  const initialHeaderRef = useRef({});
  const initialLinesRef = useRef([]);

  // Header form fields matching FastAPI SaleOrderCreate schema:
  // On create (not edit), defaults company_id to the globally active company from context
  const [orderHeader, setOrderHeader] = useState({
    id: initialData?.id || '',
    name: initialData?.name || '',
    partner_id: initialData?.partner_id || '',
    currency_id: initialData?.currency_id || '',
    warehouse_id: initialData?.warehouse_id || '',
    company_id: initialData?.company_id || (!isEditMode && activeCompanyId ? activeCompanyId : ''),
    validity_date: initialData?.validity_date || '',
    client_order_ref: initialData?.client_order_ref || '',
    termsAndConditions: 'Payment due within 30 days of invoice date.',
  });

  // Order Lines matching FastAPI SaleOrderLineCreate schema
  const [orderLines, setOrderLines] = useState(() => {
    if (initialData?.order_lines && Array.isArray(initialData.order_lines)) {
      return initialData.order_lines.map((line) => ({
        id: line.id || `line-${Math.random()}`,
        product_id: line.product_id || '',
        description: line.description || '',
        quantity: line.quantity ?? 1,
        price_unit: line.price_unit ?? 0,
      }));
    }
    return [];
  });

  // Track initial snapshot for dirty check and discard
  useEffect(() => {
    const headerSnap = {
      id: initialData?.id || '',
      name: initialData?.name || '',
      partner_id: initialData?.partner_id || '',
      currency_id: initialData?.currency_id || '',
      warehouse_id: initialData?.warehouse_id || '',
      company_id: initialData?.company_id || (!isEditMode && activeCompanyId ? activeCompanyId : ''),
      validity_date: initialData?.validity_date || '',
      client_order_ref: initialData?.client_order_ref || '',
      termsAndConditions: 'Payment due within 30 days of invoice date.',
    };
    const linesSnap = initialData?.order_lines && Array.isArray(initialData.order_lines)
      ? initialData.order_lines.map((line) => ({
          id: line.id || `line-${Math.random()}`,
          product_id: line.product_id || '',
          description: line.description || '',
          quantity: line.quantity ?? 1,
          price_unit: line.price_unit ?? 0,
        }))
      : [];

    setOrderHeader(headerSnap);
    setOrderLines(linesSnap);
    initialHeaderRef.current = { ...headerSnap };
    initialLinesRef.current = JSON.parse(JSON.stringify(linesSnap));
    setIsDirty(false);
  }, [initialData, isEditMode, activeCompanyId]);

  // Load lookup options from FastAPI
  useEffect(() => {
    contactService.getAll().then((data) => setPartners(Array.isArray(data) ? data : [])).catch(() => {});
    currencyService.getAll().then((data) => setCurrencies(Array.isArray(data) ? data : [])).catch(() => {});
    companyService.getAll().then((data) => setCompanies(Array.isArray(data) ? data : [])).catch(() => {});
    productService.getAll().then((data) => setProducts(Array.isArray(data) ? data : [])).catch(() => {});

    // Try fetching warehouses if available
    apiClient.get('/warehouse/view/all')
      .then((data) => setWarehouses(Array.isArray(data) ? data : []))
      .catch(() => {
        // Fallback default warehouse options if endpoint not populated
        setWarehouses([{ id: 1, name: 'Main Warehouse' }]);
      });
  }, []);

  const handleHeaderChange = (field, value) => {
    setOrderHeader((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleLineChange = (index, field, value) => {
    setIsDirty(true);
    setOrderLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-populate price and description when product is selected
      if (field === 'product_id') {
        const prod = products.find((p) => p.id === Number(value));
        if (prod) {
          if (!updated[index].description) {
            updated[index].description = prod.name;
          }
          if (prod.sales_price) {
            updated[index].price_unit = prod.sales_price;
          }
        }
      }

      return updated;
    });
  };

  const handleAddLine = () => {
    setIsDirty(true);
    const newLine = {
      id: `line-${Date.now()}`,
      product_id: products[0]?.id || '',
      description: products[0]?.name || 'Product item',
      quantity: 1,
      price_unit: products[0]?.sales_price || 0,
    };
    setOrderLines((prev) => [...prev, newLine]);
  };

  const handleDeleteLine = (index) => {
    setIsDirty(true);
    setOrderLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDiscard = () => {
    setOrderHeader({ ...initialHeaderRef.current });
    setOrderLines(JSON.parse(JSON.stringify(initialLinesRef.current)));
    setIsDirty(false);
  };

  const untaxedAmount = orderLines.reduce((acc, line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.price_unit) || 0;
    return acc + qty * price;
  }, 0);

  const totalTaxes = (untaxedAmount * 15) / 100;
  const grandTotal = untaxedAmount + totalTaxes;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormError(null);

    if (!orderHeader.partner_id) {
      setFormError('Please select a Customer / Partner.');
      return;
    }
    if (!orderHeader.currency_id) {
      setFormError('Please select a Currency.');
      return;
    }
    if (!orderHeader.company_id) {
      setFormError('Please select a Company.');
      return;
    }

    // Build FastAPI payload matching SaleOrderCreate / SaleOrderUpdate schema.
    //
    // Backend schema: SaleOrderLineCreate.id is Optional[int].
    //   - Existing lines (integer id) → backend UPDATES the child record.
    //   - New lines (no id / temp string id) → backend CREATES a new child record.
    const order_lines = orderLines.map((line) => {
      const linePay = {
        product_id: Number(line.product_id),
        description: line.description || '',
        quantity: Number(line.quantity) || 0,
        price_unit: Number(line.price_unit) || 0,
      };
      // Include id only for already-persisted lines (integer id from backend)
      if (typeof line.id === 'number') {
        linePay.id = line.id;
      }
      return linePay;
    });

    const payload = {
      partner_id: Number(orderHeader.partner_id),
      currency_id: Number(orderHeader.currency_id),
      warehouse_id: orderHeader.warehouse_id ? Number(orderHeader.warehouse_id) : 1,
      company_id: Number(orderHeader.company_id),
      validity_date: orderHeader.validity_date || undefined,
      client_order_ref: orderHeader.client_order_ref || undefined,
      order_lines,
    };

    if (orderHeader.name) {
      payload.name = orderHeader.name;
    }

    setSaving(true);
    try {
      await onSave?.(payload);
      initialHeaderRef.current = { ...orderHeader };
      initialLinesRef.current = JSON.parse(JSON.stringify(orderLines));
      setIsDirty(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save sales order.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrev = () => {
    if (hasPrev && onNavigateRecord) {
      onNavigateRecord(records[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigateRecord) {
      onNavigateRecord(records[currentIndex + 1]);
    }
  };

  const handleNew = () => {
    if (onNew) {
      onNew();
    }
  };

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {/* Odoo-Style Single-Line Form View Header:
          Left: [New] [Breadcrumb]
          Right: Page Counter -> [<] -> [>] -> [Save (dirty only)] -> [Discard (dirty only)]
      */}
      <FormViewToolbar
        onNew={handleNew}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={handlePrev}
        onNext={handleNext}
        currentIndex={currentIndex}
        totalRecords={records.length}
        onSave={handleSubmit}
        onDiscard={handleDiscard}
        isDirty={isDirty}
        saving={saving}
        recordName={orderHeader.name || (isEditMode ? `Sale Order #${orderHeader.id}` : 'New Sale Order')}
        parentBreadcrumb={{ label: 'Sale Orders', onClick: onBack }}
      />

      {/* Error alert */}
      {formError && (
        <Alert severity="error" sx={{ mb: 1.5, py: 0.25, fontSize: '0.6875rem' }}>
          {formError}
        </Alert>
      )}

      {/* Main Order Container */}
      <Card sx={{ bgcolor: 'white', p: 2, border: '1px solid #E2E8F0' }}>
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {/* Row 1: Customer (Partner) & Order Number / Reference */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Customer (Partner)"
              value={orderHeader.partner_id}
              onChange={(e) => handleHeaderChange('partner_id', e.target.value)}
              required
            >
              {partners.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} {p.email ? `(${p.email})` : ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Customer Reference"
              placeholder="e.g. PO-REF-2026-X"
              value={orderHeader.client_order_ref}
              onChange={(e) => handleHeaderChange('client_order_ref', e.target.value)}
            />
          </Grid>

          {/* Row 2: Currency, Company, Warehouse */}
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Currency"
              value={orderHeader.currency_id}
              onChange={(e) => handleHeaderChange('currency_id', e.target.value)}
              required
            >
              {currencies.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} - {c.full_name || c.symbol}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Company"
              value={orderHeader.company_id}
              onChange={(e) => handleHeaderChange('company_id', e.target.value)}
              required
            >
              {companies.map((cmp) => (
                <MenuItem key={cmp.id} value={cmp.id}>
                  {cmp.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Warehouse"
              value={orderHeader.warehouse_id || (warehouses[0]?.id || '')}
              onChange={(e) => handleHeaderChange('warehouse_id', e.target.value)}
            >
              {warehouses.map((w) => (
                <MenuItem key={w.id} value={w.id}>
                  {w.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        {/* Notebook Tabs Section */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.5 }}>
          <Tabs
            value={currentTab}
            onChange={(_, val) => setCurrentTab(val)}
            sx={{
              minHeight: 32,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.72rem',
                minHeight: 32,
                py: 0.5,
                px: 1.5,
                '&.Mui-selected': {
                  color: '#262755',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#262755',
                height: 2,
              },
            }}
          >
            <Tab label="Order Lines" />
            <Tab label="Other Info" />
            <Tab label="Customer Notes" />
          </Tabs>
        </Box>

        {/* Tab 1: Order Lines */}
        {currentTab === 0 && (
          <Box>
            <TableContainer sx={{ border: '1px solid #E2E8F0', borderRadius: 1.5, mb: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', minWidth: 200 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', minWidth: 200 }}>Description</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', width: 100 }}>Quantity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', width: 120 }}>Unit Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', width: 120 }}>Subtotal</TableCell>
                    <TableCell align="center" sx={{ width: 50 }}></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {orderLines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No order lines yet. Click "Add a product" below.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderLines.map((line, idx) => {
                      const lineTotal = (Number(line.quantity) || 0) * (Number(line.price_unit) || 0);

                      return (
                        <TableRow key={line.id || idx} hover>
                          {/* Product Select */}
                          <TableCell sx={{ py: 1 }}>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              variant="standard"
                              value={line.product_id}
                              onChange={(e) => handleLineChange(idx, 'product_id', e.target.value)}
                              InputProps={{ disableUnderline: true, sx: { fontSize: '0.85rem' } }}
                            >
                              {products.map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                  {p.name} ({p.code || 'No SKU'})
                                </MenuItem>
                              ))}
                            </TextField>
                          </TableCell>

                          {/* Description */}
                          <TableCell sx={{ py: 1 }}>
                            <TextField
                              fullWidth
                              size="small"
                              variant="standard"
                              value={line.description}
                              onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                              InputProps={{ disableUnderline: true, sx: { fontSize: '0.85rem' } }}
                            />
                          </TableCell>

                          {/* Quantity */}
                          <TableCell align="right" sx={{ py: 1 }}>
                            <TextField
                              type="number"
                              size="small"
                              variant="standard"
                              value={line.quantity}
                              onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                              InputProps={{
                                disableUnderline: true,
                                sx: { fontSize: '0.85rem', input: { textAlign: 'right' } },
                              }}
                            />
                          </TableCell>

                          {/* Unit Price */}
                          <TableCell align="right" sx={{ py: 1 }}>
                            <TextField
                              type="number"
                              size="small"
                              variant="standard"
                              value={line.price_unit}
                              onChange={(e) => handleLineChange(idx, 'price_unit', e.target.value)}
                              InputProps={{
                                disableUnderline: true,
                                sx: { fontSize: '0.85rem', input: { textAlign: 'right' } },
                              }}
                            />
                          </TableCell>

                          {/* Amount */}
                          <TableCell align="right" sx={{ py: 1, fontWeight: 600 }}>
                            ${lineTotal.toFixed(2)}
                          </TableCell>

                          {/* Delete Action */}
                          <TableCell align="center" sx={{ py: 1 }}>
                            <IconButton size="small" onClick={() => handleDeleteLine(idx)} sx={{ color: '#EF4444' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Actions: Add Line */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Button
                size="small"
                variant="text"
                startIcon={<AddIcon sx={{ fontSize: '0.85rem' }} />}
                onClick={handleAddLine}
                sx={{ color: '#262755', fontWeight: 600, fontSize: '0.6875rem' }}
              >
                Add a product
              </Button>

              {/* Order Totals Summary Card */}
              <Box sx={{ minWidth: 220, border: '1px solid #E2E8F0', borderRadius: 1.5, p: 1.5, bgcolor: '#F8FAFC' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>Untaxed Amount:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.6875rem' }}>${untaxedAmount.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>Estimated Taxes (15%):</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.6875rem' }}>${totalTaxes.toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.75rem' }}>Total:</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#262755', fontSize: '0.85rem' }}>
                    ${grandTotal.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Tab 2: Other Info */}
        {currentTab === 1 && (
          <Box sx={{ py: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontWeight: 700, mb: 1, color: '#0F172A', fontSize: '0.75rem' }}>
                  Dates & Invoicing
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Validity Date"
                  value={orderHeader.validity_date}
                  onChange={(e) => handleHeaderChange('validity_date', e.target.value)}
                  InputLabelProps={{ shrink: true, sx: { fontSize: '0.6875rem' } }}
                  InputProps={{ sx: { fontSize: '0.6875rem' } }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 3: Customer Notes */}
        {currentTab === 2 && (
          <Box sx={{ py: 1 }}>
            <Typography sx={{ fontWeight: 700, mb: 1, color: '#0F172A', fontSize: '0.75rem' }}>
              Terms, Conditions & Internal Notes
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={orderHeader.termsAndConditions}
              onChange={(e) => handleHeaderChange('termsAndConditions', e.target.value)}
              placeholder="Terms and conditions that will appear on the quotation/invoice..."
              InputProps={{ sx: { fontSize: '0.6875rem' } }}
            />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Bottom Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="text" color="inherit" onClick={onBack} disabled={saving} sx={{ fontSize: '0.6875rem' }}>
            Discard
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{
              backgroundColor: '#262755',
              color: '#FFFFFF',
              height: 28,
              fontSize: '0.6875rem',
              '&:hover': { backgroundColor: '#1B1C3D' },
            }}
          >
            {saving ? 'Saving...' : isEditMode ? 'Save & Close' : 'Save Sale Order'}
          </Button>
        </Box>
      </Card>

      <Chatter model="sales_order" recordId={isEditMode ? initialData.id : null} refreshKey={initialData} />
    </Box>
  );
}
