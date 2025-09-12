import { query } from '../../../lib/db'

export async function GET() {
  try {
    console.log('Checking customers table structure...')
    
    // Test 1: Check if customers table exists and get its structure
    const tableCheck = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `)
    
    // Test 2: Count customers
    const customerCount = await query('SELECT COUNT(*) as count FROM customers')
    
    // Test 3: Get sample customers (raw table)
    const sampleCustomers = await query('SELECT * FROM customers LIMIT 5')
    
    // Test 4: Test v_customers_api view
    let viewTest = null
    try {
      viewTest = await query('SELECT * FROM v_customers_api LIMIT 5')
    } catch (error) {
      viewTest = { error: error.message }
    }
    
    return Response.json({
      success: true,
      tableStructure: tableCheck.rows,
      customerCount: customerCount.rows[0].count,
      sampleCustomers: sampleCustomers.rows,
      viewTest: viewTest?.rows || viewTest,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Customers debug error:', error)
    return Response.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
