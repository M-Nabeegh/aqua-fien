import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'aquafine-secret-key-2025'

// Public routes that don't require authentication
const publicRoutes = ['/login', '/contact']

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Allow API auth routes
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Check for auth token
  const token = request.cookies.get('aquafine_auth')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    // Redirect to login for non-API routes
    if (!pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Return 401 for API routes
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify JWT token
    jwt.verify(token, JWT_SECRET)
    return NextResponse.next()
  } catch (error) {
    console.error('JWT verification failed:', error.message)
    
    // Redirect to login for non-API routes
    if (!pathname.startsWith('/api/')) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('aquafine_auth')
      return response
    }
    // Return 401 for API routes
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
