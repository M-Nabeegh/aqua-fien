import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'aquafine-secret-key-2025'

export function verifyToken(request) {
  try {
    // Get token from cookie or Authorization header
    const token = request.cookies.get('aquafine_auth')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return { error: 'No token provided', status: 401 }
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET)
    return { user: decoded }

  } catch (error) {
    console.error('JWT verification failed:', error.message)
    return { error: 'Invalid token', status: 401 }
  }
}

export function requireAuth(handler) {
  return async (request) => {
    const auth = verifyToken(request)
    
    if (auth.error) {
      return new Response(
        JSON.stringify({ message: auth.error }),
        { 
          status: auth.status,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Add user to request context
    request.user = auth.user
    return handler(request)
  }
}
