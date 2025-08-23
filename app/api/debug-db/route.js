import { NextResponse } from 'next/server';
import { query } from '../../../lib/db.js';

export async function GET() {
  try {
    console.log('Testing database connection in production...');
    
    // Test basic connection
    const testResult = await query('SELECT 1 as test');
    console.log('Basic connection test result:', testResult);
    
    // Test products table access
    const productCount = await query('SELECT COUNT(*) as count FROM products');
    console.log('Product count result:', productCount);
    
    // Test the view
    const viewTest = await query('SELECT COUNT(*) as count FROM v_products_api');
    console.log('View test result:', viewTest);
    
    // Test full products query
    const products = await query('SELECT * FROM v_products_api ORDER BY "isActive" DESC, "createdAt" DESC LIMIT 3');
    console.log('Products query result:', products);
    
    return NextResponse.json({
      message: 'Database connection test successful',
      tests: {
        basicConnection: testResult,
        productCount: productCount,
        viewTest: viewTest,
        sampleProducts: products
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      error: 'Database connection failed',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
