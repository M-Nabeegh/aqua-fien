import { query } from '../../../lib/db'

export async function GET() {
  try {
    // Get both customer and employee advances using database views
    const customerAdvances = await query(
      `SELECT id, 'customer' as type, amount, "advanceDate" as date, notes as description, 'active' as status, "createdAt",
              "customerId" as "entityId", "customerName" as "entityName", '' as "entityPhone"
       FROM v_customer_advances_api WHERE "isActive" = true`
    )
    
    const employeeAdvances = await query(
      `SELECT id, 'employee' as type, amount, "advanceDate" as date, notes as description, 'active' as status, "createdAt",
              "employeeId" as "entityId", "employeeName" as "entityName", '' as "entityPhone"
       FROM v_employee_advances_api WHERE "isActive" = true`
    )
    
    // Combine and sort by date
    const allAdvances = [...customerAdvances.rows, ...employeeAdvances.rows]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    
    return Response.json(allAdvances)
  } catch (error) {
    console.error('Error fetching advances:', error)
    return Response.json({ error: 'Failed to fetch advances' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    const { type, entityId, amount, description, date } = data
    
    if (!type || !entityId || !amount) {
      return Response.json({ error: 'Type, entity ID, and amount are required' }, { status: 400 })
    }
    
    let result
    if (type === 'customer') {
      // Validate customer exists
      const customerCheck = await query(
        'SELECT id, name FROM customers WHERE id = $1 AND is_active = true',
        [parseInt(entityId)]
      )
      
      if (customerCheck.rowCount === 0) {
        return Response.json({ error: 'Customer not found' }, { status: 404 })
      }
      
      result = await query(
        `INSERT INTO customer_advances (customer_id, amount, advance_date, description, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, amount, advance_date as date, description, status, created_at as "createdAt"`,
        [parseInt(entityId), parseFloat(amount), date ? new Date(date) : new Date(), description || '', 'pending']
      )
      
      result.rows[0].type = 'customer'
      result.rows[0].entityName = customerCheck.rows[0].name
      
    } else if (type === 'employee') {
      // Validate employee exists
      const employeeCheck = await query(
        'SELECT id, name FROM employees WHERE id = $1 AND is_active = true',
        [parseInt(entityId)]
      )
      
      if (employeeCheck.rowCount === 0) {
        return Response.json({ error: 'Employee not found' }, { status: 404 })
      }
      
      result = await query(
        `INSERT INTO employee_advances (employee_id, amount, advance_date, description, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, amount, advance_date as date, description, status, created_at as "createdAt"`,
        [parseInt(entityId), parseFloat(amount), date ? new Date(date) : new Date(), description || '', 'pending']
      )
      
      result.rows[0].type = 'employee'
      result.rows[0].entityName = employeeCheck.rows[0].name
      
    } else {
      return Response.json({ error: 'Invalid advance type. Must be "customer" or "employee"' }, { status: 400 })
    }
    
    return Response.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error creating advance:', error)
    return Response.json({ error: 'Invalid request data' }, { status: 400 })
  }
}
