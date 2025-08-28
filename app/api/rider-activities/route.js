import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'

// GET all rider activities with enhanced filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const riderId = searchParams.get('riderId')
    const productId = searchParams.get('productId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    let whereConditions = ['ra.is_active = true']
    let queryParams = []
    
    // Add filters
    if (riderId) {
      whereConditions.push(`ra.employee_id = $${queryParams.length + 1}`)
      queryParams.push(parseInt(riderId))
    }
    
    if (productId) {
      whereConditions.push(`ra.product_id = $${queryParams.length + 1}`)
      queryParams.push(parseInt(productId))
    }
    
    if (startDate) {
      whereConditions.push(`ra.activity_date >= $${queryParams.length + 1}`)
      queryParams.push(startDate)
    }
    
    if (endDate) {
      whereConditions.push(`ra.activity_date <= $${queryParams.length + 1}`)
      queryParams.push(endDate)
    }
    
    const whereClause = whereConditions.join(' AND ')
    
    const result = await query(`
      SELECT 
        ra.id,
        ra.activity_date as date,
        ra.employee_id,
        e.name as "salesmanRepresentative",
        ra.product_id,
        p.name as "productName",
        ra.empty_bottles_received as "emptyBottlesReceived",
        ra.filled_bottles_sent as "filledBottlesSent", 
        ra.filled_product_bought_back as "filledProductBoughtBack",
        ra.notes,
        ra.created_at as "createdAt"
      FROM rider_activities ra
      JOIN employees e ON ra.employee_id = e.id
      JOIN products p ON ra.product_id = p.id
      WHERE ${whereClause}
      ORDER BY ra.activity_date DESC, ra.created_at DESC
    `, queryParams)
    
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
    const { employeeId, productId, activityDate, emptyBottlesReceived, filledBottlesSent, filledProductBoughtBack } = body
    
    if (!employeeId || !productId || !activityDate) {
      return NextResponse.json({ 
        error: 'Missing required fields: employeeId, productId, and activityDate are required' 
      }, { status: 400 })
    }

    // Validate employee exists and is active
    const employeeCheck = await query(
      'SELECT id, name, employee_type FROM employees WHERE id = $1 AND is_active = true',
      [parseInt(employeeId)]
    )
    
    if (employeeCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Employee not found or inactive' }, { status: 404 })
    }

    // Validate product exists and is active
    const productCheck = await query(
      'SELECT id, name, category FROM products WHERE id = $1 AND is_active = true',
      [parseInt(productId)]
    )
    
    if (productCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Product not found or inactive' }, { status: 404 })
    }

    // Create new rider activity
    const result = await query(
      `INSERT INTO rider_activities (
        employee_id, 
        product_id, 
        activity_date, 
        empty_bottles_received, 
        filled_bottles_sent, 
        filled_product_bought_back, 
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id,
        activity_date as date,
        employee_id,
        product_id,
        empty_bottles_received as "emptyBottlesReceived",
        filled_bottles_sent as "filledBottlesSent", 
        filled_product_bought_back as "filledProductBoughtBack",
        notes,
        created_at as "createdAt"`,
      [
        parseInt(employeeId),
        parseInt(productId),
        new Date(activityDate),
        parseInt(emptyBottlesReceived || 0),
        parseInt(filledBottlesSent || 0),
        parseInt(filledProductBoughtBack || 0),
        body.notes || null
      ]
    )

    // Return complete data with employee and product details
    const responseData = {
      ...result.rows[0],
      salesmanRepresentative: employeeCheck.rows[0].name,
      productName: productCheck.rows[0].name
    }
    
    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error('Error creating rider activity:', error)
    return NextResponse.json({ error: 'Failed to create rider activity' }, { status: 500 })
  }
}
