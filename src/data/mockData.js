/**
 * Mock data for ERP modules
 */

export const mockSalesOrders = [
  { id: 'SO-1001', customer: 'Acme Corp', orderDate: '2026-10-15', totalAmount: 4500.00, status: 'Completed', paymentTerms: 'Net 30' },
  { id: 'SO-1002', customer: 'Globex Inc', orderDate: '2026-10-18', totalAmount: 12850.50, status: 'In Progress', paymentTerms: 'Immediate' },
  { id: 'SO-1003', customer: 'Soylent Health', orderDate: '2026-10-20', totalAmount: 3200.00, status: 'Pending', paymentTerms: 'Net 15' },
  { id: 'SO-1004', customer: 'Initech Systems', orderDate: '2026-10-22', totalAmount: 890.00, status: 'Completed', paymentTerms: 'Net 30' },
  { id: 'SO-1005', customer: 'Umbrella Pharma', orderDate: '2026-10-24', totalAmount: 22400.00, status: 'Draft', paymentTerms: 'Net 60' },
  { id: 'SO-1006', customer: 'Hooli Tech', orderDate: '2026-10-27', totalAmount: 5600.00, status: 'In Progress', paymentTerms: 'Net 30' },
  { id: 'SO-1007', customer: 'Massive Dynamic', orderDate: '2026-10-28', totalAmount: 18200.00, status: 'Completed', paymentTerms: 'Net 45' },
  { id: 'SO-1008', customer: 'Cyberdyne AI', orderDate: '2026-10-29', totalAmount: 9350.00, status: 'Pending', paymentTerms: 'Immediate' },
];

export const mockPurchaseOrders = [
  { id: 'PO-2001', vendor: 'Dell Enterprise Supplies', issueDate: '2026-10-10', totalCost: 15400.00, status: 'Approved', warehouse: 'Main Depot' },
  { id: 'PO-2002', vendor: 'Steelcase Furniture', issueDate: '2026-10-12', totalCost: 4800.00, status: 'Draft', warehouse: 'HQ Warehouse' },
  { id: 'PO-2003', vendor: 'LogiTech Wholesale', issueDate: '2026-10-19', totalCost: 2150.00, status: 'Received', warehouse: 'East Coast Hub' },
  { id: 'PO-2004', vendor: 'Packaging World Ltd', issueDate: '2026-10-25', totalCost: 750.00, status: 'Approved', warehouse: 'Main Depot' },
  { id: 'PO-2005', vendor: 'Shenzhen Micro Parts', issueDate: '2026-10-26', totalCost: 34000.00, status: 'In Transit', warehouse: 'Central Facility' },
];

export const mockProducts = [
  { id: 'PRD-01', name: 'UltraBook Pro 15', sku: 'UB-15-2026', category: 'Laptops', unitPrice: 1299.99, stockQty: 45, status: 'In Stock' },
  { id: 'PRD-02', name: 'Wireless Mechanical Keyboard', sku: 'WMK-87', category: 'Accessories', unitPrice: 129.50, stockQty: 180, status: 'In Stock' },
  { id: 'PRD-03', name: 'Ergonomic Mesh Chair', sku: 'EMC-V2', category: 'Furniture', unitPrice: 349.00, stockQty: 12, status: 'Low Stock' },
  { id: 'PRD-04', name: '4K IPS USB-C Monitor 27"', sku: 'MON-4K-27', category: 'Displays', unitPrice: 489.00, stockQty: 28, status: 'In Stock' },
  { id: 'PRD-05', name: 'Thunderbolt 4 Docking Station', sku: 'TB4-DK-01', category: 'Accessories', unitPrice: 199.99, stockQty: 0, status: 'Out of Stock' },
  { id: 'PRD-06', name: 'Noise-Cancelling Headset', sku: 'NCH-900', category: 'Audio', unitPrice: 179.00, stockQty: 64, status: 'In Stock' },
];

