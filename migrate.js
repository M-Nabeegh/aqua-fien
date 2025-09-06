const { query } = require('./lib/db');
const fs = require('fs');

async function runMigration() {
  try {
    console.log('Running product bottle tracking migration...');
    const migrationSQL = fs.readFileSync('./database/product-bottle-tracking-migration.sql', 'utf8');
    
    // Execute the complete SQL as one transaction
    console.log('Executing migration SQL...');
    await query(migrationSQL);
    console.log('✅ Migration completed successfully!');
    
    // Test the view
    console.log('Testing the new view...');
    const result = await query('SELECT COUNT(*) FROM v_customer_product_bottle_balances');
    console.log(`✅ View working! Found ${result.rows[0].count} records`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
