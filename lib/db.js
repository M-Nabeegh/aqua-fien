import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

// Debug environment variables
console.log('Database configuration:', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: (process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD) ? '***' : 'NOT SET',
  passwordType: typeof (process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD),
  isSupabase: process.env.DB_HOST?.includes('supabase.co') ? 'YES' : 'NO',
  hasConnectionString: process.env.POSTGRES_URL ? 'YES' : 'NO'
});

// For Supabase, use the connection string directly
const isSupabase = process.env.DB_HOST?.includes('supabase.co')

let poolConfig;

if (isSupabase && process.env.POSTGRES_URL) {
  // Use individual connection parameters instead of connection string to have full control over SSL
  console.log('Using Supabase with individual connection parameters to disable SSL')
  
  poolConfig = {
    host: process.env.DB_HOST || 'aws-1-us-east-1.pooler.supabase.com',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres.lyhpqwgycgoggpekcymt',
    password: String(process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || ''),
    max: 1, // Single connection
    min: 0, // No minimum
    idleTimeoutMillis: 5000, // Very short
    connectionTimeoutMillis: 3000, // Very quick
    acquireTimeoutMillis: 5000,
    ssl: false, // Disable SSL completely
    keepAlive: false, // Disable keep alive for simpler connections
    query_timeout: 10000,
    statement_timeout: 10000
  }
} else {
  // Ensure password is a string
  const dbPassword = String(process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'mypassword123')
  
  // Create a connection pool with traditional settings
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: dbPassword,
    max: 1, // Single connection to avoid pool exhaustion
    min: 0, // No minimum connections
    idleTimeoutMillis: 5000, // Very short idle timeout
    connectionTimeoutMillis: 3000, // Quick connection timeout
    acquireTimeoutMillis: 5000, // Quick acquire timeout
    ssl: false, // Disable SSL completely
    options: isSupabase ? '-c search_path=public' : undefined,
    keepAlive: true,
    keepAliveInitialDelayMillis: 0
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
