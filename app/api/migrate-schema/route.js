import { query } from '../../../lib/db'

export async function POST() {
  try {
    console.log('🚀 Starting Supabase schema migration...')
    
    const results = []
    
    // 1. Add empty_bottles_collected column to sell_orders if it doesn't exist
    try {
      await query(`
        ALTER TABLE sell_orders 
        ADD COLUMN IF NOT EXISTS empty_bottles_collected INTEGER DEFAULT 0 CHECK (empty_bottles_collected >= 0)
      `)
      results.push('✅ Added empty_bottles_collected column to sell_orders')
    } catch (error) {
      results.push(`⚠️ Empty bottles column: ${error.message}`)
    }

    // 2. Create customer_product_bottle_balances table
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS customer_product_bottle_balances (
          id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          opening_bottles INTEGER DEFAULT 0 NOT NULL CHECK (opening_bottles >= 0),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          UNIQUE(customer_id, product_id)
        )
      `)
      results.push('✅ Created customer_product_bottle_balances table')
    } catch (error) {
      results.push(`⚠️ Bottle balances table: ${error.message}`)
    }

    // 3. Create indexes
    try {
      await query(`
        CREATE INDEX IF NOT EXISTS idx_customer_product_bottle_balances_customer_id 
        ON customer_product_bottle_balances(customer_id)
      `)
      await query(`
        CREATE INDEX IF NOT EXISTS idx_customer_product_bottle_balances_product_id 
        ON customer_product_bottle_balances(product_id)
      `)
      results.push('✅ Created performance indexes')
    } catch (error) {
      results.push(`⚠️ Indexes: ${error.message}`)
    }

    // 4. Create the bottle balance view
    try {
      await query(`
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
        WHERE c.is_active = true AND p.is_active = true
      `)
      results.push('✅ Created v_customer_product_bottle_balances view')
    } catch (error) {
      results.push(`⚠️ Bottle balance view: ${error.message}`)
    }

    // 5. Migrate existing opening bottles data
    try {
      const migrationResult = await query(`
        INSERT INTO customer_product_bottle_balances (customer_id, product_id, opening_bottles)
        SELECT 
          c.id as customer_id,
          p.id as product_id,
          c.opening_bottles
        FROM customers c
        CROSS JOIN (SELECT id FROM products WHERE is_active = true ORDER BY id ASC LIMIT 1) p
        WHERE c.opening_bottles > 0 AND c.is_active = true
        ON CONFLICT (customer_id, product_id) 
        DO UPDATE SET opening_bottles = EXCLUDED.opening_bottles
      `)
      results.push(`✅ Migrated ${migrationResult.rowCount} customer opening bottles`)
    } catch (error) {
      results.push(`⚠️ Opening bottles migration: ${error.message}`)
    }

    return Response.json({
      success: true,
      message: 'Schema migration completed',
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return Response.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
