import { query } from '../../../lib/db'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const testResult = await query('SELECT NOW() as current_time')
    console.log('Database connection test successful:', testResult.rows[0])
    
    // Test table existence
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    const tables = tablesResult.rows.map(row => row.table_name)
    console.log('Available tables:', tables)
    
    // Test each table for data
    const tableData = {}
    for (const tableName of tables) {
      try {
        const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`)
        tableData[tableName] = parseInt(countResult.rows[0].count)
      } catch (err) {
        tableData[tableName] = `Error: ${err.message}`
      }
    }
    
    console.log('Table data counts:', tableData)
    
    return Response.json({
      success: true,
      connection: 'OK',
      currentTime: testResult.rows[0].current_time,
      availableTables: tables,
      tableCounts: tableData
    })
  } catch (error) {
    console.error('Database connection test failed:', error)
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
