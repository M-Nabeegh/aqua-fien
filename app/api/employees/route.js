import { query } from '../../../lib/db'

export async function GET() {
  try {
    console.log('Fetching employees from database...')
    const result = await query('SELECT * FROM v_employees_api WHERE "isActive" = true ORDER BY "createdAt" DESC')
    
    console.log(`Found ${result.rows.length} employees`)
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return Response.json([], { status: 500 })
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    
    console.log('Creating employee with data:', JSON.stringify(data, null, 2))
    
    // Validate required fields
    if (!data.name) {
      console.error('Validation failed: Name is required')
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }
    
    // Format phone number to match the database constraint (+923xxxxxxxxx)
    let formattedPhone = data.phone || '';
    if (formattedPhone && !formattedPhone.startsWith('+92')) {
      formattedPhone = formattedPhone.replace(/^0+/, '');
      if (formattedPhone.length >= 10) {
        formattedPhone = '+92' + formattedPhone;
      } else if (formattedPhone.length >= 7) {
        formattedPhone = '+9230' + formattedPhone;
      }
    }
    console.log('Formatted phone:', formattedPhone)
    
    // Format employee type to lowercase to match enum values
    const employeeType = (data.employeeType || 'worker').toLowerCase();
    console.log('Employee type (converted):', employeeType)
    
    // Format CNIC to ensure it's a 13-digit string
    let formattedCnic = data.cnic ? String(data.cnic).padStart(13, '0') : '';
    console.log('Formatted CNIC:', formattedCnic)
    
    // Parse salary
    const salary = parseFloat(data.salary) || 0;
    console.log('Parsed salary:', salary)
    
    const result = await query(
      `INSERT INTO employees (name, cnic, phone, employee_type, monthly_salary, is_active, created_at, updated_at, tenant_id)
       VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
       RETURNING id, name, cnic, phone, employee_type, monthly_salary, is_active, created_at, updated_at`,
      [data.name, formattedCnic || null, formattedPhone, employeeType, salary]
    )
    
    console.log('Employee created successfully:', result.rows[0])
    return Response.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return Response.json({ error: 'Failed to create employee', details: error.message }, { status: 500 })
  }
}
