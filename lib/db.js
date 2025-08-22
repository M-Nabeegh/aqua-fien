import { Pool } from 'pg'

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

// Create a connection pool with Supabase-compatible settings
const poolConfig = process.env.POSTGRES_URL 
  ? {
      connectionString: process.env.POSTGRES_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false }
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
      ssl: isSupabase ? { rejectUnauthorized: false } : false,
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
