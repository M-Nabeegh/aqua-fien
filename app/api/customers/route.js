import { query } from '../../../lib/db'

export async function GET() {
  try {
    console.log('Fetching customers from database...')
    const result = await query(
      'SELECT * FROM v_customers_api WHERE "isActive" = true ORDER BY "createdAt" DESC'
    )
    
    console.log(`Found ${result.rows.length} customers`)
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return Response.json([], { status: 500 })
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    
    console.log('Creating customer with data:', data)
    
    // Format phone number to match the database constraint (+923xxxxxxxxx)
    let formattedPhone = data.phone || '';
    if (formattedPhone && !formattedPhone.startsWith('+92')) {
      // Remove any leading zeros and format as Pakistani number
      formattedPhone = formattedPhone.replace(/^0+/, '');
      if (formattedPhone.length >= 10) {
        formattedPhone = '+92' + formattedPhone;
      } else if (formattedPhone.length >= 7) {
        // Assume it's a mobile number, add 300 prefix
        formattedPhone = '+9230' + formattedPhone;
      }
    }
    
    const result = await query(
      `INSERT INTO customers (
        name, cnic, phone, address, joining_date, opening_bottles, 
        is_active, created_at, updated_at, tenant_id
      )
      VALUES (
        $1, NULL, $2, $3, $4, $5, 
        true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1
      )
      RETURNING 
        id, name, phone, address, joining_date, 
        opening_bottles, is_active, created_at, updated_at`,
      [
        data.name, 
        formattedPhone, 
        data.address || '', 
        data.joiningDate || new Date().toISOString().split('T')[0], 
        parseInt(data.openingBottles) || 0
      ]
    )
    
    console.log('Customer created successfully:', result.rows[0])
    return Response.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return Response.json({ error: 'Failed to create customer', details: error.message }, { status: 500 })
  }
}
