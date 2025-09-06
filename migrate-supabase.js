const fs = require('fs');
const { Pool } = require('pg');

// Use the exact same configuration as your app
const pool = new Pool({
  host: process.env.DB_HOST || 'aws-1-us-east-1.pooler.supabase.com',
  port: process.env.DB_PORT || 6543,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres.lyhpqwgycgoggpekcymt',
  password: process.env.POSTGRES_PASSWORD || 'shilly@@@123',
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  try {
    console.log('Connecting to Supabase...');
    const client = await pool.connect();
    
    console.log('Running product bottle tracking migration...');
    const migrationSQL = fs.readFileSync('./database/product-bottle-tracking-migration.sql', 'utf8');
    
    // Execute the complete SQL
    console.log('Executing migration SQL...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
    
    // Test the view
    console.log('Testing the new view...');
    const result = await client.query('SELECT COUNT(*) FROM v_customer_product_bottle_balances');
    console.log(`✅ View working! Found ${result.rows[0].count} records`);
    
    client.release();
    await pool.end();
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
