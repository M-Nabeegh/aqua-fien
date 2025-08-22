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
    console.log('Received employee advance data:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.employeeId || !data.amount) {
      console.log('Validation failed - missing required fields:', {
        employeeId: data.employeeId,
        amount: data.amount
      });
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
    
    // Insert employee advance according to the actual schema
    const insertQuery = `
      INSERT INTO employee_advances (employee_id, advance_date, amount, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING id, employee_id as "employeeId", advance_date as "advanceDate", 
                amount, notes, created_at as "createdAt"
    `;
    
    const result = await query(insertQuery, [
      parseInt(data.employeeId),
      data.advanceDate ? new Date(data.advanceDate) : new Date(),
      parseFloat(data.amount),
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
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    return NextResponse.json({ error: 'Failed to create employee advance', details: error.message }, { status: 500 });
  }
}
