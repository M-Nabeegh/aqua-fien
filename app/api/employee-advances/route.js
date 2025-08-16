import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function GET() {
  try {
    const result = await query(
      `SELECT * FROM v_employee_advances_api WHERE "isActive" = true ORDER BY "advanceDate" DESC, "createdAt" DESC`
    );
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching employee advances:', error);
    return NextResponse.json({ error: 'Failed to fetch employee advances' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.employeeId || !data.amount) {
      return NextResponse.json({ error: 'Employee and amount are required' }, { status: 400 });
    }
    
    // Validate employee exists
    const employeeResult = await query(
      'SELECT id, name FROM employees WHERE id = $1 AND is_active = true',
      [parseInt(data.employeeId)]
    );
    
    if (employeeResult.rowCount === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    
    const insertQuery = `
      INSERT INTO employee_advances (employee_id, amount, advance_date, notes, is_active, created_at, updated_at, tenant_id)
      VALUES ($1, $2, COALESCE($3, CURRENT_DATE), COALESCE($4, ''), true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
      RETURNING id, employee_id as "employeeId", amount, advance_date as "advanceDate", notes, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const result = await query(insertQuery, [
      parseInt(data.employeeId),
      parseFloat(data.amount),
      data.date,
      data.notes || data.description || ''
    ]);
    
    // Return data with employee name for consistency
    const responseData = {
      ...result.rows[0],
      employeeName: employeeResult.rows[0].name
    };
    
    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Error creating employee advance:', error);
    return NextResponse.json({ error: 'Failed to create employee advance', details: error.message }, { status: 500 });
  }
}
