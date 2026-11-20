import {
  mockSalesOrders,
  mockPurchaseOrders,
  mockProducts,
  mockCustomers,
  mockInvoices,
  mockEmployees,
} from '../data/mockData';

/**
 * Module Configurations.
 * Defines columns, form fields, layout rows (1, 2, or 3 fields per row), labels, and descriptions.
 * 
 * Field layout controls:
 * - cols: 1 -> Full width (1 field per row)
 * - cols: 2 -> Half width (2 fields per row)
 * - cols: 3 -> One-third width (3 fields per row)
 */
export const moduleConfigs = {
  salesOrders: {
    title: 'Sales Orders',
    subtitle: 'Manage and track customer sales orders and fulfillment status',
    formDescription: 'Fill in the customer information, sales order details, and payment terms to record the transaction.',
    primaryKey: 'id',
    createButtonText: 'New Sales Order',
    initialData: mockSalesOrders,
    columns: [
      { field: 'id', headerName: 'Order ID', width: 140, sortable: true },
      { field: 'customer', headerName: 'Customer Name', flex: 1, sortable: true },
      { field: 'orderDate', headerName: 'Order Date', width: 140, sortable: true },
      {
        field: 'totalAmount',
        headerName: 'Total Amount',
        width: 150,
        sortable: true,
        type: 'currency',
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 140,
        type: 'chip',
        chipColors: {
          Completed: 'success',
          'In Progress': 'info',
          Pending: 'warning',
          Draft: 'default',
        },
      },
      { field: 'paymentTerms', headerName: 'Terms', width: 120 },
    ],
    formFields: [
      // Row 1: 2 fields per row (Customer Name & Order Date)
      { name: 'customer', label: 'Customer Name', type: 'text', required: true, cols: 2 },
      { name: 'orderDate', label: 'Order Date', type: 'date', required: true, cols: 2 },
      // Row 2: 3 fields per row (Total Amount, Status, Payment Terms)
      { name: 'totalAmount', label: 'Total Amount ($)', type: 'number', required: true, cols: 3 },
      {
        name: 'status',
        label: 'Order Status',
        type: 'select',
        options: ['Draft', 'Pending', 'In Progress', 'Completed'],
        defaultValue: 'Pending',
        cols: 3,
      },
      { name: 'paymentTerms', label: 'Payment Terms', type: 'text', defaultValue: 'Net 30', cols: 3 },
      // Row 3: 1 field per row (Remarks / Notes)
      { name: 'notes', label: 'Order Notes & Instructions', type: 'textarea', rows: 3, cols: 1 },
    ],
  },

  purchaseOrders: {
    title: 'Purchase Orders',
    subtitle: 'Procurement orders sent to suppliers and tracking receipts',
    formDescription: 'Create or modify supplier purchase requests and monitor destination depot schedules.',
    primaryKey: 'id',
    createButtonText: 'Create PO',
    initialData: mockPurchaseOrders,
    columns: [
      { field: 'id', headerName: 'PO Number', width: 140, sortable: true },
      { field: 'vendor', headerName: 'Vendor / Supplier', flex: 1, sortable: true },
      { field: 'issueDate', headerName: 'Issue Date', width: 140, sortable: true },
      { field: 'warehouse', headerName: 'Destination Hub', width: 170 },
      {
        field: 'totalCost',
        headerName: 'Total Cost',
        width: 150,
        sortable: true,
        type: 'currency',
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 140,
        type: 'chip',
        chipColors: {
          Received: 'success',
          Approved: 'info',
          'In Transit': 'warning',
          Draft: 'default',
        },
      },
    ],
    formFields: [
      // Row 1: 2 fields
      { name: 'vendor', label: 'Vendor Name', type: 'text', required: true, cols: 2 },
      { name: 'issueDate', label: 'Issue Date', type: 'date', required: true, cols: 2 },
      // Row 2: 3 fields
      { name: 'warehouse', label: 'Destination Warehouse', type: 'text', required: true, cols: 3 },
      { name: 'totalCost', label: 'Total Cost ($)', type: 'number', required: true, cols: 3 },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: ['Draft', 'Approved', 'In Transit', 'Received'],
        defaultValue: 'Draft',
        cols: 3,
      },
      // Row 3: 1 field
      { name: 'deliveryTerms', label: 'Shipping & Delivery Notes', type: 'textarea', rows: 2, cols: 1 },
    ],
  },

  products: {
    title: 'Products & Inventory Catalog',
    subtitle: 'Manage all company inventory SKUs, stock levels and pricing',
    formDescription: 'Configure product attributes, SKU classification, retail pricing and inventory replenishment parameters.',
    primaryKey: 'id',
    createButtonText: 'Add Product',
    initialData: mockProducts,
    columns: [
      { field: 'id', headerName: 'Product Code', width: 130 },
      { field: 'name', headerName: 'Product Name', flex: 1, sortable: true },
      { field: 'sku', headerName: 'SKU', width: 140 },
      { field: 'category', headerName: 'Category', width: 140 },
      {
        field: 'unitPrice',
        headerName: 'Unit Price',
        width: 130,
        sortable: true,
        type: 'currency',
      },
      { field: 'stockQty', headerName: 'Stock Qty', width: 120, sortable: true },
      {
        field: 'status',
        headerName: 'Availability',
        width: 140,
        type: 'chip',
        chipColors: {
          'In Stock': 'success',
          'Low Stock': 'warning',
          'Out of Stock': 'error',
        },
      },
    ],
    formFields: [
      // Row 1: 1 field (Product title)
      { name: 'name', label: 'Product Name', type: 'text', required: true, cols: 1 },
      // Row 2: 2 fields
      { name: 'sku', label: 'SKU / Barcode', type: 'text', required: true, cols: 2 },
      { name: 'category', label: 'Product Category', type: 'text', required: true, cols: 2 },
      // Row 3: 3 fields
      { name: 'unitPrice', label: 'Unit Price ($)', type: 'number', required: true, cols: 3 },
      { name: 'stockQty', label: 'Stock Quantity', type: 'number', required: true, cols: 3 },
      {
        name: 'status',
        label: 'Stock Status',
        type: 'select',
        options: ['In Stock', 'Low Stock', 'Out of Stock'],
        defaultValue: 'In Stock',
        cols: 3,
      },
    ],
  },

  customers: {
    title: 'Customers Directory',
    subtitle: 'Client accounts, contact information and communication records',
    formDescription: 'Maintain accurate client profiles, communication channels, and location details for seamless billing.',
    primaryKey: 'id',
    createButtonText: 'Add Customer',
    initialData: mockCustomers,
    columns: [
      { field: 'id', headerName: 'Customer ID', width: 130 },
      { field: 'name', headerName: 'Company / Client Name', flex: 1, sortable: true },
      { field: 'email', headerName: 'Email Address', width: 220 },
      { field: 'phone', headerName: 'Phone', width: 150 },
      { field: 'city', headerName: 'City', width: 130 },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        type: 'chip',
        chipColors: {
          Active: 'success',
          Inactive: 'default',
        },
      },
    ],
    formFields: [
      // Row 1: 2 fields
      { name: 'name', label: 'Customer / Company Name', type: 'text', required: true, cols: 2 },
      { name: 'email', label: 'Email Address', type: 'text', required: true, cols: 2 },
      // Row 2: 3 fields
      { name: 'phone', label: 'Phone Number', type: 'text', cols: 3 },
      { name: 'city', label: 'City', type: 'text', cols: 3 },
      {
        name: 'status',
        label: 'Account Status',
        type: 'select',
        options: ['Active', 'Inactive'],
        defaultValue: 'Active',
        cols: 3,
      },
    ],
  },

  invoices: {
    title: 'Customer Invoices',
    subtitle: 'Manage billing statements, receipts and customer receivables',
    formDescription: 'Draft customer invoices, specify due dates, and record ledger receivables.',
    primaryKey: 'id',
    createButtonText: 'Create Invoice',
    initialData: mockInvoices,
    columns: [
      { field: 'id', headerName: 'Invoice #', width: 140 },
      { field: 'customer', headerName: 'Customer', flex: 1, sortable: true },
      { field: 'invoiceDate', headerName: 'Issue Date', width: 140, sortable: true },
      { field: 'dueDate', headerName: 'Due Date', width: 140, sortable: true },
      { field: 'amount', headerName: 'Total Due', width: 140, sortable: true, type: 'currency' },
      {
        field: 'status',
        headerName: 'Payment Status',
        width: 140,
        type: 'chip',
        chipColors: {
          Paid: 'success',
          Pending: 'warning',
          Overdue: 'error',
        },
      },
    ],
    formFields: [
      // Row 1: 1 field
      { name: 'customer', label: 'Customer Name', type: 'text', required: true, cols: 1 },
      // Row 2: 3 fields
      { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true, cols: 3 },
      { name: 'dueDate', label: 'Due Date', type: 'date', required: true, cols: 3 },
      { name: 'amount', label: 'Invoice Amount ($)', type: 'number', required: true, cols: 3 },
      // Row 3: 2 fields
      {
        name: 'status',
        label: 'Payment Status',
        type: 'select',
        options: ['Paid', 'Pending', 'Overdue'],
        defaultValue: 'Pending',
        cols: 2,
      },
      { name: 'reference', label: 'External Ref / PO Number', type: 'text', cols: 2 },
    ],
  },

  employees: {
    title: 'Staff & Employees',
    subtitle: 'Human resources personnel roster and departmental assignments',
    formDescription: 'Record employee biographical details, employment designation, department, and current work status.',
    primaryKey: 'id',
    createButtonText: 'Add Employee',
    initialData: mockEmployees,
    columns: [
      { field: 'id', headerName: 'Staff ID', width: 120 },
      { field: 'name', headerName: 'Full Name', width: 180, sortable: true },
      { field: 'role', headerName: 'Designation / Role', flex: 1 },
      { field: 'department', headerName: 'Department', width: 150, sortable: true },
      { field: 'email', headerName: 'Work Email', width: 220 },
      { field: 'joinDate', headerName: 'Joined Date', width: 130 },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        type: 'chip',
        chipColors: {
          Active: 'success',
          'On Leave': 'warning',
          Terminated: 'error',
        },
      },
    ],
    formFields: [
      // Row 1: 2 fields
      { name: 'name', label: 'Full Name', type: 'text', required: true, cols: 2 },
      { name: 'email', label: 'Work Email', type: 'text', required: true, cols: 2 },
      // Row 2: 3 fields
      { name: 'role', label: 'Designation', type: 'text', required: true, cols: 3 },
      {
        name: 'department',
        label: 'Department',
        type: 'select',
        options: ['Finance', 'Sales', 'Logistics', 'Warehouse', 'Operations', 'HR'],
        defaultValue: 'Sales',
        cols: 3,
      },
      { name: 'joinDate', label: 'Join Date', type: 'date', required: true, cols: 3 },
      // Row 3: 1 field
      {
        name: 'status',
        label: 'Employment Status',
        type: 'select',
        options: ['Active', 'On Leave', 'Terminated'],
        defaultValue: 'Active',
        cols: 1,
      },
    ],
  },
};
