import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const productId = searchParams.get('productId');

    let whereClause = '';
    let params = [];

    // Build WHERE clause based on provided parameters
    if (customerId && productId) {
      whereClause = 'WHERE "customerId" = $1 AND "productId" = $2';
      params = [parseInt(customerId), parseInt(productId)];
    } else if (customerId) {
      whereClause = 'WHERE "customerId" = $1';
      params = [parseInt(customerId)];
    } else if (productId) {
      whereClause = 'WHERE "productId" = $1';
      params = [parseInt(productId)];
    }

    // Query the product-wise bottle balance view
    const result = await query(`
      SELECT 
        "customerId",
        "customerName",
        "productId", 
        "productName",
        "openingBottles",
        "totalDelivered",
        "totalCollected",
        "currentBalance"
      FROM v_customer_product_bottle_balances
      ${whereClause}
      ORDER BY "customerName", "productName"
    `, params);

    // Convert string numbers to integers for proper display
    const formattedRows = result.rows.map(row => ({
      ...row,
      customerId: parseInt(row.customerId),
      productId: parseInt(row.productId),
      openingBottles: parseInt(row.openingBottles || 0),
      totalDelivered: parseInt(row.totalDelivered || 0),
      totalCollected: parseInt(row.totalCollected || 0),
      currentBalance: parseInt(row.currentBalance || 0)
    }));

    return NextResponse.json(formattedRows);
  } catch (error) {
    console.error('Error fetching customer bottle balance:', error);
    return NextResponse.json({ error: 'Failed to fetch customer bottle balance', details: error.message }, { status: 500 });
  }
}
