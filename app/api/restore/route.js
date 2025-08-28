import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'

export async function POST(request) {
  try {
    console.log('Starting database restore...')
    
    // Parse the JSON backup from request body
    const backupData = await request.json()
    
    // Validate backup format
    if (!backupData.tables || !backupData.version) {
      return NextResponse.json(
        { error: 'Invalid backup format. Expected tables and version properties.' },
        { status: 400 }
      )
    }

    console.log(`Restoring backup from: ${backupData.timestamp}`)
    console.log(`Backup version: ${backupData.version}`)

    const restoreResults = {
      timestamp: new Date().toISOString(),
      backupSource: backupData.timestamp,
      restoredTables: {},
      errors: []
    }

    // Define table restore order (to handle foreign key dependencies)
    const restoreOrder = [
      'products',      // First - referenced by other tables
      'customers',     // Second - referenced by other tables  
      'employees',     // Third - referenced by other tables
      'customer_pricing', // After customers and products
      'sell_orders',   // After customers, products, employees
      'rider_activities', // After employees and products
      'customer_advances', // After customers
      'employee_advances', // After employees
      'expenditures',  // After employees
      'salary_payments' // After employees
    ]

    // Start transaction
    await query('BEGIN')

    try {
      // Disable foreign key checks temporarily
      await query('SET session_replication_role = replica')

      for (const tableName of restoreOrder) {
        if (!backupData.tables[tableName] || !backupData.tables[tableName].data) {
          console.log(`⚠️  Skipping ${tableName} - no data in backup`)
          continue
        }

        const tableData = backupData.tables[tableName].data
        console.log(`Restoring table: ${tableName} (${tableData.length} records)`)

        if (tableData.length === 0) {
          restoreResults.restoredTables[tableName] = { count: 0, status: 'skipped' }
          continue
        }

        try {
          // Clear existing data (be careful!)
          // await query(`DELETE FROM ${tableName}`)
          
          // Get column names from first record
          const columns = Object.keys(tableData[0])
          const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ')
          const columnNames = columns.join(', ')

          let insertedCount = 0
          
          // Insert records one by one to handle conflicts gracefully
          for (const record of tableData) {
            try {
              const values = columns.map(col => record[col])
              
              // Use INSERT ... ON CONFLICT DO UPDATE or INSERT ... ON CONFLICT DO NOTHING
              const insertQuery = `
                INSERT INTO ${tableName} (${columnNames}) 
                VALUES (${placeholders})
                ON CONFLICT (id) DO UPDATE SET
                ${columns.filter(col => col !== 'id').map(col => `${col} = EXCLUDED.${col}`).join(', ')}
              `
              
              await query(insertQuery, values)
              insertedCount++
            } catch (recordError) {
              console.warn(`Error inserting record in ${tableName}:`, recordError.message)
              // Continue with other records
            }
          }

          restoreResults.restoredTables[tableName] = {
            count: insertedCount,
            total: tableData.length,
            status: 'completed'
          }
          
          console.log(`✓ Restored ${insertedCount}/${tableData.length} records in ${tableName}`)
          
        } catch (tableError) {
          console.error(`Error restoring table ${tableName}:`, tableError)
          restoreResults.errors.push({
            table: tableName,
            error: tableError.message
          })
          restoreResults.restoredTables[tableName] = {
            count: 0,
            status: 'failed',
            error: tableError.message
          }
        }
      }

      // Re-enable foreign key checks
      await query('SET session_replication_role = DEFAULT')

      // Update sequences to prevent ID conflicts
      for (const tableName of restoreOrder) {
        if (restoreResults.restoredTables[tableName]?.count > 0) {
          try {
            await query(`SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), (SELECT MAX(id) FROM ${tableName}))`)
          } catch (seqError) {
            console.warn(`Could not update sequence for ${tableName}:`, seqError.message)
          }
        }
      }

      await query('COMMIT')
      console.log('✅ Restore completed successfully')

      return NextResponse.json({
        success: true,
        message: 'Database restore completed',
        results: restoreResults,
        summary: {
          totalTables: Object.keys(restoreResults.restoredTables).length,
          totalRecords: Object.values(restoreResults.restoredTables).reduce((sum, table) => sum + (table.count || 0), 0),
          errors: restoreResults.errors.length
        }
      })

    } catch (error) {
      await query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('Error during database restore:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to restore database', 
        details: error.message,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}

// GET endpoint to provide restore instructions
export async function GET() {
  return NextResponse.json({
    message: 'Database Restore API',
    instructions: {
      method: 'POST',
      contentType: 'application/json',
      body: 'Send your AquaFine JSON backup file as request body',
      example: {
        timestamp: '2025-08-28T10:00:00Z',
        version: '1.0.0',
        tables: {
          customers: { count: 10, data: [/* customer records */] },
          products: { count: 5, data: [/* product records */] }
        }
      }
    },
    notes: [
      'This API will restore data from your JSON backup',
      'Uses INSERT ... ON CONFLICT to handle existing records',
      'Maintains referential integrity with proper table order',
      'Updates sequence counters to prevent ID conflicts',
      'Runs in a transaction for data safety'
    ]
  })
}
