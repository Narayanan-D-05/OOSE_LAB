-- =========================================================
-- STEP 1: RUN THIS FIRST in Supabase SQL Editor
-- Adds missing columns to the existing products table
-- =========================================================

-- Add 'description' column if it doesn't exist
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS description TEXT;

-- Add 'current_stock' column if it doesn't exist
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS current_stock INTEGER NOT NULL DEFAULT 0;

-- Add 'supplier_id' column if it doesn't exist
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

-- Rename 'unit' -> keep as is (schema already uses 'unit')
-- Rename 'selling_price' -> keep as is (schema already uses 'selling_price')
-- Rename 'reorder_threshold' -> keep as is (schema already uses 'reorder_threshold')

-- Verify what columns exist now:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
ORDER BY ordinal_position;
