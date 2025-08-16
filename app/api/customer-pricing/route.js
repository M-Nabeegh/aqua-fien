import { query } from '../../../lib/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const productId = searchParams.get('productId')
    
    let sqlQuery = `SELECT * FROM v_customer_pricing_api WHERE "isActive" = true`
    const params = []
    let paramCount = 0
    
    if (customerId) {
      paramCount++
      sqlQuery += ` AND "customerId" = $${paramCount}`
      params.push(parseInt(customerId))
    }
    
    if (productId) {
      paramCount++
      sqlQuery += ` AND "productId" = $${paramCount}`
      params.push(parseInt(productId))
    }
    
    sqlQuery += ` ORDER BY "createdAt" DESC`
    
    const result = await query(sqlQuery, params)
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching customer pricing:', error)
    return Response.json({ error: 'Failed to fetch customer pricing' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    const { customerId, productId, price } = data
    
    if (!customerId || !productId || price == null) {
      return Response.json({ error: 'customerId, productId, and price are required' }, { status: 400 })
    }
    
    // Validate customer and product exist
    const customerResult = await query(
      'SELECT id, name FROM customers WHERE id = $1 AND is_active = true',
      [parseInt(customerId)]
    )
    
    const productResult = await query(
      'SELECT id, name, base_price, min_price, max_price FROM products WHERE id = $1 AND is_active = true',
      [parseInt(productId)]
    )
    
    if (customerResult.rowCount === 0 || productResult.rowCount === 0) {
      return Response.json({ error: 'Customer or product not found' }, { status: 404 })
    }
    
    const product = productResult.rows[0]
    const customPrice = parseFloat(price)
    
    // Validate price within min/max bounds
    if (product.min_price && customPrice < product.min_price) {
      return Response.json({ 
        error: `Price cannot be below minimum price of ${product.min_price}` 
      }, { status: 400 })
    }
    
    if (product.max_price && customPrice > product.max_price) {
      return Response.json({ 
        error: `Price cannot exceed maximum price of ${product.max_price}` 
      }, { status: 400 })
    }
    
    // Check if pricing already exists and update, otherwise insert
    const existingResult = await query(
      'SELECT id FROM customer_pricing WHERE customer_id = $1 AND product_id = $2 AND is_active = true',
      [parseInt(customerId), parseInt(productId)]
    )
    
    let result
    if (existingResult.rowCount > 0) {
      // Update existing pricing
      result = await query(
        `UPDATE customer_pricing 
         SET custom_price = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE customer_id = $2 AND product_id = $3 AND is_active = true
         RETURNING id, customer_id as "customerId", product_id as "productId", 
                   custom_price as "customPrice", created_at as "createdAt",
                   updated_at as "updatedAt"`,
        [customPrice, parseInt(customerId), parseInt(productId)]
      )
    } else {
      // Insert new pricing
      result = await query(
        `INSERT INTO customer_pricing (customer_id, product_id, custom_price)
         VALUES ($1, $2, $3)
         RETURNING id, customer_id as "customerId", product_id as "productId", 
                   custom_price as "customPrice", created_at as "createdAt",
                   updated_at as "updatedAt"`,
        [parseInt(customerId), parseInt(productId), customPrice]
      )
    }
    
    // Return complete data
    const responseData = {
      ...result.rows[0],
      customerName: customerResult.rows[0].name,
      productName: productResult.rows[0].name,
      basePrice: productResult.rows[0].base_price
    }
    
    return Response.json({ success: true, data: responseData }, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating customer pricing:', error)
    return Response.json({ error: 'Invalid request data' }, { status: 400 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const productId = searchParams.get('productId')
    
    if (!customerId || !productId) {
      return Response.json({ error: 'customerId and productId are required' }, { status: 400 })
    }
    
    // Soft delete - set is_active to false
    const result = await query(
      'UPDATE customer_pricing SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE customer_id = $1 AND product_id = $2 AND is_active = true',
      [parseInt(customerId), parseInt(productId)]
    )
    
    if (result.rowCount === 0) {
      return Response.json({ error: 'Customer pricing not found' }, { status: 404 })
    }
    
    return Response.json({ success: true, message: 'Customer pricing deleted successfully' })
  } catch (error) {
    console.error('Error deleting customer pricing:', error)
    return Response.json({ error: 'Failed to delete customer pricing' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const data = await request.json()
    const { customerId, productId, price } = data
    
    if (!customerId || !productId || price == null) {
      return Response.json({ error: 'customerId, productId, and price are required' }, { status: 400 })
    }
    
    const result = await query(
      `UPDATE customer_pricing 
       SET custom_price = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE customer_id = $2 AND product_id = $3 AND is_active = true
       RETURNING id, customer_id as "customerId", product_id as "productId", 
                 custom_price as "customPrice", updated_at as "updatedAt"`,
      [parseFloat(price), parseInt(customerId), parseInt(productId)]
    )
    
    if (result.rowCount === 0) {
      return Response.json({ error: 'Customer pricing not found' }, { status: 404 })
    }
    
    return Response.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error updating customer pricing:', error)
    return Response.json({ error: 'Failed to update customer pricing' }, { status: 500 })
  }
}
