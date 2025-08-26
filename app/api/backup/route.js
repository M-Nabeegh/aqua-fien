import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'

export async function GET() {
  try {
    console.log('Starting database backup...')
    
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      tables: {}
    }

    // Define tables to backup
    const tablesToBackup = [
      'customers',
      'products', 
      'employees',
      'sell_orders',
      'rider_activities',
      'customer_advances',
      'employee_advances',
      'expenditures',
      'customer_pricing',
      'salary_payments'
    ]

    // Backup each table
    for (const table of tablesToBackup) {
      try {
        console.log(`Backing up table: ${table}`)
        
        let queryText = ''
        switch (table) {
          case 'customers':
            queryText = 'SELECT * FROM customers WHERE is_active = true ORDER BY created_at DESC'
            break
          case 'products':
            queryText = 'SELECT * FROM products ORDER BY created_at DESC'
            break
          case 'employees':
            queryText = 'SELECT * FROM employees WHERE is_active = true ORDER BY created_at DESC'
            break
          case 'sell_orders':
            queryText = 'SELECT * FROM sell_orders WHERE is_active = true ORDER BY created_at DESC'
            break
          case 'rider_activities':
            queryText = 'SELECT * FROM rider_activities WHERE is_active = true ORDER BY created_at DESC'
            break
          case 'customer_advances':
            queryText = 'SELECT * FROM customer_advances WHERE is_active = true ORDER BY created_at DESC'
            break
          case 'employee_advances':
            queryText = 'SELECT * FROM employee_advances WHERE is_active = true ORDER BY created_at DESC'
            break
          case 'expenditures':
            queryText = 'SELECT * FROM expenditures WHERE is_active = true ORDER BY created_at DESC'
            break
          case 'customer_pricing':
            queryText = 'SELECT * FROM customer_pricing WHERE is_active = true ORDER BY created_at DESC'
            break
          case 'salary_payments':
            queryText = 'SELECT * FROM salary_payments WHERE is_active = true ORDER BY created_at DESC'
            break
          default:
            queryText = `SELECT * FROM ${table} ORDER BY created_at DESC`
        }

        const result = await query(queryText)
        backupData.tables[table] = {
          count: result.rows.length,
          data: result.rows
        }
        
        console.log(`✓ Backed up ${result.rows.length} records from ${table}`)
      } catch (tableError) {
        console.error(`Error backing up table ${table}:`, tableError)
        backupData.tables[table] = {
          count: 0,
          data: [],
          error: tableError.message
        }
      }
    }

    // Add summary
    const totalRecords = Object.values(backupData.tables).reduce((sum, table) => sum + table.count, 0)
    backupData.summary = {
      totalTables: tablesToBackup.length,
      totalRecords: totalRecords,
      backupDate: new Date().toISOString(),
      applicationName: 'AquaFine Water Supply Management'
    }

    console.log(`✅ Backup completed: ${totalRecords} records from ${tablesToBackup.length} tables`)

    return NextResponse.json(backupData, {
      headers: {
        'Content-Disposition': `attachment; filename="aquafine-backup-${new Date().toISOString().split('T')[0]}.json"`,
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Error creating database backup:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create backup', 
        details: error.message,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}
