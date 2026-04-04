// ─── TYPES ────────────────────────────────────────────────────────────────────

export type Role = 'admin' | 'clerk' | 'billing' | 'customer' | 'supplier';

export interface User {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  selling_price: number;
  cost_price: number;
  reorder_threshold: number;
  is_active: boolean;
  current_stock?: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  gst_number: string;
  is_active: boolean;
}

export interface StockTransaction {
  id: string;
  product_id: string;
  product_name?: string;
  type: 'STOCK_IN' | 'STOCK_OUT';
  quantity: number;
  reference_id?: string;
  notes?: string;
  performed_by: string;
  performed_by_name?: string;
  created_at: string;
}

export interface PurchaseOrderLine {
  id: string;
  po_id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_cost: number;
  received_qty: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name?: string;
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  expected_date: string;
  total_amount: number;
  created_by: string;
  created_at: string;
  line_items?: PurchaseOrderLine[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  billing_address: string;
  gst_number: string;
}

export interface SalesOrderLine {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  discount: number;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED';
  subtotal: number;
  tax_amount: number;
  total: number;
  created_by: string;
  created_at: string;
  line_items?: SalesOrderLine[];
}

// ─── DEMO USERS ───────────────────────────────────────────────────────────────

export const DEMO_USERS: User[] = [
  { id: 'u1', email: 'admin@stocksms.com',    password: 'Admin@123',    full_name: 'Arjun Sharma',    role: 'admin',    is_active: true },
  { id: 'u2', email: 'clerk@stocksms.com',    password: 'Clerk@123',    full_name: 'Priya Nair',      role: 'clerk',    is_active: true },
  { id: 'u3', email: 'billing@stocksms.com',  password: 'Billing@123',  full_name: 'Rahul Menon',     role: 'billing',  is_active: true },
  { id: 'u4', email: 'customer@stocksms.com', password: 'Customer@123', full_name: 'Divya Krishnan',  role: 'customer', is_active: true },
  { id: 'u5', email: 'supplier@stocksms.com', password: 'Supplier@123', full_name: 'Vikram Patel',    role: 'supplier', is_active: true },
];

// ─── MOCK PRODUCTS ────────────────────────────────────────────────────────────

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', sku: 'ELC-001', name: 'LED Bulb 9W',          category: 'Electronics',   unit: 'pcs',  selling_price: 120,   cost_price: 75,   reorder_threshold: 50,  is_active: true, current_stock: 320 },
  { id: 'p2', sku: 'ELC-002', name: 'USB-C Cable 1m',        category: 'Electronics',   unit: 'pcs',  selling_price: 299,   cost_price: 180,  reorder_threshold: 30,  is_active: true, current_stock: 145 },
  { id: 'p3', sku: 'STA-001', name: 'A4 Paper Ream',         category: 'Stationery',    unit: 'ream', selling_price: 350,   cost_price: 270,  reorder_threshold: 20,  is_active: true, current_stock: 18  },
  { id: 'p4', sku: 'STA-002', name: 'Ball Pen (Box of 10)',  category: 'Stationery',    unit: 'box',  selling_price: 95,    cost_price: 55,   reorder_threshold: 15,  is_active: true, current_stock: 8   },
  { id: 'p5', sku: 'CLN-001', name: 'Floor Cleaner 1L',      category: 'Cleaning',      unit: 'btl',  selling_price: 180,   cost_price: 110,  reorder_threshold: 25,  is_active: true, current_stock: 62  },
  { id: 'p6', sku: 'CLN-002', name: 'Hand Sanitizer 500ml',  category: 'Cleaning',      unit: 'btl',  selling_price: 220,   cost_price: 145,  reorder_threshold: 20,  is_active: true, current_stock: 5   },
  { id: 'p7', sku: 'FUR-001', name: 'Office Chair',          category: 'Furniture',     unit: 'pcs',  selling_price: 8500,  cost_price: 5500, reorder_threshold: 5,   is_active: true, current_stock: 12  },
  { id: 'p8', sku: 'NET-001', name: 'CAT6 LAN Cable 10m',    category: 'Networking',    unit: 'pcs',  selling_price: 450,   cost_price: 280,  reorder_threshold: 10,  is_active: true, current_stock: 34  },
];

// ─── MOCK SUPPLIERS ───────────────────────────────────────────────────────────

export const MOCK_SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'TechBridge Distributors',  contact_person: 'Vikram Patel',   email: 'supplier@stocksms.com', phone: '9876543210', address: '12 Industrial Estate, Pune',      gst_number: '27AABCT1332L1ZL', is_active: true },
  { id: 's2', name: 'OfficeZone Wholesale',      contact_person: 'Sunita Rao',     email: 'sunita@officezone.in',  phone: '9123456789', address: '45 MG Road, Bengaluru',           gst_number: '29AABCO9876K1ZM', is_active: true },
  { id: 's3', name: 'CleanPro Supplies',         contact_person: 'Manoj Desai',    email: 'manoj@cleanpro.in',     phone: '9988776655', address: '8 MIDC Phase 2, Mumbai',          gst_number: '27AABCC5432P1ZN', is_active: true },
];

