import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'

export async function GET() {
  try {
    console.log('Starting database backup...')

    const timestamp = new Date().toISOString()
    
    // Define ALL 12 tables to backup in correct order (respecting foreign key dependencies)
    const allTablesToBackup = [
      'products',           // 1. Referenced by other tables
      'customers',          // 2. Referenced by other tables  
      'employees',          // 3. Referenced by other tables
      'advances_legacy',    // 4. Legacy data (independent)
      'customer_pricing',   // 5. After customers and products
      'customer_advances',  // 6. After customers
      'employee_advances',  // 7. After employees
      'expenditures',       // 8. After employees
      'salary_payments',    // 9. After employees
      'sell_orders',        // 10. After customers, products, employees
      'rider_activities',   // 11. After employees and products
      'pricing_history'     // 12. After customer_pricing (tracks changes)
    ]

    const backupData = {
      timestamp: timestamp,
      version: '1.0',
      source: 'aquafine-database',
      totalTables: allTablesToBackup.length,
      tables: {}
    }

    console.log(`Backing up all ${allTablesToBackup.length} tables:`, allTablesToBackup.join(', '))

    // Backup each table
    for (const tableName of allTablesToBackup) {
      try {
        console.log(`📦 Backing up table: ${tableName}`)
        
        // Get table data - some tables don't have deleted_at column
        let selectQuery = `SELECT * FROM ${tableName} ORDER BY id`
        
        // Check if table has deleted_at column first
        const hasDeletedAt = await query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public' AND column_name = 'deleted_at'
        `, [tableName])
        
        if (hasDeletedAt.rows.length > 0) {
          selectQuery = `SELECT * FROM ${tableName} WHERE deleted_at IS NULL ORDER BY id`
        }
        
        const result = await query(selectQuery)
        
        // Get table schema info
        const schemaResult = await query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [tableName])

        backupData.tables[tableName] = {
          rowCount: result.rows.length,
          schema: schemaResult.rows,
          data: result.rows
        }

        console.log(`✅ ${tableName}: ${result.rows.length} records`)

      } catch (error) {
        console.error(`❌ Error backing up ${tableName}:`, error.message)
        backupData.tables[tableName] = {
          error: error.message,
          rowCount: 0,
          data: []
        }
      }
    }

    // Generate backup summary
    const totalRecords = Object.values(backupData.tables)
      .reduce((sum, table) => sum + (table.rowCount || 0), 0)
    
    const successfulTables = Object.values(backupData.tables)
      .filter(table => !table.error).length

    const tablesWithData = Object.entries(backupData.tables)
      .filter(([_, table]) => !table.error && table.rowCount > 0)
      .map(([name, table]) => `${name}(${table.rowCount})`)

    // Create comprehensive SQL export
    let sqlExport = `-- Aquafine Database Backup - COMPLETE
-- Generated: ${timestamp}
-- Total Tables: ${allTablesToBackup.length}
-- Total Records: ${totalRecords}
-- Tables with Data: ${tablesWithData.join(', ')}

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET search_path = public;
SET session_replication_role = replica; -- Disable triggers during import

BEGIN;

`

    // Add INSERT statements for each table
    for (const [tableName, tableData] of Object.entries(backupData.tables)) {
      if (tableData.error || !tableData.data || tableData.data.length === 0) {
        sqlExport += `-- Table: ${tableName} - ${tableData.error ? 'ERROR: ' + tableData.error : 'No data'}\n\n`
        continue
      }
      
      sqlExport += `-- Table: ${tableName} (${tableData.rowCount} records)\n`
      sqlExport += `-- Schema: ${tableData.schema.map(col => `${col.column_name}:${col.data_type}`).join(', ')}\n`
      
      for (const row of tableData.data) {
        const columns = Object.keys(row)
        const values = columns.map(col => {
          const val = row[col]
          if (val === null || val === undefined) return 'NULL'
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`
          if (val instanceof Date) return `'${val.toISOString()}'`
          if (typeof val === 'boolean') return val ? 'true' : 'false'
          return val
        })
        
        sqlExport += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`
      }
      sqlExport += '\n'
    }

    sqlExport += `COMMIT;
SET session_replication_role = DEFAULT; -- Re-enable triggers

-- Backup Summary:
-- Total Tables: ${allTablesToBackup.length}
-- Successful: ${successfulTables}
-- Total Records: ${totalRecords}
-- Generated: ${timestamp}
`

    const response = {
      success: true,
      timestamp: timestamp,
      backup: backupData,
      summary: {
        message: `Complete database backup: all ${allTablesToBackup.length} tables`,
        totalTables: allTablesToBackup.length,
        successfulTables: successfulTables,
        totalRecords: totalRecords,
        tablesWithData: tablesWithData,
        timestamp: timestamp,
        size: `${Math.round(JSON.stringify(backupData).length / 1024)} KB`,
        sqlSize: `${Math.round(sqlExport.length / 1024)} KB`
      },
      sqlExport: sqlExport,
      tableList: allTablesToBackup
    }

    console.log(`✅ Backup completed: ${totalRecords} records from ${successfulTables}/${allTablesToBackup.length} tables`)
    console.log(`📊 Tables with data: ${tablesWithData.join(', ')}`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Backup failed:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        details: 'Database backup failed'
      }, 
      { status: 500 }
    )
  }
}

// Alternative pg_dump backup (for when you have time)
export async function POST() {
  try {
    const { spawn } = await import('child_process')
    const fs = await import('fs')
    const path = await import('path')
    
    console.log('Starting pg_dump backup...')

    const dbConfig = {
      host: process.env.DB_HOST || 'aws-1-us-east-1.pooler.supabase.com',
      port: process.env.DB_PORT || '6543',
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres.lyhpqwgycgoggpekcymt',
      password: process.env.DB_PASSWORD || 'shilly@@@123'
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFilename = `aquafine-pgdump-${timestamp}.sql`
    const backupPath = path.join('/tmp', backupFilename)

    const pgDumpArgs = [
      '--host', dbConfig.host,
      '--port', dbConfig.port,
      '--username', dbConfig.user,
      '--dbname', dbConfig.database,
      '--no-password',
      '--schema=public',
      '--format=plain',
      '--no-comments',
      '--no-blobs',
      '--clean',
      '--if-exists',
      '--file', backupPath
    ]

    const pgDumpPath = '/opt/homebrew/opt/postgresql@17/bin/pg_dump'

    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('pg_dump timed out after 60 seconds'))
      }, 60000)

      const pgDump = spawn(pgDumpPath, pgDumpArgs, {
        env: { ...process.env, PGPASSWORD: dbConfig.password }
      })

      let stderr = ''
      pgDump.stderr.on('data', (data) => { stderr += data.toString() })
      
      pgDump.on('close', (code) => {
        clearTimeout(timeout)
        if (code === 0) {
          resolve({ success: true, stderr })
        } else {
          reject(new Error(`pg_dump failed: ${stderr}`))
        }
      })

      pgDump.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
    })

    // Check if file exists and get stats
    if (fs.existsSync(backupPath)) {
      const stats = fs.statSync(backupPath)
      const content = fs.readFileSync(backupPath, 'utf8')
      fs.unlinkSync(backupPath)
      
      return NextResponse.json({
        success: true,
        method: 'pg_dump',
        timestamp: new Date().toISOString(),
        backupInfo: {
          filename: backupFilename,
          size: `${Math.round(stats.size / 1024)} KB`,
          lines: content.split('\n').length
        },
        backupContent: content,
        summary: {
          message: `pg_dump backup completed successfully`,
          size: `${Math.round(stats.size / 1024)} KB`,
          timestamp: new Date().toISOString()
        }
      })
    } else {
      throw new Error('Backup file not created')
    }

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      method: 'pg_dump'
    }, { status: 500 })
  }
}
