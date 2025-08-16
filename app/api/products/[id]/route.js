import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.basePrice) {
      return NextResponse.json({ error: 'Name and base price are required' }, { status: 400 });
    }
    
    // Ensure category is lowercase to match enum values
    const category = (data.category || 'standard').toLowerCase();
    
    const result = await query(
      `UPDATE products 
       SET name = $1, base_price = $2, category = $3, 
           min_price = $4, max_price = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND is_active = true
       RETURNING id, name, base_price as "basePrice", category, 
                 min_price as "minPrice", max_price as "maxPrice", is_active as "isActive",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [
        data.name,
        parseFloat(data.basePrice),
        category,
        data.minPrice ? parseFloat(data.minPrice) : null,
        data.maxPrice ? parseFloat(data.maxPrice) : null,
        parseInt(id)
      ]
    );
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    console.log('Deleting product with ID:', id);
    
    // Soft delete - set is_active to false
    const result = await query(
      'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_active = true',
      [parseInt(id)]
    );
    
    console.log('Delete result:', result.rowCount, 'rows affected');
    
    if (result.rowCount === 0) {
      console.log('Product not found or already deleted');
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    console.log('Product deleted successfully');
    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const result = await query(
      `SELECT id, name, base_price as "basePrice", category,
              min_price as "minPrice", max_price as "maxPrice", is_active as "isActive",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM products WHERE id = $1 AND is_active = true`,
      [parseInt(id)]
    );
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