// ─── MOCK STOCK TRANSACTIONS ──────────────────────────────────────────────────

export const MOCK_TRANSACTIONS: StockTransaction[] = [
  { id: 'tx1',  product_id: 'p1', product_name: 'LED Bulb 9W',         type: 'STOCK_IN',  quantity: 200, notes: 'Initial stock',          performed_by: 'u2', performed_by_name: 'Priya Nair',   created_at: '2026-03-01T09:00:00Z' },
  { id: 'tx2',  product_id: 'p2', product_name: 'USB-C Cable 1m',       type: 'STOCK_IN',  quantity: 100, notes: 'Received from TechBridge', performed_by: 'u2', performed_by_name: 'Priya Nair',   created_at: '2026-03-02T10:30:00Z' },
  { id: 'tx3',  product_id: 'p1', product_name: 'LED Bulb 9W',         type: 'STOCK_OUT', quantity: 30,  notes: 'Sale SO-2026-00001',       performed_by: 'u2', performed_by_name: 'Priya Nair',   created_at: '2026-03-05T14:00:00Z' },
  { id: 'tx4',  product_id: 'p3', product_name: 'A4 Paper Ream',        type: 'STOCK_IN',  quantity: 40,  notes: 'Received from OfficeZone', performed_by: 'u2', performed_by_name: 'Priya Nair',   created_at: '2026-03-06T09:15:00Z' },
  { id: 'tx5',  product_id: 'p4', product_name: 'Ball Pen (Box of 10)', type: 'STOCK_IN',  quantity: 30,  notes: 'Initial batch',            performed_by: 'u2', performed_by_name: 'Priya Nair',   created_at: '2026-03-07T11:00:00Z' },
  { id: 'tx6',  product_id: 'p5', product_name: 'Floor Cleaner 1L',     type: 'STOCK_IN',  quantity: 80,  notes: 'Received from CleanPro',   performed_by: 'u2', performed_by_name: 'Priya Nair',   created_at: '2026-03-08T10:00:00Z' },
  { id: 'tx7',  product_id: 'p3', product_name: 'A4 Paper Ream',        type: 'STOCK_OUT', quantity: 22,  notes: 'Sale SO-2026-00002',       performed_by: 'u2', performed_by_name: 'Priya Nair',   created_at: '2026-03-10T15:00:00Z' },
  { id: 'tx8',  product_id: 'p6', product_name: 'Hand Sanitizer 500ml', type: 'STOCK_IN',  quantity: 50,  notes: 'Received from CleanPro',   performed_by: 'u2', performed_by_name: 'Priya Nair',   created_at: '2026-03-12T09:00:00Z' },
  { id: 'tx9',  product_id: 'p6', product_name: 'Hand Sanitizer 500ml', type: 'STOCK_OUT', quantity: 45,  notes: 'Sale SO-2026-00003',       performed_by: 'u2', performed_by_name: 'Priya Nair',   created_at: '2026-03-15T16:00:00Z' },
  { id: 'tx10', product_id: 'p2', product_name: 'USB-C Cable 1m',       type: 'STOCK_OUT', quantity: 55,  notes: 'Sale SO-2026-00004',       performed_by: 'u2', performed_by_name: 'Priya Nair',   created_at: '2026-03-20T13:00:00Z' },
];

// ─── MOCK PURCHASE ORDERS ─────────────────────────────────────────────────────

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po1', po_number: 'PO-2026-00001', supplier_id: 's1', supplier_name: 'TechBridge Distributors',
    status: 'RECEIVED', expected_date: '2026-03-02', total_amount: 33000,
    created_by: 'u2', created_at: '2026-02-28T08:00:00Z',
    line_items: [
      { id: 'li1', po_id: 'po1', product_id: 'p1', product_name: 'LED Bulb 9W',   quantity: 200, unit_cost: 75,  received_qty: 200 },
      { id: 'li2', po_id: 'po1', product_id: 'p2', product_name: 'USB-C Cable 1m', quantity: 100, unit_cost: 180, received_qty: 100 },
    ]
  },
  {
    id: 'po2', po_number: 'PO-2026-00002', supplier_id: 's2', supplier_name: 'OfficeZone Wholesale',
    status: 'SENT', expected_date: '2026-04-10', total_amount: 12450,
    created_by: 'u1', created_at: '2026-04-01T09:00:00Z',
    line_items: [
      { id: 'li3', po_id: 'po2', product_id: 'p3', product_name: 'A4 Paper Ream',        quantity: 30,  unit_cost: 270, received_qty: 0 },
      { id: 'li4', po_id: 'po2', product_id: 'p4', product_name: 'Ball Pen (Box of 10)', quantity: 25,  unit_cost: 55,  received_qty: 0 },
    ]
  },
  {
    id: 'po3', po_number: 'PO-2026-00003', supplier_id: 's3', supplier_name: 'CleanPro Supplies',
    status: 'DRAFT', expected_date: '2026-04-15', total_amount: 16250,
    created_by: 'u2', created_at: '2026-04-03T11:00:00Z',
    line_items: [
      { id: 'li5', po_id: 'po3', product_id: 'p5', product_name: 'Floor Cleaner 1L',     quantity: 60,  unit_cost: 110, received_qty: 0 },
      { id: 'li6', po_id: 'po3', product_id: 'p6', product_name: 'Hand Sanitizer 500ml', quantity: 75,  unit_cost: 145, received_qty: 0 },
    ]
  },
];

