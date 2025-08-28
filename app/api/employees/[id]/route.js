import { query } from '../../../../lib/db'

export async function GET(request, { params }) {
  try {
    const { id } = params
    console.log('Fetching employee with ID:', id)
    
    const result = await query('SELECT * FROM v_employees_api WHERE id = $1 AND "isActive" = true', [id])
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Employee not found' }, { status: 404 })
    }
    
    console.log('Found employee:', result.rows[0])
    return Response.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching employee:', error)
    return Response.json({ error: 'Failed to fetch employee' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const data = await request.json()
    
    console.log('Updating employee with ID:', id, 'Data:', JSON.stringify(data, null, 2))
    
    // Validate required fields
    if (!data.name) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }
    
    // Format phone number to match the database constraint (+923xxxxxxxxx)
    let formattedPhone = data.phone || '';
    
    // If phone is provided, validate and format it
    if (formattedPhone) {
      // Remove any spaces, dashes, and non-digit characters except +
      formattedPhone = formattedPhone.replace(/[^\d+]/g, '');
      
      if (!formattedPhone.startsWith('+92')) {
        // Remove any leading zeros
        formattedPhone = formattedPhone.replace(/^0+/, '');
        
        // Validate minimum length for Pakistani phone numbers
        if (formattedPhone.length >= 10 && formattedPhone.length <= 11) {
          formattedPhone = '+92' + formattedPhone;
        } else if (formattedPhone.length >= 7 && formattedPhone.length <= 9) {
          // Assume it's a mobile number, add 300 prefix for common mobile format
          formattedPhone = '+9230' + formattedPhone;
        } else if (formattedPhone.length < 7) {
          // Phone number too short, set to null to avoid constraint violation
          console.warn('Phone number too short, setting to null:', formattedPhone);
          formattedPhone = null;
        } else {
          // Phone number too long, set to null to avoid constraint violation
          console.warn('Phone number too long, setting to null:', formattedPhone);
          formattedPhone = null;
        }
      } else {
        // Already has +92 prefix, validate length
        if (formattedPhone.length < 13 || formattedPhone.length > 14) {
          console.warn('Invalid +92 phone number format, setting to null:', formattedPhone);
          formattedPhone = null;
        }
      }
    } else {
      // No phone provided, set to null
      formattedPhone = null;
    }
    
    // Format employee type to lowercase to match enum values
    const employeeType = (data.employeeType || 'worker').toLowerCase();
    
    // Format CNIC to ensure it's a 13-digit string
    let formattedCnic = data.cnic ? String(data.cnic).padStart(13, '0') : '';
    
    // Parse salary
    const salary = parseFloat(data.salary) || 0;
    
    // Parse joining date
    const joiningDate = data.joiningDate;
    
    const result = await query(
      `UPDATE employees 
       SET name = $1, cnic = $2, phone = $3, employee_type = $4, monthly_salary = $5, 
           joining_date = $6, address = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND deleted_at IS NULL
       RETURNING id, name, cnic, phone, employee_type, monthly_salary, joining_date, address, is_active, created_at, updated_at`,
      [data.name, formattedCnic || null, formattedPhone, employeeType, salary, joiningDate, data.address || null, id]
    )
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Employee not found' }, { status: 404 })
    }
    
    console.log('Employee updated successfully:', result.rows[0])
    return Response.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error updating employee:', error)
    
    // Handle specific database constraint errors
    if (error.code === '23514') {
      if (error.constraint === 'phone_dom_check') {
        return Response.json({ 
          error: 'Invalid phone number format. Please provide a valid Pakistani phone number (e.g., +923001234567).' 
        }, { status: 400 })
      }
    }
    
    if (error.code === '23505') {
      if (error.constraint === 'uq_employees_name_per_tenant') {
        return Response.json({ 
          error: 'An employee with this name already exists.' 
        }, { status: 400 })
      }
    }
    
    return Response.json({ error: 'Failed to update employee', details: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    console.log('Deleting employee with ID:', id)
    
    // Soft delete - set deleted_at timestamp and is_active to false
    const result = await query(
      `UPDATE employees 
       SET deleted_at = CURRENT_TIMESTAMP, is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, name`,
      [id]
    )
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Employee not found' }, { status: 404 })
    }
    
    console.log('Employee deleted successfully:', result.rows[0])
    return Response.json({ success: true, message: 'Employee deleted successfully' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return Response.json({ error: 'Failed to delete employee', details: error.message }, { status: 500 })
  }
}
