import { query } from '../../../lib/db'

export async function POST(request) {
  try {
    console.log('Activating customers...')
    
    // Get the request body
    const body = await request.json()
    const { customerIds } = body
    
    if (!customerIds || !Array.isArray(customerIds)) {
      return Response.json({ 
        success: false, 
        error: 'Please provide customerIds array',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }
    
    // Update customers to be active
    const result = await query(
      `UPDATE customers 
       SET is_active = true, updated_at = NOW() 
       WHERE id = ANY($1::bigint[])`,
      [customerIds]
    )
    
    // Get updated customers
    const updatedCustomers = await query(
      'SELECT * FROM v_customers_api WHERE id = ANY($1::bigint[])',
      [customerIds]
    )
    
    return Response.json({
      success: true,
      message: `Activated ${result.rowCount} customers`,
      updatedCustomers: updatedCustomers.rows,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Activation error:', error)
    return Response.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Return all customers regardless of active status for admin purposes
    const allCustomers = await query(
      'SELECT id, name, phone, is_active FROM customers ORDER BY created_at DESC'
    )
    
    return Response.json({
      success: true,
      customers: allCustomers.rows,
      totalCount: allCustomers.rows.length,
      activeCount: allCustomers.rows.filter(c => c.is_active).length,
      inactiveCount: allCustomers.rows.filter(c => !c.is_active).length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Get customers error:', error)
    return Response.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
