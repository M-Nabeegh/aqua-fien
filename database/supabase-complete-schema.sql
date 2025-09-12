-- Complete Supabase Schema Setup
-- This script creates all necessary tables, views, and functions for AquaFine
-- Run this in your Supabase SQL Editor

-- 1. Add empty_bottles_collected column to sell_orders if it doesn't exist
ALTER TABLE sell_orders 
ADD COLUMN IF NOT EXISTS empty_bottles_collected INTEGER DEFAULT 0 CHECK (empty_bottles_collected >= 0);

-- 2. Create customer_product_bottle_balances table for product-wise tracking
CREATE TABLE IF NOT EXISTS customer_product_bottle_balances (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    opening_bottles INTEGER DEFAULT 0 NOT NULL CHECK (opening_bottles >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(customer_id, product_id)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_product_bottle_balances_customer_id 
ON customer_product_bottle_balances(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_product_bottle_balances_product_id 
ON customer_product_bottle_balances(product_id);

-- 4. Create the product-wise bottle balance view
CREATE OR REPLACE VIEW v_customer_product_bottle_balances AS
SELECT 
    cpbb.id,
    cpbb.customer_id as "customerId",
    cpbb.product_id as "productId",
    c.name as "customerName",
    p.name as "productName",
    cpbb.opening_bottles as "openingBottles",
    COALESCE(delivered.total_delivered, 0) as "totalDelivered",
    COALESCE(collected.total_collected, 0) as "totalCollected",
    (cpbb.opening_bottles + COALESCE(delivered.total_delivered, 0) - COALESCE(collected.total_collected, 0)) as "currentBalance",
    cpbb.created_at as "createdAt",
    cpbb.updated_at as "updatedAt"
FROM customer_product_bottle_balances cpbb
LEFT JOIN customers c ON cpbb.customer_id = c.id
LEFT JOIN products p ON cpbb.product_id = p.id
LEFT JOIN (
    SELECT 
        customer_id, 
        product_id,
        SUM(quantity) as total_delivered
    FROM sell_orders 
    WHERE is_active = true
    GROUP BY customer_id, product_id
) delivered ON cpbb.customer_id = delivered.customer_id AND cpbb.product_id = delivered.product_id
LEFT JOIN (
    SELECT 
        customer_id,
        product_id, 
        SUM(empty_bottles_collected) as total_collected
    FROM sell_orders 
    WHERE is_active = true AND empty_bottles_collected > 0
    GROUP BY customer_id, product_id
) collected ON cpbb.customer_id = collected.customer_id AND cpbb.product_id = collected.product_id
WHERE c.is_active = true AND p.is_active = true;

-- 5. Ensure v_customers_api view exists
CREATE OR REPLACE VIEW v_customers_api AS
SELECT 
    id,
    name,
    phone,
    address,
    opening_bottles as "openingBottles",
    is_active as "isActive",
    created_at as "createdAt",
    updated_at as "updatedAt"
FROM customers
WHERE is_active = true
ORDER BY created_at DESC;

-- 6. Ensure v_products_api view exists  
CREATE OR REPLACE VIEW v_products_api AS
SELECT 
    id,
    name,
    base_price as "basePrice",
    is_active as "isActive",
    created_at as "createdAt",
    updated_at as "updatedAt"
FROM products
WHERE is_active = true
ORDER BY created_at DESC;

-- 7. Ensure v_employees_api view exists
CREATE OR REPLACE VIEW v_employees_api AS
SELECT 
    id,
    name,
    phone,
    employee_type as "employeeType",
    salary,
    is_active as "isActive",
    created_at as "createdAt",
    updated_at as "updatedAt"
FROM employees
WHERE is_active = true
ORDER BY created_at DESC;

-- 8. Ensure v_sell_orders_api view exists
CREATE OR REPLACE VIEW v_sell_orders_api AS
SELECT 
    so.id,
    so.customer_id as "customerId",
    so.product_id as "productId",
    c.name as "customerName",
    p.name as "productName",
    so.quantity,
    so.bottle_cost as "bottleCost",
    so.total_amount as "totalAmount",
    so.bill_date as "billDate",
    so.empty_bottles_collected as "emptyBottlesCollected",
    so.is_active as "isActive",
    so.created_at as "createdAt",
    so.updated_at as "updatedAt"
FROM sell_orders so
LEFT JOIN customers c ON so.customer_id = c.id
LEFT JOIN products p ON so.product_id = p.id
WHERE so.is_active = true
ORDER BY so.bill_date DESC, so.created_at DESC;

-- 9. Ensure v_expenditures_api view exists
CREATE OR REPLACE VIEW v_expenditures_api AS
SELECT 
    id,
    title,
    amount,
    category,
    expense_date as "expenseDate",
    description,
    is_active as "isActive",
    created_at as "createdAt",
    updated_at as "updatedAt"
FROM expenditures
WHERE is_active = true
ORDER BY expense_date DESC;

-- 10. Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Create trigger for customer_product_bottle_balances
DROP TRIGGER IF EXISTS update_customer_product_bottle_balances_updated_at ON customer_product_bottle_balances;
CREATE TRIGGER update_customer_product_bottle_balances_updated_at 
    BEFORE UPDATE ON customer_product_bottle_balances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Migrate existing opening bottles data (if any customers have opening_bottles > 0)
DO $$
DECLARE 
    customer_record RECORD;
    first_product_id BIGINT;
BEGIN
    -- Get the first active product to assign existing opening bottles to
    SELECT id INTO first_product_id 
    FROM products 
    WHERE is_active = true 
    ORDER BY id ASC 
    LIMIT 1;
    
    IF first_product_id IS NOT NULL THEN
        -- Migrate existing opening bottles to the first product
        FOR customer_record IN 
            SELECT id, opening_bottles 
            FROM customers 
            WHERE opening_bottles > 0 AND is_active = true
        LOOP
            INSERT INTO customer_product_bottle_balances (customer_id, product_id, opening_bottles)
            VALUES (customer_record.id, first_product_id, customer_record.opening_bottles)
            ON CONFLICT (customer_id, product_id) 
            DO UPDATE SET opening_bottles = EXCLUDED.opening_bottles;
        END LOOP;
        
        RAISE NOTICE 'Migrated existing opening bottles to product ID %', first_product_id;
    ELSE
        RAISE NOTICE 'No active products found. Please create products first.';
    END IF;
END $$;

-- 13. Add some helpful comments
COMMENT ON TABLE customer_product_bottle_balances IS 'Tracks opening bottle balances per customer per product';
COMMENT ON VIEW v_customer_product_bottle_balances IS 'API view for customer product bottle balances with calculated totals';
COMMENT ON VIEW v_customers_api IS 'API view for customers with camelCase columns';
COMMENT ON VIEW v_products_api IS 'API view for products with camelCase columns';

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Supabase schema setup complete!';
    RAISE NOTICE '📋 Features enabled:';
    RAISE NOTICE '   - Product-wise bottle tracking';
    RAISE NOTICE '   - Customer product bottle balances';
    RAISE NOTICE '   - All API views with camelCase columns';
    RAISE NOTICE '   - Empty bottles collection tracking';
    RAISE NOTICE '🚀 Your AquaFine system is ready!';
END $$;
