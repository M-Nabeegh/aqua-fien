import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function GET() {
  try {
    console.log('Fetching sell orders from database...');
    const result = await query('SELECT * FROM v_sell_orders_api ORDER BY "billDate" DESC, "createdAt" DESC');
    
    console.log(`Returning ${result.rows.length} sell order items`);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching sell orders:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.customerId || (!data.items && (!data.productId || !data.quantity || !data.bottleCost))) {
      return NextResponse.json({ error: 'Customer and product details are required' }, { status: 400 });
    }
    
    // Support both formats: items array or individual product
    let orderItems = [];
    if (data.items && Array.isArray(data.items)) {
      orderItems = data.items;
    } else if (data.productId && data.quantity && data.bottleCost) {
      orderItems = [{
        productId: data.productId,
        quantity: data.quantity,
        unitPrice: data.bottleCost
      }];
    }
    
    // Validate customer exists
    const customerResult = await query(
      'SELECT id, name, phone, address FROM customers WHERE id = $1 AND is_active = true',
      [parseInt(data.customerId)]
    );
    
    if (customerResult.rowCount === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    // Calculate total amount
    const totalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    // Create sell order
    const orderResult = await query(
      `INSERT INTO sell_orders (customer_id, rider_id, order_date, total_amount, 
                                status, delivery_date, payment_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, order_date as "billDate", total_amount as "totalAmount",
                 status, delivery_date as "deliveryDate", payment_status as "paymentStatus",
                 notes, created_at as "createdAt"`,
      [
        parseInt(data.customerId),
        data.salesmanId ? parseInt(data.salesmanId) : null,
        data.billDate ? new Date(data.billDate) : new Date(),
        totalAmount,
        data.status || 'pending',
        data.deliveryDate ? new Date(data.deliveryDate) : null,
        data.paymentStatus || 'pending',
        data.notes || ''
      ]
    );
    
    const orderId = orderResult.rows[0].id;
    
    // Create order items
    const itemInserts = orderItems.map(item => 
      query(
        `INSERT INTO sell_order_items (sell_order_id, product_id, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, quantity, unit_price as "bottleCost", total_price as "itemTotal"`,
        [
          orderId,
          parseInt(item.productId),
          parseInt(item.quantity),
          parseFloat(item.unitPrice || item.bottleCost),
          item.quantity * (item.unitPrice || item.bottleCost)
        ]
      )
    );
    
    const itemResults = await Promise.all(itemInserts);
    
    // Return data in expected format
    const responseData = {
      id: orderId,
      customerName: customerResult.rows[0].name,
      productName: orderItems.length > 1 ? 'Multiple Products' : 'Product',
      bottleCost: orderItems[0].unitPrice || orderItems[0].bottleCost,
      quantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: totalAmount,
      billDate: orderResult.rows[0].billDate,
      salesmanAppointed: data.salesmanAppointed || 'Unassigned',
      createdAt: orderResult.rows[0].createdAt,
      status: orderResult.rows[0].status
    };
    
    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Error creating sell order:', error);
    return NextResponse.json({ error: 'Failed to create sell order', details: error.message }, { status: 500 });
  }
}