// ─── MOCK CUSTOMERS ───────────────────────────────────────────────────────────

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Divya Krishnan',   email: 'customer@stocksms.com', phone: '9001234567', billing_address: '23 Lake View, Chennai',       gst_number: '' },
  { id: 'c2', name: 'Akash Enterprises', email: 'akash@enterpises.in',  phone: '9812345678', billing_address: '7 Industrial Area, Hyderabad', gst_number: '36AABCA1234B1ZP' },
  { id: 'c3', name: 'Meera IT Solutions', email: 'meera@meerait.com',    phone: '9723456789', billing_address: '55 Cyber Park, Kochi',         gst_number: '32AABCM9876C1ZQ' },
];

// ─── MOCK SALES ORDERS ────────────────────────────────────────────────────────

export const MOCK_SALES_ORDERS: SalesOrder[] = [
  {
    id: 'so1', order_number: 'SO-2026-00001', customer_id: 'c1', customer_name: 'Divya Krishnan',
    status: 'PAID', subtotal: 3600, tax_amount: 648, total: 4248,
    created_by: 'u3', created_at: '2026-03-05T13:00:00Z',
    line_items: [
      { id: 'sli1', order_id: 'so1', product_id: 'p1', product_name: 'LED Bulb 9W', quantity: 30, unit_price: 120, discount: 0 },
    ]
  },
  {
    id: 'so2', order_number: 'SO-2026-00002', customer_id: 'c2', customer_name: 'Akash Enterprises',
    status: 'PAID', subtotal: 7700, tax_amount: 1386, total: 9086,
    created_by: 'u3', created_at: '2026-03-10T14:30:00Z',
    line_items: [
      { id: 'sli2', order_id: 'so2', product_id: 'p3', product_name: 'A4 Paper Ream',       quantity: 12, unit_price: 350, discount: 0 },
      { id: 'sli3', order_id: 'so2', product_id: 'p4', product_name: 'Ball Pen (Box of 10)', quantity: 22, unit_price: 95,  discount: 0 },
    ]
  },
  {
    id: 'so3', order_number: 'SO-2026-00003', customer_id: 'c3', customer_name: 'Meera IT Solutions',
    status: 'CONFIRMED', subtotal: 9900, tax_amount: 1782, total: 11682,
    created_by: 'u3', created_at: '2026-03-15T15:00:00Z',
    line_items: [
      { id: 'sli4', order_id: 'so3', product_id: 'p6', product_name: 'Hand Sanitizer 500ml', quantity: 45, unit_price: 220, discount: 0 },
    ]
  },
  {
    id: 'so4', order_number: 'SO-2026-00004', customer_id: 'c1', customer_name: 'Divya Krishnan',
    status: 'PENDING', subtotal: 16445, tax_amount: 2960, total: 19405,
    created_by: 'u3', created_at: '2026-03-20T12:00:00Z',
    line_items: [
      { id: 'sli5', order_id: 'so4', product_id: 'p2', product_name: 'USB-C Cable 1m', quantity: 55, unit_price: 299, discount: 0 },
    ]
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export const SALES_CHART_DATA = [
  { month: 'Oct', revenue: 28000, orders: 12 },
  { month: 'Nov', revenue: 42000, orders: 18 },
  { month: 'Dec', revenue: 61000, orders: 25 },
  { month: 'Jan', revenue: 38000, orders: 16 },
  { month: 'Feb', revenue: 55000, orders: 22 },
  { month: 'Mar', revenue: 44421, orders: 19 },
];

export const CATEGORY_DATA = [
  { name: 'Electronics', value: 465 },
  { name: 'Stationery',  value: 26  },
  { name: 'Cleaning',    value: 67  },
  { name: 'Furniture',   value: 12  },
  { name: 'Networking',  value: 34  },
];

export function getLowStockProducts(products: Product[]) {
  return products.filter(p => p.is_active && (p.current_stock ?? 0) <= p.reorder_threshold);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
