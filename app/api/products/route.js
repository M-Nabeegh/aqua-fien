import { query } from '../../../lib/db'

export async function GET() {
  try {
    console.log('Fetching products from database...')
    // Get only active products for the UI
    const result = await query('SELECT * FROM v_products_api WHERE "isActive" = true ORDER BY "createdAt" DESC')
    
    console.log(`Found ${result.rows.length} active products`)
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching products:', error)
    return Response.json([], { status: 500 })
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    console.log('Creating product with data:', data)
    
    const result = await query(
      `INSERT INTO products (name, category, base_price, min_price, max_price, is_active, tenant_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        data.name,
        data.category || 'standard',
        data.basePrice || 0,
        data.minPrice || null,
        data.maxPrice || null,
        data.isActive !== false
      ]
    )
    
    return Response.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error creating product:', error)
    return Response.json({ error: 'Failed to create product', details: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const data = await request.json()
    const { id } = data
    console.log('Updating product with data:', data)
    
    const result = await query(
      `UPDATE products 
       SET name = $1, category = $2, base_price = $3, min_price = $4, max_price = $5, 
           is_active = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND tenant_id = 1
       RETURNING *`,
      [
        data.name,
        data.category || 'standard', 
        data.basePrice || 0,
        data.minPrice || null,
        data.maxPrice || null,
        data.isActive !== false,
        id
      ]
    )
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Product not found' }, { status: 404 })
    }
    
    return Response.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error updating product:', error)
    return Response.json({ error: 'Failed to update product', details: error.message }, { status: 500 })
  }
}
