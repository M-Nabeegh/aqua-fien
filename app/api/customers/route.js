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
    
    // Validate and format phone number for 11-digit Pakistani numbers
    let formattedPhone = data.phone || '';
    
    // If phone is provided, validate it
    if (formattedPhone) {
      // Remove any spaces, dashes, and non-digit characters
      formattedPhone = formattedPhone.replace(/[^\d]/g, '');
      
      // Validate: must be exactly 11 digits starting with 0
      if (formattedPhone.length === 11 && formattedPhone.startsWith('0')) {
        // Convert to +92 format for database storage (remove leading 0, add +92)
        formattedPhone = '+92' + formattedPhone.substring(1);
      } else {
        // Invalid phone number format
        console.warn('Invalid phone number format, setting to null:', formattedPhone);
        formattedPhone = null;
      }
    } else {
      // No phone provided, set to null
      formattedPhone = null;
    }
    
    const result = await query(
      `INSERT INTO customers (
        name, cnic, phone, address, joining_date, opening_bottles, 
        security_deposit, assigned_rider_id, is_active, created_at, updated_at, tenant_id
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, 
        $7, $8, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1
      )
      RETURNING 
        id, name, cnic, phone, address, joining_date, 
        opening_bottles, security_deposit, assigned_rider_id, is_active, created_at, updated_at`,
      [
        data.name, 
        data.cnic || null,
        formattedPhone, 
        data.address || '', 
        data.joiningDate || new Date().toISOString().split('T')[0], 
        parseInt(data.openingBottles) || 0,
        parseFloat(data.securityDeposit) || 0,
        data.assignedRiderId ? parseInt(data.assignedRiderId) : null
      ]
    )
    
    const customer = result.rows[0]
    console.log('Customer created successfully:', customer)
    
    // Handle custom pricing if provided
    if (data.customPricing && typeof data.customPricing === 'object') {
      console.log('Processing custom pricing:', data.customPricing)
      
      for (const [productId, customPrice] of Object.entries(data.customPricing)) {
        if (customPrice && parseFloat(customPrice) > 0) {
          try {
            await query(
              `INSERT INTO customer_pricing (
                customer_id, product_id, custom_price, 
                is_active, created_at, updated_at, tenant_id
              )
              VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)`,
              [customer.id, parseInt(productId), parseFloat(customPrice)]
            )
            console.log(`Custom pricing saved: Customer ${customer.id}, Product ${productId}, Price ${customPrice}`)
          } catch (pricingError) {
            console.error(`Failed to save custom pricing for product ${productId}:`, pricingError)
          }
        }
      }
    }
    
    return Response.json({ success: true, data: customer }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    
    // Handle specific database constraint errors
    if (error.code === '23514') {
      if (error.constraint === 'phone_dom_check') {
        return Response.json({ 
          error: 'Invalid phone number format. Please provide a valid Pakistani phone number (e.g., +923001234567).' 
        }, { status: 400 })
      }
      if (error.constraint === 'customers_opening_bottles_check') {
        return Response.json({ 
          error: 'Opening bottles must be 0 or greater.' 
        }, { status: 400 })
      }
    }
    
    if (error.code === '23505') {
      if (error.constraint === 'uq_customers_name_per_tenant' || error.constraint === 'uq_customers_tenant_name') {
        return Response.json({ 
          error: 'A customer with this name already exists.' 
        }, { status: 400 })
      }
    }
    
    return Response.json({ error: 'Failed to create customer', details: error.message }, { status: 500 })
  }
}
