import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

// Helper function to get the correct price for a customer-product combination
async function getCustomerProductPrice(customerId, productId) {
  try {
    // First, check if there's custom pricing for this customer-product combination
    const customPricingResult = await query(
      `SELECT custom_price FROM customer_pricing 
       WHERE customer_id = $1 AND product_id = $2 AND is_active = true`,
      [parseInt(customerId), parseInt(productId)]
    );
    
    if (customPricingResult.rowCount > 0) {
      return parseFloat(customPricingResult.rows[0].custom_price);
    }
    
    // If no custom pricing, get the base price from the product
    const productResult = await query(
      `SELECT base_price FROM products WHERE id = $1 AND is_active = true`,
      [parseInt(productId)]
    );
    
    if (productResult.rowCount > 0) {
      return parseFloat(productResult.rows[0].base_price);
    }
    
    throw new Error('Product not found');
  } catch (error) {
    console.error('Error getting customer product price:', error);
    throw error;
  }
}

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
    
    // Validate required fields - note that bottleCost is now optional
    if (!data.customerId || (!data.items && (!data.productId || !data.quantity))) {
      return NextResponse.json({ error: 'Customer, product, and quantity are required' }, { status: 400 });
    }
    
    // Support both formats: items array or individual product
    let orderItems = [];
    if (data.items && Array.isArray(data.items)) {
      orderItems = data.items;
    } else if (data.productId && data.quantity) {
      orderItems = [{
        productId: data.productId,
        quantity: data.quantity,
        unitPrice: data.bottleCost // This will be overridden by custom pricing
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
    
    // Process each order item and get correct pricing
    const processedItems = [];
    for (const item of orderItems) {
      // Validate product exists and get correct price
      const productResult = await query(
        'SELECT id, name, base_price FROM products WHERE id = $1 AND is_active = true',
        [parseInt(item.productId)]
      );
      
      if (productResult.rowCount === 0) {
        return NextResponse.json({ error: `Product with ID ${item.productId} not found` }, { status: 404 });
      }
      
      // Get the correct price for this customer-product combination
      const correctPrice = await getCustomerProductPrice(data.customerId, item.productId);
      
      processedItems.push({
        productId: parseInt(item.productId),
        productName: productResult.rows[0].name,
        quantity: parseInt(item.quantity),
        unitPrice: correctPrice,
        totalPrice: correctPrice * parseInt(item.quantity)
      });
    }
    
    // Calculate total amount
    const totalAmount = processedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
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
    
    // Create order items with correct pricing
    const itemInserts = processedItems.map(item => 
      query(
        `INSERT INTO sell_order_items (sell_order_id, product_id, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, quantity, unit_price as "bottleCost", total_price as "itemTotal"`,
        [
          orderId,
          item.productId,
          item.quantity,
          item.unitPrice,
          item.totalPrice
        ]
      )
    );
    
    const itemResults = await Promise.all(itemInserts);
    
    // Return data in expected format
    const responseData = {
      id: orderId,
      customerName: customerResult.rows[0].name,
      productName: processedItems.length > 1 ? 'Multiple Products' : processedItems[0].productName,
      bottleCost: processedItems[0].unitPrice,
      quantity: processedItems.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: totalAmount,
      billDate: orderResult.rows[0].billDate,
      salesmanAppointed: data.salesmanAppointed || 'Unassigned',
      createdAt: orderResult.rows[0].createdAt,
      status: orderResult.rows[0].status,
      items: processedItems // Include detailed item information
    };
    
    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Error creating sell order:', error);
    return NextResponse.json({ error: 'Failed to create sell order', details: error.message }, { status: 500 });
  }
}