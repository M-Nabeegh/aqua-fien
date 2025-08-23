import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

// Debug environment variables
console.log('Database configuration:', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  database: process.env.DB_NAME || 'aquafine',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD ? '***' : 'NOT SET',
  passwordType: typeof process.env.DB_PASSWORD,
  isSupabase: process.env.DB_HOST?.includes('supabase.co') ? 'YES' : 'NO',
  hasConnectionString: process.env.POSTGRES_URL ? 'YES' : 'NO'
});

// Ensure password is a string
const dbPassword = String(process.env.DB_PASSWORD || 'mypassword123')

// Check if we're using Supabase
const isSupabase = process.env.DB_HOST?.includes('supabase.co')

// SSL configuration for Supabase
const getSSLConfig = () => {
  if (!isSupabase) return false
  
  try {
    // Try to read the certificate file
    const certPath = path.join(process.cwd(), 'prod-ca-2021.crt')
    if (fs.existsSync(certPath)) {
      const ca = fs.readFileSync(certPath, 'utf8')
      return {
        rejectUnauthorized: true,
        ca: ca
      }
    }
  } catch (error) {
    console.warn('Could not load SSL certificate, using fallback SSL config:', error.message)
  }
  
  // Fallback SSL configuration
  return { rejectUnauthorized: false }
}

// Create a connection pool with Supabase-compatible settings
const poolConfig = (process.env.POSTGRES_URL && process.env.NODE_ENV !== 'production')
  ? {
      connectionString: process.env.POSTGRES_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: process.env.NODE_ENV === 'production' ? getSSLConfig() : false,
      options: '-c search_path=public'
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'aquafine',
      user: process.env.DB_USER || 'postgres',
      password: dbPassword,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: isSupabase ? getSSLConfig() : false,
      options: isSupabase ? '-c search_path=public' : undefined
    }

const pool = new Pool(poolConfig)

// Database query helper
export async function query(text, params = []) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Database query error:', error)
    throw error
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
