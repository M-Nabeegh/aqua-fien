-- Product-wise Bottle Tracking Migration Script
-- Run this SQL script in your database to add product-specific bottle tracking

-- 1. Create customer_product_bottle_balances table
CREATE TABLE IF NOT EXISTS customer_product_bottle_balances (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    opening_bottles INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id INTEGER DEFAULT 1,
    UNIQUE(customer_id, product_id, tenant_id)
);

-- 2. Create view for customer product bottle balances API
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
WHERE cpbb.tenant_id = 1;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_product_bottle_balances_customer_id ON customer_product_bottle_balances(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_product_bottle_balances_product_id ON customer_product_bottle_balances(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_product_bottle_balances_tenant_id ON customer_product_bottle_balances(tenant_id);

-- 4. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_product_bottle_balances_updated_at 
    BEFORE UPDATE ON customer_product_bottle_balances 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Insert initial records for existing customers and products
-- This creates a record for each customer-product combination
INSERT INTO customer_product_bottle_balances (customer_id, product_id, opening_bottles, tenant_id)
SELECT 
    c.id as customer_id,
    p.id as product_id,
    c.opening_bottles as opening_bottles,
    1 as tenant_id
FROM customers c
CROSS JOIN products p
WHERE c.is_active = true AND p.is_active = true
ON CONFLICT (customer_id, product_id, tenant_id) DO NOTHING;

-- 6. Grant permissions (adjust as needed for your user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON customer_product_bottle_balances TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE customer_product_bottle_balances_id_seq TO your_app_user;

COMMENT ON TABLE customer_product_bottle_balances IS 'Tracks bottle balances per customer per product';
COMMENT ON VIEW v_customer_product_bottle_balances IS 'API view for customer product bottle balances with calculated totals';
