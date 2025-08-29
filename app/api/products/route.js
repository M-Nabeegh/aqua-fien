import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function GET() {
  try {
    console.log('Fetching products from database...');
    // Show all products but order active ones first
    const result = await query('SELECT * FROM v_products_api ORDER BY "isActive" DESC, "createdAt" DESC');
    
    console.log(`Found ${result.rows.length} products`);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    console.log('Creating product with data:', data);
    
    // Validate required fields
    if (!data.name || !data.basePrice) {
      return NextResponse.json({ error: 'Name and base price are required' }, { status: 400 });
    }
    
    const result = await query(
      `INSERT INTO products (name, base_price, is_active, created_at, updated_at, tenant_id)
       VALUES ($1, $2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
       RETURNING id, name, base_price as "basePrice", 
                 is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`,
      [
        data.name,
        parseFloat(data.basePrice)
      ]
    );
    
    console.log('Product created successfully:', result.rows[0]);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product', details: error.message }, { status: 500 });
  }
}
