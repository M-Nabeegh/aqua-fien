import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envVars = {
      hasHost: !!process.env.POSTGRES_HOST,
      hasPort: !!process.env.POSTGRES_PORT,
      hasDatabase: !!process.env.POSTGRES_DATABASE,
      hasUser: !!process.env.POSTGRES_USER,
      hasPassword: !!process.env.POSTGRES_PASSWORD,
      hasConnectionString: !!process.env.POSTGRES_URL,
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
    };
    
    return NextResponse.json({
      message: 'Environment check',
      environment: envVars,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug env error:', error);
    return NextResponse.json({
      error: 'Failed to check environment',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
