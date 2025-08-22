export async function GET() {
  try {
    // Debug environment variables
    const debugInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT SET',
      DB_SSL: process.env.DB_SSL,
      USE_CONNECTION_STRING: process.env.USE_CONNECTION_STRING,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      POSTGRES_URL: process.env.POSTGRES_URL ? 'SET' : 'NOT SET'
    }

    return Response.json({ 
      success: true, 
      message: 'Debug info retrieved',
      environment: debugInfo,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
