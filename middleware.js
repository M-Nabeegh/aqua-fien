import { NextResponse } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = ['/login', '/contact']

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Allow all API routes to pass through (authentication will be handled in the API routes themselves)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check for auth token (just check if it exists, not verify JWT here)
  const token = request.cookies.get('aquafine_auth')?.value

  if (!token) {
    // Redirect to login for pages
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If token exists, allow access (JWT verification happens in API routes)
  return NextResponse.next()
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
