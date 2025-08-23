export async function GET() {
  try {
    // Test database connection
    const { query } = await import('../../../lib/db')
    
    const result = await query('SELECT COUNT(*) as count FROM products')
    
    return Response.json({ 
      success: true, 
      productCount: result.rows[0].count,
      message: 'Database connected successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
