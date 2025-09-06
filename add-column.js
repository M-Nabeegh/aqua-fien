const { query } = require('./lib/db.js');

async function addColumn() {
  try {
    console.log('Checking current table structure...');
    const result = await query('SELECT column_name FROM information_schema.columns WHERE table_name = \'sell_orders\' AND column_name = \'empty_bottles_collected\'');
    
    if (result.rows.length === 0) {
      console.log('Adding empty_bottles_collected column...');
      await query('ALTER TABLE sell_orders ADD COLUMN empty_bottles_collected INTEGER DEFAULT 0 CHECK (empty_bottles_collected >= 0)');
      console.log('✅ Column empty_bottles_collected added successfully');
    } else {
      console.log('✅ Column empty_bottles_collected already exists');
    }
  } catch (error) {
    console.error('❌ Error adding column:', error);
  }
  process.exit();
}

addColumn();
