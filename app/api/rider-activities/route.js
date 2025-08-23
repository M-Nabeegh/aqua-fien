import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'

// Function to calculate rider accountability for a specific product
async function calculateRiderAccountability(riderId, productId) {
  try {
    // Get total filled bottles sent for this rider and product from rider_activities
    const filledBottlesSentResult = await query(`
      SELECT COALESCE(SUM(filled_bottles_sent), 0) as total_sent
      FROM rider_activities 
      WHERE employee_id = $1 AND product_id = $2 AND is_active = true
    `, [riderId, productId])
    
    const totalFilledBottlesSent = parseInt(filledBottlesSentResult.rows[0].total_sent) || 0
    
    // Get total bottles sold by this rider for this product from sell_orders
    const bottlesSoldResult = await query(`
      SELECT COALESCE(SUM(soi.quantity), 0) as total_sold
      FROM sell_orders so
      JOIN sell_order_items soi ON so.id = soi.sell_order_id
      WHERE so.rider_id = $1 AND soi.product_id = $2 AND so.is_active = true
    `, [riderId, productId])
    
    const totalBottlesSold = parseInt(bottlesSoldResult.rows[0].total_sold) || 0
    
    // Calculate accountability: filled bottles sent - bottles sold = bottles remaining with rider
    const bottlesRemaining = totalFilledBottlesSent - totalBottlesSold
    
    return {
      riderId,
      productId,
      totalFilledBottlesSent,
      totalBottlesSold,
      bottlesRemaining,
      accountabilityStatus: bottlesRemaining === 0 ? 'Clear' : bottlesRemaining > 0 ? 'Has Stock' : 'Deficit'
    }
  } catch (error) {
    console.error('Error calculating rider accountability:', error)
    throw error
  }
}

// GET all rider activities
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const calculateAccountability = searchParams.get('accountability') === 'true'
    const riderId = searchParams.get('riderId')
    const productId = searchParams.get('productId')
    
    // If accountability calculation is requested
    if (calculateAccountability && riderId && productId) {
      const accountability = await calculateRiderAccountability(riderId, productId)
      return NextResponse.json(accountability)
    }
    
    // Default: Get all rider activities
    const result = await query(`
      SELECT 
        ra.id,
        ra.activity_date as date,
        ra.employee_id as "employeeId",
        e.name as "salesmanRepresentative",
        ra.product_id as "productId",
        p.name as "productName",
        ra.empty_bottles_received as "emptyBottlesReceived",
        ra.filled_bottles_sent as "filledBottlesSent", 
        ra.filled_product_bought_back as "filledProductBoughtBack",
        ra.notes,
        ra.created_at as "createdAt"
      FROM rider_activities ra
      JOIN employees e ON ra.employee_id = e.id
      LEFT JOIN products p ON ra.product_id = p.id
      WHERE ra.is_active = true 
      ORDER BY ra.activity_date DESC, ra.created_at DESC
    `)
    
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
    const { date, employeeId, productId, salesmanRepresentative, emptyBottlesReceived, filledBottlesSent, filledProductBoughtBack } = body
    
    if (!date || (!employeeId && !salesmanRepresentative) || !productId || emptyBottlesReceived === undefined || filledBottlesSent === undefined || filledProductBoughtBack === undefined) {
      return NextResponse.json({ error: 'Missing required fields including product selection' }, { status: 400 })
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
      `INSERT INTO rider_activities (employee_id, product_id, activity_date, empty_bottles_received, 
                                     filled_bottles_sent, filled_product_bought_back, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, activity_date as date, empty_bottles_received as "emptyBottlesReceived",
                 filled_bottles_sent as "filledBottlesSent", 
                 filled_product_bought_back as "filledProductBoughtBack",
                 notes, created_at as "createdAt"`,
      [
        parseInt(finalEmployeeId),
        parseInt(productId),
        new Date(date),
        parseInt(emptyBottlesReceived) || 0,
        parseInt(filledBottlesSent) || 0,
        parseInt(filledProductBoughtBack) || 0,
        body.notes || ''
      ]
    )

    // Return complete data with employee name and accountability
    const responseData = {
      ...result.rows[0],
      salesmanRepresentative: employeeCheck.rows[0].name,
      employeeId: finalEmployeeId,
      productId: parseInt(productId)
    }
    
    // Calculate and include accountability information
    try {
      const accountability = await calculateRiderAccountability(finalEmployeeId, productId)
      responseData.accountability = accountability
    } catch (accountabilityError) {
      console.error('Error calculating accountability:', accountabilityError)
      // Don't fail the whole request if accountability calculation fails
      responseData.accountability = { error: 'Failed to calculate accountability' }
    }
    
    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error('Error creating rider activity:', error)
    return NextResponse.json({ error: 'Failed to create rider activity' }, { status: 500 })
  }
}
