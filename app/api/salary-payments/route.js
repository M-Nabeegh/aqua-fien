import { query } from '../../../lib/db'

// GET /api/salary-payments - Fetch all salary payments
export async function GET() {
  try {
    console.log('Fetching salary payments from database...')
    
    const result = await query(`
      SELECT 
        sp.id,
        sp.employee_id as "employeeId",
        e.name as "employeeName",
        e.employee_type as "employeeType", 
        sp.amount,
        sp.payment_date as "paymentDate",
        sp.month_year as "monthYear",
        sp.notes,
        sp.created_at as "createdAt"
      FROM salary_payments sp
      JOIN employees e ON sp.employee_id = e.id
      WHERE sp.is_active = true 
      ORDER BY sp.payment_date DESC, sp.created_at DESC
    `)
    
    console.log(`Found ${result.rows.length} salary payments`)
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching salary payments:', error)
    return Response.json({ error: 'Failed to fetch salary payments' }, { status: 500 })
  }
}

// POST /api/salary-payments - Create new salary payment
export async function POST(request) {
  try {
    const data = await request.json()
    console.log('Creating salary payment:', data)

    // Validate required fields
    if (!data.employeeId || !data.amount || !data.paymentDate || !data.monthYear) {
      return Response.json({ 
        error: 'Missing required fields: employeeId, amount, paymentDate, monthYear' 
      }, { status: 400 })
    }

    // Parse and validate amount
    const amount = parseFloat(data.amount)
    if (isNaN(amount) || amount <= 0) {
      return Response.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    // Validate date format
    const paymentDate = new Date(data.paymentDate)
    if (isNaN(paymentDate.getTime())) {
      return Response.json({ error: 'Invalid payment date format' }, { status: 400 })
    }

    // Check if salary payment already exists for this employee and month
    const existingPayment = await query(`
      SELECT id FROM salary_payments 
      WHERE employee_id = $1 AND month_year = $2 AND is_active = true
    `, [data.employeeId, data.monthYear])

    if (existingPayment.rows.length > 0) {
      return Response.json({ 
        error: `Salary payment already exists for this employee in ${data.monthYear}` 
      }, { status: 409 })
    }

    // Create salary payment
    const result = await query(`
      INSERT INTO salary_payments (employee_id, amount, payment_date, month_year, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, employee_id, amount, payment_date, month_year, notes, created_at
    `, [
      data.employeeId,
      amount,
      data.paymentDate,
      data.monthYear,
      data.notes || null
    ])

    console.log('Salary payment created successfully:', result.rows[0])
    return Response.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating salary payment:', error)
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return Response.json({ 
        error: 'Salary payment already exists for this employee and month' 
      }, { status: 409 })
    }
    
    return Response.json({ 
      error: 'Failed to create salary payment',
      details: error.message 
    }, { status: 500 })
  }
}

// DELETE /api/salary-payments - Soft delete salary payment
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return Response.json({ error: 'Salary payment ID is required' }, { status: 400 })
    }

    const result = await query(`
      UPDATE salary_payments 
      SET is_active = false, updated_at = now()
      WHERE id = $1 AND is_active = true
      RETURNING id
    `, [id])

    if (result.rows.length === 0) {
      return Response.json({ error: 'Salary payment not found' }, { status: 404 })
    }

    return Response.json({ message: 'Salary payment deleted successfully' })
  } catch (error) {
    console.error('Error deleting salary payment:', error)
    return Response.json({ 
      error: 'Failed to delete salary payment',
      details: error.message 
    }, { status: 500 })
  }
}
