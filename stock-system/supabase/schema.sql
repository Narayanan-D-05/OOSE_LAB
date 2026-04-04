-- ════════════════════════════════════════════════════════════════
-- Stock Maintenance System — Supabase Schema
-- Run this in Supabase SQL Editor (project → SQL Editor → New Query)
-- ════════════════════════════════════════════════════════════════

-- ── ENUMS ────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('admin', 'clerk', 'billing', 'customer', 'supplier');
CREATE TYPE po_status AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');
CREATE TYPE so_status AS ENUM ('PENDING', 'CONFIRMED', 'PAID', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('UNPAID', 'PAID', 'REFUNDED');
CREATE TYPE tx_type AS ENUM ('STOCK_IN', 'STOCK_OUT');

-- ── USER PROFILES ────────────────────────────────────────────────
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'customer',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own profile" ON user_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin sees all profiles" ON user_profiles FOR ALL USING (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Auto-create profile on signup
CREATE FUNCTION handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
          COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── PRODUCTS ─────────────────────────────────────────────────────
CREATE TABLE products (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku                TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  description        TEXT,
  unit               TEXT NOT NULL DEFAULT 'pcs',
  selling_price      NUMERIC(12,2) NOT NULL,
  cost_price         NUMERIC(12,2) NOT NULL DEFAULT 0,
  reorder_threshold  INTEGER NOT NULL DEFAULT 10,
  current_stock      INTEGER NOT NULL DEFAULT 0,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  image_url          TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view products" ON products FOR SELECT TO authenticated USING (is_active = TRUE);
CREATE POLICY "Admin can manage products" ON products FOR ALL USING (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
);

-- ── SUPPLIERS ────────────────────────────────────────────────────
CREATE TABLE suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  contact_person  TEXT,
  email           TEXT,
  phone           TEXT,
  address         TEXT,
  gst_number      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/Clerk can manage suppliers" ON suppliers FOR ALL USING (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) IN ('admin', 'clerk')
);

-- ── CUSTOMERS ────────────────────────────────────────────────────
CREATE TABLE customers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT UNIQUE,
  phone            TEXT,
  billing_address  TEXT,
  gst_number       TEXT,
  stripe_customer_id TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/Billing can manage customers" ON customers FOR ALL USING (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) IN ('admin', 'billing')
);

-- ── STOCK TRANSACTIONS ───────────────────────────────────────────
CREATE TABLE stock_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id),
  type          tx_type NOT NULL,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  reference_id  UUID,
  notes         TEXT,
  performed_by  UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_stock_tx_product ON stock_transactions(product_id);
CREATE INDEX idx_stock_tx_type ON stock_transactions(type);
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/Clerk can manage stock" ON stock_transactions FOR ALL USING (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) IN ('admin', 'clerk')
);
CREATE POLICY "Authenticated can view stock" ON stock_transactions FOR SELECT TO authenticated USING (true);

-- ── CURRENT STOCK VIEW ───────────────────────────────────────────
CREATE OR REPLACE VIEW current_stock AS
  SELECT
    p.id          AS product_id,
    p.name        AS product_name,
    p.sku,
    p.category,
    p.reorder_threshold,
    p.selling_price,
    p.unit,
    COALESCE(SUM(
      CASE WHEN st.type = 'STOCK_IN'  THEN st.quantity
           WHEN st.type = 'STOCK_OUT' THEN -st.quantity
      END
    ), 0) AS current_quantity
  FROM products p
  LEFT JOIN stock_transactions st ON st.product_id = p.id
  WHERE p.is_active = TRUE
  GROUP BY p.id, p.name, p.sku, p.category, p.reorder_threshold, p.selling_price, p.unit;

-- ── PURCHASE ORDERS ──────────────────────────────────────────────
CREATE TABLE purchase_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number       TEXT NOT NULL UNIQUE,
  supplier_id     UUID NOT NULL REFERENCES suppliers(id),
  status          po_status NOT NULL DEFAULT 'DRAFT',
  expected_date   DATE,
  total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/Clerk can manage POs" ON purchase_orders FOR ALL USING (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) IN ('admin', 'clerk')
);

CREATE TABLE po_line_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id        UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id),
  quantity     INTEGER NOT NULL,
  unit_cost    NUMERIC(12,2) NOT NULL,
  received_qty INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE po_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/Clerk can manage PO lines" ON po_line_items FOR ALL USING (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) IN ('admin', 'clerk')
);

-- ── SALES ORDERS ─────────────────────────────────────────────────
CREATE TABLE sales_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id  UUID NOT NULL REFERENCES customers(id),
  status       so_status NOT NULL DEFAULT 'PENDING',
  subtotal     NUMERIC(12,2) NOT NULL,
  tax_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  total        NUMERIC(12,2) NOT NULL,
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/Billing can manage sales" ON sales_orders FOR ALL USING (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) IN ('admin', 'billing')
);

CREATE TABLE so_line_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  quantity    INTEGER NOT NULL,
  unit_price  NUMERIC(12,2) NOT NULL,
  discount    NUMERIC(5,2) NOT NULL DEFAULT 0
);
ALTER TABLE so_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/Billing can manage SO lines" ON so_line_items FOR ALL USING (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) IN ('admin', 'billing')
);

-- ── INVOICES ─────────────────────────────────────────────────────
CREATE TABLE invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id    UUID NOT NULL REFERENCES sales_orders(id) UNIQUE,
  invoice_number    TEXT NOT NULL UNIQUE,
  pdf_url           TEXT,
  payment_status    payment_status NOT NULL DEFAULT 'UNPAID',
  stripe_session_id TEXT,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/Billing can manage invoices" ON invoices FOR ALL USING (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) IN ('admin', 'billing')
);

-- ── PO NUMBER GENERATOR ──────────────────────────────────────────
CREATE SEQUENCE po_seq START 1;
CREATE FUNCTION generate_po_number() RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN RETURN 'PO-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('po_seq')::TEXT, 5, '0'); END;
$$;

-- ── SEED DEMO USERS (run after creating auth accounts) ──────────
-- Example: After creating users in Supabase Auth, update their roles:
-- UPDATE user_profiles SET role = 'admin'    WHERE user_id = '<uuid-of-admin>';
-- UPDATE user_profiles SET role = 'clerk'    WHERE user_id = '<uuid-of-clerk>';
-- UPDATE user_profiles SET role = 'billing'  WHERE user_id = '<uuid-of-billing>';
