import { query } from '../../../lib/db'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Simple test query
    const result = await query('SELECT NOW() as current_time, version() as db_version')
    
    console.log('Database test successful:', result.rows[0])
    
    return Response.json({
      success: true,
      message: 'Database connection successful',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database connection failed:', error)
    
    return Response.json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
