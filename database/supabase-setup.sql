-- AquaFine Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables (you'll need to copy your existing schema here)
-- Since I don't have your complete schema, you'll need to:
-- 1. Export your local schema: pg_dump -s aquafine > schema.sql
-- 2. Copy the table creation statements to this file
-- 3. Run in Supabase SQL Editor

-- Example of what you need to add:
-- Your existing tables like:
-- - customers
-- - products  
-- - employees
-- - expenditures
-- - sell_orders
-- - customer_advances
-- - employee_advances
-- - rider_activities
-- - customer_pricing

-- And your views like:
-- - v_customers_api
-- - v_products_api
-- - v_expenditures_api
-- etc.

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- etc.

-- Add your policies here if using RLS
-- CREATE POLICY "Public read access" ON customers FOR SELECT USING (true);
-- etc.
