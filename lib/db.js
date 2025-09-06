import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

// Debug environment variables
console.log('Database configuration:', {
  hasConnectionString: process.env.POSTGRES_URL_NON_POOLING ? 'YES' : 'NO',
  hasRegularUrl: process.env.POSTGRES_URL ? 'YES' : 'NO',
  connectionStringPreview: process.env.POSTGRES_URL_NON_POOLING ? process.env.POSTGRES_URL_NON_POOLING.substring(0, 50) + '...' : 'NOT SET'
});

let poolConfig;

// Always try to use the connection string first if available
if (process.env.CORRECT_POSTGRES_URL_NON_POOLING) {
  console.log('Using CORRECT_POSTGRES_URL_NON_POOLING connection string')
  
  poolConfig = {
    connectionString: process.env.CORRECT_POSTGRES_URL_NON_POOLING,
    max: 1, // Single connection
    min: 0, // No minimum
    idleTimeoutMillis: 5000, // Very short
    connectionTimeoutMillis: 3000, // Very quick
    acquireTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false }, // Bypass SSL issues
    keepAlive: false,
    query_timeout: 10000,
    statement_timeout: 10000
  }
} else if (process.env.POSTGRES_URL_NON_POOLING) {
  console.log('Using POSTGRES_URL_NON_POOLING connection string')
  
  poolConfig = {
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    max: 1, // Single connection
    min: 0, // No minimum
    idleTimeoutMillis: 5000, // Very short
    connectionTimeoutMillis: 3000, // Very quick
    acquireTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false }, // Bypass SSL issues
    keepAlive: false,
    query_timeout: 10000,
    statement_timeout: 10000
  }
} else if (process.env.POSTGRES_URL) {
  console.log('Using POSTGRES_URL connection string')
  
  poolConfig = {
    connectionString: process.env.POSTGRES_URL,
    max: 1,
    min: 0,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 3000,
    acquireTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false },
    keepAlive: false,
    query_timeout: 10000,
    statement_timeout: 10000
  }
} else {
  // Fallback to individual parameters if no connection string available
  console.log('Using individual database parameters as fallback')
  
  const dbPassword = String(process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'mypassword123')
  
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || process.env.POSTGRES_DATABASE || 'postgres',
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
    password: dbPassword,
    max: 1,
    min: 0,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 3000,
    acquireTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false },
    keepAlive: false,
    query_timeout: 10000,
    statement_timeout: 10000
  }
}

const pool = new Pool(poolConfig)

// Database query helper with enhanced retry logic
export async function query(text, params = [], retries = 4) {
  const start = Date.now()
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await pool.query(text, params)
      const duration = Date.now() - start
      console.log('Executed query', { text: text.substring(0, 100) + '...', duration, rows: res.rowCount, attempt: attempt > 0 ? attempt + 1 : 1 })
      return res
    } catch (error) {
      console.error(`Database query error (attempt ${attempt + 1}/${retries + 1}):`, error.message)
      
      // Retry on connection errors
      if (attempt < retries && (
        error.code === 'ECONNRESET' || 
        error.code === 'ENOTFOUND' || 
        error.code === 'ETIMEDOUT' ||
        error.message.includes('Connection terminated') ||
        error.message.includes('connection was closed') ||
        error.message.includes('read ECONNRESET')
      )) {
        const delay = Math.min(2000 * (attempt + 1), 8000) // 2s, 4s, 6s, 8s max
        console.log(`Retrying query in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      throw error
    }
  }
}

// Get a client from the pool for transactions
export async function getClient() {
  return await pool.connect()
}

// Close the pool (usually called on app shutdown)
export async function closePool() {
  await pool.end()
}

export default pool
