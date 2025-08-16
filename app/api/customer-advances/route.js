import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'

export async function GET() {
  try {
    console.log('Fetching customer advances from database...')
    
    const result = await query(`
      SELECT * FROM v_customer_advances_api 
      WHERE "isActive" = true 
      ORDER BY "advanceDate" DESC, "createdAt" DESC
    `)
    
    console.log(`Found ${result.rows.length} customer advances`)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching customer advances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer advances' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    console.log('Creating customer advance with data:', data)
    
    // Validate required fields
    if (!data.customerId || !data.amount) {
      return NextResponse.json(
        { error: 'Customer ID and amount are required' },
        { status: 400 }
      )
    }

    // Validate customer exists
    const customerResult = await query(
      'SELECT id, name FROM customers WHERE id = $1 AND is_active = true',
      [parseInt(data.customerId)]
    )

    if (customerResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Insert the customer advance
    const result = await query(`
      INSERT INTO customer_advances (
        customer_id, amount, advance_date, notes, 
        is_active, created_at, updated_at, tenant_id
      )
      VALUES ($1, $2, COALESCE($3, CURRENT_DATE), COALESCE($4, ''), true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
      RETURNING 
        id, customer_id as "customerId", amount, advance_date as "advanceDate", 
        notes, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `, [
      parseInt(data.customerId),
      parseFloat(data.amount),
      data.date || data.advanceDate,
      data.notes || data.description || ''
    ])

    // Return data with customer name for consistency
    const responseData = {
      ...result.rows[0],
      customerName: customerResult.rows[0].name
    }

    console.log('Customer advance created successfully:', responseData)
    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error('Error creating customer advance:', error)
    return NextResponse.json(
      { error: 'Failed to create customer advance', details: error.message },
      { status: 500 }
    )
  }
}
