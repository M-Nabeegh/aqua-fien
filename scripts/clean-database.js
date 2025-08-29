#!/usr/bin/env node

/**
 * Database Cleanup Script for Client Delivery
 * This script removes all data from the database while preserving the schema
 */

const { Pool } = require('pg');

// Database configuration
const poolConfig = process.env.POSTGRES_URL 
  ? {
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST || 'aws-1-us-east-1.pooler.supabase.com',
      port: parseInt(process.env.DB_PORT || '6543'),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres.lyhpqwgycgoggpekcymt',
      password: process.env.DB_PASSWORD || 'shilly@@@123',
      ssl: { rejectUnauthorized: false },
      options: '-c search_path=public'
    };

const pool = new Pool(poolConfig);

// List of tables to clean (in order to respect foreign key constraints)
const tablesToClean = [
  'rider_activities',
  'sell_orders', 
  'pricing_history',
  'customer_pricing',
  'employee_advances',
  'customer_advances',
  'expenditures',
  'advances_legacy',
  'employees',
  'customers',
  'products'
];

async function cleanDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting database cleanup for client delivery...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Disable foreign key checks temporarily
    await client.query('SET session_replication_role = replica;');
    
    let totalRowsDeleted = 0;
    
    // Clean each table
    for (const table of tablesToClean) {
      try {
        const result = await client.query(`DELETE FROM ${table}`);
        console.log(`✅ Cleaned table '${table}': ${result.rowCount} rows deleted`);
        totalRowsDeleted += result.rowCount;
      } catch (error) {
        console.warn(`⚠️  Warning cleaning table '${table}': ${error.message}`);
      }
    }
    
    // Re-enable foreign key checks
    await client.query('SET session_replication_role = DEFAULT;');
    
    // Reset sequences to start from 1
    const sequenceQueries = [
      "SELECT setval('products_id_seq', 1, false);",
      "SELECT setval('customers_id_seq', 1, false);", 
      "SELECT setval('employees_id_seq', 1, false);",
      "SELECT setval('sell_orders_id_seq', 1, false);",
      "SELECT setval('customer_advances_id_seq', 1, false);",
      "SELECT setval('employee_advances_id_seq', 1, false);",
      "SELECT setval('expenditures_id_seq', 1, false);",
      "SELECT setval('rider_activities_id_seq', 1, false);",
      "SELECT setval('customer_pricing_id_seq', 1, false);",
      "SELECT setval('pricing_history_id_seq', 1, false);"
    ];
    
    for (const seqQuery of sequenceQueries) {
      try {
        await client.query(seqQuery);
      } catch (error) {
        console.warn(`⚠️  Warning resetting sequence: ${error.message}`);
      }
    }
    
    console.log('🔄 Reset all sequence counters to start from 1');
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log(`✨ Database cleanup completed successfully!`);
    console.log(`📊 Total rows deleted: ${totalRowsDeleted}`);
    
    // Verify cleanup by checking row counts
    console.log('\n📋 Verification - Current row counts:');
    for (const table of tablesToClean.reverse()) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   ${table}: ${result.rows[0].count} rows`);
      } catch (error) {
        console.warn(`   ${table}: Error checking - ${error.message}`);
      }
    }
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Error during database cleanup:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await cleanDatabase();
    console.log('\n✅ Database is now clean and ready for client delivery!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Failed to clean database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { cleanDatabase };
