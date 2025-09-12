import { query } from '../../../lib/db'

export async function GET() {
  try {
    console.log('Checking bottle balance table...')
    
    // Check if table exists and has data
    const tableCheck = await query(`
      SELECT COUNT(*) as count 
      FROM customer_product_bottle_balances
    `)
    
    // Get sample data
    const sampleData = await query(`
      SELECT * FROM customer_product_bottle_balances 
      LIMIT 10
    `)
    
    // Test the view
    const viewData = await query(`
      SELECT * FROM v_customer_product_bottle_balances 
      LIMIT 10
    `)
    
    return Response.json({
      success: true,
      tableCount: tableCheck.rows[0].count,
      sampleData: sampleData.rows,
      viewData: viewData.rows,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Bottle balance debug error:', error)
    return Response.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
