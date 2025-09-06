import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const productId = searchParams.get('productId');

    let whereClause = '';
    let params = [];

    if (customerId && productId) {
      whereClause = 'WHERE cpbb.customer_id = $1 AND cpbb.product_id = $2';
      params = [parseInt(customerId), parseInt(productId)];
    } else if (customerId) {
      whereClause = 'WHERE cpbb.customer_id = $1';
      params = [parseInt(customerId)];
    } else if (productId) {
      whereClause = 'WHERE cpbb.product_id = $1';
      params = [parseInt(productId)];
    }

    const result = await query(`
      SELECT 
        cpbb.id,
        cpbb.customer_id as "customerId",
        c.name as "customerName",
        cpbb.product_id as "productId",
        p.name as "productName",
        cpbb.opening_bottles as "openingBottles",
        cpbb.created_at as "createdAt",
        cpbb.updated_at as "updatedAt"
      FROM customer_product_bottle_balances cpbb
      JOIN customers c ON cpbb.customer_id = c.id
      JOIN products p ON cpbb.product_id = p.id
      ${whereClause}
      ORDER BY c.name, p.name
    `, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching customer product opening bottles:', error);
    return NextResponse.json({ error: 'Failed to fetch data', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { customerId, productId, openingBottles } = data;

    if (!customerId || !productId) {
      return NextResponse.json({ error: 'Customer ID and Product ID are required' }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO customer_product_bottle_balances (customer_id, product_id, opening_bottles)
      VALUES ($1, $2, $3)
      ON CONFLICT (customer_id, product_id) 
      DO UPDATE SET 
        opening_bottles = EXCLUDED.opening_bottles,
        updated_at = now()
      RETURNING 
        id,
        customer_id as "customerId",
        product_id as "productId",
        opening_bottles as "openingBottles",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `, [parseInt(customerId), parseInt(productId), parseInt(openingBottles || 0)]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving customer product opening bottles:', error);
    return NextResponse.json({ error: 'Failed to save data', details: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { id, openingBottles } = data;

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    const result = await query(`
      UPDATE customer_product_bottle_balances 
      SET opening_bottles = $1, updated_at = now()
      WHERE id = $2
      RETURNING 
        id,
        customer_id as "customerId",
        product_id as "productId",
        opening_bottles as "openingBottles",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `, [parseInt(openingBottles || 0), parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating customer product opening bottles:', error);
    return NextResponse.json({ error: 'Failed to update data', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    const result = await query(`
      DELETE FROM customer_product_bottle_balances 
      WHERE id = $1
      RETURNING id
    `, [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer product opening bottles:', error);
    return NextResponse.json({ error: 'Failed to delete data', details: error.message }, { status: 500 });
  }
}
