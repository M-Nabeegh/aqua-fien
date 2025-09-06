const { Pool } = require('pg');

// Database connection - using same approach as lib/db.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateToProductWiseBottles() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting migration to product-wise bottle tracking...');
    
    // Step 1: Create customer_product_bottle_balances table
    console.log('📝 Creating customer_product_bottle_balances table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_product_bottle_balances (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        customer_id bigint NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        product_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        opening_bottles integer DEFAULT 0 NOT NULL CHECK (opening_bottles >= 0),
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        UNIQUE(customer_id, product_id)
      );
    `);
    
    // Step 1.5: Add empty_bottles_collected column to sell_orders if it doesn't exist
    console.log('📝 Adding empty_bottles_collected column to sell_orders...');
    await client.query(`
      ALTER TABLE sell_orders 
      ADD COLUMN IF NOT EXISTS empty_bottles_collected integer DEFAULT 0 
      CHECK (empty_bottles_collected >= 0);
    `);
    
    // Step 2: Create index for performance
    console.log('🔍 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_customer_product_bottle_balances_customer_id 
      ON customer_product_bottle_balances(customer_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_customer_product_bottle_balances_product_id 
      ON customer_product_bottle_balances(product_id);
    `);
    
    // Step 3: Migrate existing opening_bottles data
    console.log('🔄 Migrating existing opening bottles data...');
    
    // Get all customers with opening bottles > 0
    const customersWithBottles = await client.query(`
      SELECT id, opening_bottles 
      FROM customers 
      WHERE opening_bottles > 0
    `);
    
    // Get the first active product (we'll assign all opening bottles to it)
    const firstProduct = await client.query(`
      SELECT id FROM products 
      ORDER BY id ASC 
      LIMIT 1
    `);
    
    if (firstProduct.rows.length === 0) {
      throw new Error('No active products found. Please create at least one product first.');
    }
    
    const defaultProductId = firstProduct.rows[0].id;
    console.log(`📦 Using product ID ${defaultProductId} as default for existing opening bottles`);
    
    // Insert existing opening bottles data
    for (const customer of customersWithBottles.rows) {
      await client.query(`
        INSERT INTO customer_product_bottle_balances (customer_id, product_id, opening_bottles)
        VALUES ($1, $2, $3)
        ON CONFLICT (customer_id, product_id) 
        DO UPDATE SET opening_bottles = EXCLUDED.opening_bottles
      `, [customer.id, defaultProductId, customer.opening_bottles]);
    }
    
    console.log(`✅ Migrated ${customersWithBottles.rows.length} customers' opening bottles`);
    
    // Step 4: Update the customer bottle balance view
    console.log('🔄 Updating customer bottle balance view...');
    
    // Drop existing view if it exists
    await client.query(`DROP VIEW IF EXISTS v_customer_product_bottle_balances CASCADE`);
    
    // Create new product-wise bottle balance view
    await client.query(`
      CREATE VIEW v_customer_product_bottle_balances AS
      SELECT 
        c.id as customer_id,
        c.name as customer_name,
        p.id as product_id,
        p.name as product_name,
        COALESCE(cpbb.opening_bottles, 0) as opening_bottles,
        COALESCE(SUM(so.quantity), 0) as total_delivered,
        COALESCE(SUM(so.empty_bottles_collected), 0) as total_empty_collected,
        (
          COALESCE(cpbb.opening_bottles, 0) + 
          COALESCE(SUM(so.quantity), 0) - 
          COALESCE(SUM(so.empty_bottles_collected), 0)
        ) as current_bottle_balance
      FROM customers c
      CROSS JOIN products p
      LEFT JOIN customer_product_bottle_balances cpbb ON c.id = cpbb.customer_id AND p.id = cpbb.product_id
      LEFT JOIN sell_orders so ON c.id = so.customer_id AND p.id = so.product_id
      GROUP BY c.id, c.name, p.id, p.name, cpbb.opening_bottles
      ORDER BY c.name, p.name;
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('- Created customer_product_bottle_balances table');
    console.log('- Migrated existing opening bottles data');
    console.log('- Created product-wise bottle balance view');
    console.log('- Added appropriate indexes for performance');
    console.log('');
    console.log('⚠️  Next steps:');
    console.log('1. Update APIs to use product-wise bottle tracking');
    console.log('2. Update frontend to show product-wise balances');
    console.log('3. Update customer management for product-wise opening bottles');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
if (require.main === module) {
  migrateToProductWiseBottles()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToProductWiseBottles };
