import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import jwt from 'jsonwebtoken'
import { executeQuery } from '@/lib/database/mysql'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 JWT: Attempting to convert session to JWT...')
    
    // Get the NextAuth session
    const session = await getServerSession(authOptions)
    
    console.log('🔐 JWT: Session found:', !!session)
    console.log('🔐 JWT: User in session:', !!session?.user)
    console.log('🔐 JWT: User email:', session?.user?.email)
    
    if (!session || !session.user) {
      console.log('❌ JWT: No active session found')
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
      )
    }

    // Get user from database to get the user ID
    const userArray = await executeQuery(
      'SELECT id, email, first_name, last_name, is_admin FROM users WHERE email = ?',
      [session.user.email || null]
    ) as any[]

    if (userArray.length === 0) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    const user = userArray[0]

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.is_admin ? 'admin' : 'staff'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    const response = NextResponse.json({
      message: 'JWT token generated successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.is_admin ? 'admin' : 'staff'
      }
    })

    // Also set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response

  } catch (error) {
    console.error('Session to JWT conversion error:', error)
    return NextResponse.json(
      { error: 'Failed to generate JWT token' },
      { status: 500 }
    )
  }
}