export const mockCustomers = [
  { id: 'CUST-001', name: 'Acme Corporation', email: 'billing@acme.com', phone: '+1 555-0199', city: 'New York', country: 'USA', status: 'Active' },
  { id: 'CUST-002', name: 'Globex Logistics', email: 'orders@globex.io', phone: '+1 555-0144', city: 'Chicago', country: 'USA', status: 'Active' },
  { id: 'CUST-003', name: 'Soylent Health Inc', email: 'ap@soylent.org', phone: '+1 555-0182', city: 'San Francisco', country: 'USA', status: 'Active' },
  { id: 'CUST-004', name: 'Initech Information Tech', email: 'finance@initech.com', phone: '+1 555-0120', city: 'Austin', country: 'USA', status: 'Inactive' },
  { id: 'CUST-005', name: 'Umbrella Pharmaceuticals', email: 'procure@umbrella.com', phone: '+1 555-0177', city: 'Boston', country: 'USA', status: 'Active' },
];

export const mockInvoices = [
  { id: 'INV-3001', customer: 'Acme Corp', invoiceDate: '2026-10-15', dueDate: '2026-11-14', amount: 4500.00, status: 'Paid' },
  { id: 'INV-3002', customer: 'Globex Inc', invoiceDate: '2026-10-18', dueDate: '2026-10-18', amount: 12850.50, status: 'Pending' },
  { id: 'INV-3003', customer: 'Soylent Health', invoiceDate: '2026-10-20', dueDate: '2026-11-04', amount: 3200.00, status: 'Overdue' },
  { id: 'INV-3004', customer: 'Initech Systems', invoiceDate: '2026-10-22', dueDate: '2026-11-21', amount: 890.00, status: 'Paid' },
];

export const mockEmployees = [
  { id: 'EMP-01', name: 'Sarah Jenkins', role: 'Chief Financial Officer', department: 'Finance', email: 'sarah.j@exobook.com', joinDate: '2021-03-15', status: 'Active' },
  { id: 'EMP-02', name: 'David Kim', role: 'Head of Sales', department: 'Sales', email: 'david.k@exobook.com', joinDate: '2022-06-01', status: 'Active' },
  { id: 'EMP-03', name: 'Elena Rostova', role: 'Lead Supply Chain Manager', department: 'Logistics', email: 'elena.r@exobook.com', joinDate: '2023-01-10', status: 'Active' },
  { id: 'EMP-04', name: 'Marcus Brody', role: 'Inventory Controller', department: 'Warehouse', email: 'marcus.b@exobook.com', joinDate: '2024-08-20', status: 'On Leave' },
  { id: 'EMP-05', name: 'Amara Patel', role: 'Manufacturing Engineer', department: 'Operations', email: 'amara.p@exobook.com', joinDate: '2022-11-12', status: 'Active' },
];

export const mockDashboardStats = {
  totalRevenue: '$284,500',
  revenueGrowth: '+12.4%',
  totalOrders: '1,429',
  ordersGrowth: '+8.1%',
  inventoryItems: '8,420',
  lowStockAlerts: '14 items',
  activeClients: '492',
  clientsGrowth: '+5.7%',
  recentOrders: [
    { id: 'SO-1008', customer: 'Cyberdyne AI', date: 'Oct 29, 2026', amount: '$9,350.00', status: 'Pending' },
    { id: 'SO-1007', customer: 'Massive Dynamic', date: 'Oct 28, 2026', amount: '$18,200.00', status: 'Completed' },
    { id: 'SO-1006', customer: 'Hooli Tech', date: 'Oct 27, 2026', amount: '$5,600.00', status: 'In Progress' },
    { id: 'SO-1005', customer: 'Umbrella Pharma', date: 'Oct 24, 2026', amount: '$22,400.00', status: 'Draft' },
  ],
  topProducts: [
    { name: 'UltraBook Pro 15', sales: '320 units', revenue: '$415,968' },
    { name: '4K IPS USB-C Monitor 27"', sales: '184 units', revenue: '$89,976' },
    { name: 'Wireless Mechanical Keyboard', sales: '512 units', revenue: '$66,304' },
    { name: 'Ergonomic Mesh Chair', sales: '94 units', revenue: '$32,806' },
  ]
};

