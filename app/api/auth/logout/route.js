import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    // Create response
    const response = NextResponse.json({
      message: 'Logout successful'
    })

    // Clear the auth cookie
    response.cookies.delete('aquafine_auth')
    
    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
