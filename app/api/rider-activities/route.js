import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'

// GET all rider activities
export async function GET() {
  try {
    const result = await query('SELECT * FROM v_rider_activities_api WHERE "isActive" = true ORDER BY "activityDate" DESC, "createdAt" DESC')
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching rider activities:', error)
    return NextResponse.json({ error: 'Failed to fetch rider activities' }, { status: 500 })
  }
}

// POST new rider activity
export async function POST(request) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { date, employeeId, salesmanRepresentative, emptyBottlesReceived, filledBottlesSent, filledProductBoughtBack } = body
    
    if (!date || (!employeeId && !salesmanRepresentative) || emptyBottlesReceived === undefined || filledBottlesSent === undefined || filledProductBoughtBack === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let finalEmployeeId = employeeId
    
    // If employeeId not provided but salesmanRepresentative name is, find the employee
    if (!employeeId && salesmanRepresentative) {
      const employeeResult = await query(
        'SELECT id FROM employees WHERE name = $1 AND is_active = true',
        [salesmanRepresentative]
      )
      
      if (employeeResult.rowCount === 0) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }
      
      finalEmployeeId = employeeResult.rows[0].id
    }

    // Validate employee exists
    const employeeCheck = await query(
      'SELECT id, name FROM employees WHERE id = $1 AND is_active = true',
      [parseInt(finalEmployeeId)]
    )
    
    if (employeeCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Create new rider activity
    const result = await query(
      `INSERT INTO rider_activities (employee_id, activity_date, empty_bottles_received, 
                                     filled_bottles_sent, filled_product_bought_back, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, activity_date as date, empty_bottles_received as "emptyBottlesReceived",
                 filled_bottles_sent as "filledBottlesSent", 
                 filled_product_bought_back as "filledProductBoughtBack",
                 notes, created_at as "createdAt"`,
      [
        parseInt(finalEmployeeId),
        new Date(date),
        parseInt(emptyBottlesReceived) || 0,
        parseInt(filledBottlesSent) || 0,
        parseInt(filledProductBoughtBack) || 0,
        body.notes || ''
      ]
    )

    // Return complete data with employee name
    const responseData = {
      ...result.rows[0],
      salesmanRepresentative: employeeCheck.rows[0].name,
      employeeId: finalEmployeeId
    }
    
    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error('Error creating rider activity:', error)
    return NextResponse.json({ error: 'Failed to create rider activity' }, { status: 500 })
  }
}
