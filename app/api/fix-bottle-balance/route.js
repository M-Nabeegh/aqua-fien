import { query } from '../../../lib/db'

export async function POST() {
  try {
    console.log('🔧 Fixing bottle balance table constraints...')
    
    const results = []
    
    // 1. Fix the unique constraint
    try {
      await query(`
        ALTER TABLE customer_product_bottle_balances 
        DROP CONSTRAINT IF EXISTS customer_product_bottle_balances_customer_id_product_id_key
      `)
      
      await query(`
        ALTER TABLE customer_product_bottle_balances 
        ADD CONSTRAINT customer_product_bottle_balances_unique 
        UNIQUE (customer_id, product_id)
      `)
      results.push('✅ Fixed unique constraint on customer_product_bottle_balances')
    } catch (error) {
      results.push(`⚠️ Constraint fix: ${error.message}`)
    }

    // 2. Create opening bottles for active customers and products
    try {
      const activeCustomers = await query(`
        SELECT id, opening_bottles FROM customers 
        WHERE is_active = true AND opening_bottles > 0
      `)
      
      const activeProducts = await query(`
        SELECT id FROM products 
        WHERE is_active = true 
        ORDER BY id ASC
      `)
      
      let insertCount = 0
      for (const customer of activeCustomers.rows) {
        for (const product of activeProducts.rows) {
          try {
            await query(`
              INSERT INTO customer_product_bottle_balances (customer_id, product_id, opening_bottles)
              VALUES ($1, $2, $3)
              ON CONFLICT (customer_id, product_id) 
              DO UPDATE SET opening_bottles = EXCLUDED.opening_bottles
            `, [customer.id, product.id, customer.opening_bottles])
            insertCount++
          } catch (insertError) {
            // Skip individual insert errors
          }
        }
      }
      results.push(`✅ Created ${insertCount} bottle balance records for active customers/products`)
    } catch (error) {
      results.push(`⚠️ Data creation: ${error.message}`)
    }

    // 3. Test the view
    try {
      const viewTest = await query('SELECT COUNT(*) as count FROM v_customer_product_bottle_balances')
      results.push(`✅ View now has ${viewTest.rows[0].count} records`)
    } catch (error) {
      results.push(`⚠️ View test: ${error.message}`)
    }

    return Response.json({
      success: true,
      message: 'Bottle balance fixes completed',
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Fix error:', error)
    return Response.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
