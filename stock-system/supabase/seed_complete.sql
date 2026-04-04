-- =========================================================
-- COMPLETE DEMO SEED FOR STOCK MAINTENANCE SYSTEM
-- =========================================================
-- This script creates:
-- 1. All Auth Users (Password: Stocks@123)
-- 2. Staff Profiles
-- 3. Suppliers & Customers
-- 4. Product Catalog
-- 5. Sales & Purchase Order History
-- 6. Stock Transaction Logs
-- =========================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to create a user safely
CREATE OR REPLACE FUNCTION create_demo_user(
    u_email TEXT, 
    u_password TEXT, 
    u_name TEXT, 
    u_role TEXT
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID := gen_random_uuid();
BEGIN
    -- 1. Insert into auth.users
    --    Pass role + full_name in raw_user_meta_data so the
    --    on_auth_user_created trigger creates user_profiles correctly.
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
        created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated', 
        u_email,
        crypt(u_password, gen_salt('bf')),
        NOW(), 
        '{"provider":"email","providers":["email"]}',
        json_build_object('full_name', u_name, 'role', u_role)::jsonb,
        NOW(), NOW(), '', ''
    );

    -- 2. Insert into auth.identities (required for email login)
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        v_user_id,
        v_user_id,
        json_build_object('sub', v_user_id::text, 'email', u_email)::jsonb,
        'email',
        v_user_id::text,
        NOW(), NOW(), NOW()
    );

    -- NOTE: user_profiles is created automatically by the
    --       on_auth_user_created trigger (handle_new_user function).
    --       No manual insert needed here.

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
    -- CLEANUP (Optional: remove if you want to keep existing data)
    -- TRUNCATE public.stock_transactions, public.sales_order_items, public.sales_orders, 
    --          public.purchase_order_items, public.purchase_orders, public.products, 
    --          public.suppliers, public.customers CASCADE;

    -- CREATE USERS
    PERFORM create_demo_user('admin@stocksms.com', 'Stocks@123', 'John Administrator', 'admin');
    PERFORM create_demo_user('clerk@stocksms.com', 'Stocks@123', 'Sarah Inventory', 'clerk');
    PERFORM create_demo_user('billing@stocksms.com', 'Stocks@123', 'Mike Accountant', 'billing');
    PERFORM create_demo_user('customer@stocksms.com', 'Stocks@123', 'Jane Customer', 'customer');
    PERFORM create_demo_user('supplier@stocksms.com', 'Stocks@123', 'Vendor Partner', 'supplier');

    -- SEED SUPPLIERS
    INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES
    ('TechSource Solutions', 'Amit Patel', 'contact@techsource.com', '+91 98765 43210', '123 Tech Park, Bangalore'),
    ('Global Stationery', 'Priya Singh', 'sales@global.com', '+91 87654 32109', '45 Main St, Mumbai'),
    ('CleanCare Ltd', 'Rajesh Kumar', 'info@cleancare.in', '+91 76543 21098', '89 Industrial Area, Chennai'),
    ('Modern Furniture', 'Sonia Gupta', 'hello@modernfur.com', '+91 65432 10987', 'Sector 5, Gurgaon'),
    ('NetConnect', 'Vikram Rao', 'vikram@netconnect.net', '+91 54321 09876', 'Hyderabad IT Hub');

    -- SEED CUSTOMERS
    INSERT INTO customers (name, email, phone, billing_address) VALUES
    ('Reliance Industries', 'procurement@reliance.com', '+91 22 12345678', 'Reliance Corporate Park, Navi Mumbai'),
    ('Wipro Ltd', 'facility.manager@wipro.com', '+91 80 87654321', 'Sarjapur Road, Bangalore'),
    ('HDFC Bank', 'admin.support@hdfc.com', '+91 22 99887766', 'Kanjurmarg East, Mumbai');

    -- SEED PRODUCTS
    INSERT INTO products (sku, name, category, description, unit, selling_price, current_stock, reorder_threshold) VALUES
    ('ELEC-USB-001', 'USB-C Cable 1m', 'Electronics', 'High-speed charging cable', 'pcs', 750, 45, 10),
    ('ELEC-KB-002', 'Wireless Keyboard', 'Electronics', 'Mechanical quiet keyboard', 'pcs', 3200, 12, 5),
    ('OFF-PAP-003', 'A4 Paper Ream', 'Stationery', '80 GSM, 500 sheets', 'ream', 450, 60, 10),
    ('OFF-PEN-004', 'Ball Pen Box', 'Stationery', 'Blue ink, smooth grip', 'box', 120, 25, 20),
    ('CLE-HAN-005', 'Hand Sanitizer', 'Cleaning', '70% Alcohol based', 'bottle', 250, 30, 10),
    ('FUR-CHR-007', 'Office Chair', 'Furniture', 'Ergonomic mesh chair', 'pcs', 8500, 8, 2),
    ('NET-ROU-008', 'Wi-Fi Router', 'Networking', 'Dual-band AC1200', 'pcs', 2800, 15, 3),
    ('NET-SWI-009', '8-Port Switch', 'Networking', '8-port Gigabit Switch', 'pcs', 1500, 5, 2);

    -- SEED SALES ORDERS (Recent)
    INSERT INTO sales_orders (order_number, customer_id, subtotal, total, status, created_by) VALUES
    ('SO-1001', (SELECT id FROM customers WHERE name='Reliance Industries'), 15000, 15000, 'PAID'::so_status, (SELECT user_id FROM user_profiles WHERE role='admin'::user_role LIMIT 1)),
    ('SO-1002', (SELECT id FROM customers WHERE name='Wipro Ltd'), 3200, 3200, 'PENDING'::so_status, (SELECT user_id FROM user_profiles WHERE role='billing'::user_role LIMIT 1));

    -- SEED STOCK TRANSACTIONS (History)
    INSERT INTO stock_transactions (product_id, type, quantity, notes, performed_by)
    SELECT id, 'STOCK_IN'::tx_type, 50, 'Baseline inventory setup',
           (SELECT user_id FROM user_profiles WHERE role='admin'::user_role LIMIT 1)
    FROM products;

    INSERT INTO stock_transactions (product_id, type, quantity, notes, performed_by)
    SELECT id, 'STOCK_OUT'::tx_type, 5, 'Initial sale dispatch',
           (SELECT user_id FROM user_profiles WHERE role='admin'::user_role LIMIT 1)
    FROM products
    LIMIT 3;

END $$;

-- Cleanup the temp function
DROP FUNCTION IF EXISTS create_demo_user;
