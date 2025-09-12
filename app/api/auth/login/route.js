import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Simple in-memory user store (in production, this would be in a database)
const users = [
  {
    id: 1,
    username: 'aquafine',
    password: 'admin', // In production, this would be hashed
    role: 'admin',
    permissions: ['all']
  }
]

// JWT secret (in production, this would be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'aquafine-secret-key-2025'

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = users.find(u => u.username === username)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check password (in production, use bcrypt.compare)
    if (user.password !== password) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Return success response
    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
