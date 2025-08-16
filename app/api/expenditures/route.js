import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function GET() {
  try {
    const result = await query('SELECT * FROM v_expenditures_api ORDER BY "expenseDate" DESC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching expenditures:', error);
    return NextResponse.json({ error: 'Failed to fetch expenditures' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { expenseDate, category, amount, description, employeeId } = data;

    // Validate required fields
    if (!expenseDate || !category || !amount) {
      return NextResponse.json({ 
        error: 'Missing required fields: expenseDate, category, amount' 
      }, { status: 400 });
    }

    // Validate category against allowed enum values
    const validCategories = ['transportation', 'administrative', 'maintenance', 'utilities', 'other'];
    if (!validCategories.includes(category.toLowerCase())) {
      return NextResponse.json({ 
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
      }, { status: 400 });
    }

    // Validate amount is a positive number
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return NextResponse.json({ 
        error: 'Amount must be a positive number' 
      }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO expenditures (expense_date, category, amount, description, employee_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [expenseDate, category.toLowerCase(), parseFloat(amount), description || null, employeeId || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating expenditure:', error);
    
    // Handle specific database errors
    if (error.message.includes('invalid input value for enum')) {
      return NextResponse.json({ 
        error: 'Invalid category. Must be one of: transportation, administrative, maintenance, utilities, other' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create expenditure: ' + error.message 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { id, expenseDate, category, amount, description, employeeId } = data;

    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCounter = 1;

    if (expenseDate !== undefined) {
      updates.push(`expense_date = $${paramCounter++}`);
      values.push(expenseDate);
    }
    
    if (category !== undefined) {
      const validCategories = ['transportation', 'administrative', 'maintenance', 'utilities', 'other'];
      if (!validCategories.includes(category.toLowerCase())) {
        return NextResponse.json({ 
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
        }, { status: 400 });
      }
      updates.push(`category = $${paramCounter++}`);
      values.push(category.toLowerCase());
    }
    
    if (amount !== undefined) {
      if (isNaN(amount) || parseFloat(amount) <= 0) {
        return NextResponse.json({ 
          error: 'Amount must be a positive number' 
        }, { status: 400 });
      }
      updates.push(`amount = $${paramCounter++}`);
      values.push(parseFloat(amount));
    }
    
    if (description !== undefined) {
      updates.push(`description = $${paramCounter++}`);
      values.push(description);
    }
    
    if (employeeId !== undefined) {
      updates.push(`employee_id = $${paramCounter++}`);
      values.push(employeeId);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`);
    values.push(id);

    const updateQuery = `
      UPDATE expenditures 
      SET ${updates.join(', ')}
      WHERE id = $${paramCounter} AND is_active = true
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Expenditure not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating expenditure:', error);
    return NextResponse.json({ 
      error: 'Failed to update expenditure: ' + error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing required parameter: id' }, { status: 400 });
    }

    const result = await query(
      'UPDATE expenditures SET is_active = false, deleted_at = NOW() WHERE id = $1 AND is_active = true RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Expenditure not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Expenditure deleted successfully' });
  } catch (error) {
    console.error('Error deleting expenditure:', error);
    return NextResponse.json({ 
      error: 'Failed to delete expenditure: ' + error.message 
    }, { status: 500 });
  }
}
