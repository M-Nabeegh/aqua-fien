import { query } from '../../../../lib/db'

// GET single customer by ID
export async function GET(request, { params }) {
  try {
    const { id } = params
    
    const result = await query(
      'SELECT * FROM v_customers_api WHERE id = $1 AND "isActive" = true',
      [id]
    )
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    return Response.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching customer:', error)
    return Response.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}

// UPDATE customer by ID
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const data = await request.json()
    
    console.log(`Updating customer ${id} with data:`, data)
    
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
    
    // Check if customer exists
    const existingCustomer = await query(
      'SELECT * FROM customers WHERE id = $1 AND is_active = true',
      [id]
    )
    
    if (existingCustomer.rows.length === 0) {
      return Response.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    const result = await query(
      `UPDATE customers SET 
        name = $1, 
        cnic = $2,
        phone = $3, 
        address = $4, 
        joining_date = $5, 
        opening_bottles = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND is_active = true
      RETURNING 
        id, name, cnic, phone, address, joining_date, 
        opening_bottles, is_active, created_at, updated_at`,
      [
        data.name, 
        data.cnic || null,
        formattedPhone, 
        data.address || '', 
        data.joiningDate || existingCustomer.rows[0].joining_date, 
        parseInt(data.openingBottles) || 0,
        id
      ]
    )
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Customer not found or update failed' }, { status: 404 })
    }
    
    // Handle custom pricing updates if provided
    if (data.customPricing && typeof data.customPricing === 'object') {
      console.log('Updating custom pricing:', data.customPricing)
      
      // First, deactivate all existing custom pricing for this customer
      await query(
        `UPDATE customer_pricing SET 
          is_active = false, 
          updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = $1`,
        [id]
      )
      
      // Then insert new custom pricing entries
      for (const [productId, customPrice] of Object.entries(data.customPricing)) {
        if (customPrice && customPrice > 0) {
          await query(
            `INSERT INTO customer_pricing (customer_id, product_id, custom_price, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (customer_id, product_id) 
            DO UPDATE SET 
              custom_price = EXCLUDED.custom_price,
              is_active = true,
              updated_at = CURRENT_TIMESTAMP`,
            [id, productId, customPrice]
          )
        }
      }
      
      console.log('Custom pricing updated successfully')
    }

    console.log('Customer updated successfully:', result.rows[0])
    return Response.json({ success: true, data: result.rows[0] }, { status: 200 })
  } catch (error) {
    console.error('Error updating customer:', error)
    
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
    
    return Response.json({ error: 'Failed to update customer', details: error.message }, { status: 500 })
  }
}

// DELETE (soft delete) customer by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    
    console.log(`Soft deleting customer with ID: ${id}`)
    
    // Check if customer exists
    const existingCustomer = await query(
      'SELECT * FROM customers WHERE id = $1 AND is_active = true',
      [id]
    )
    
    if (existingCustomer.rows.length === 0) {
      return Response.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    // Soft delete by setting is_active to false
    const result = await query(
      `UPDATE customers SET 
        is_active = false, 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
      RETURNING id, name, is_active, updated_at`,
      [id]
    )
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Customer not found or delete failed' }, { status: 404 })
    }
    
    console.log('Customer soft deleted successfully:', result.rows[0])
    return Response.json({ success: true, message: 'Customer deleted successfully', data: result.rows[0] }, { status: 200 })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return Response.json({ error: 'Failed to delete customer', details: error.message }, { status: 500 })
  }
}
