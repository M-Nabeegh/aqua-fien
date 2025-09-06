import { query } from '../../../lib/db'

export async function GET() {
  try {
    console.log('Fetching riders from database...')
    const result = await query('SELECT * FROM v_employees_api WHERE "isActive" = true AND "employeeType" = \'rider\' ORDER BY "createdAt" DESC')
    
    console.log(`Found ${result.rows.length} riders`)
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching riders:', error)
    return Response.json([], { status: 500 })
  }
}
