import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    const JWT_SECRET = process.env.JWT_SECRET!
    if (!JWT_SECRET) {
      return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 })
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, email: string }
    
    console.log('🔍 Debug: Checking avatar data for user:', decoded.userId)
    
    // Check users table
    const usersQuery = 'SELECT id, first_name, last_name, avatar_url FROM users WHERE id = ?'
    const users = await executeQuery(usersQuery, [decoded.userId])
    console.log('👤 Users table data:', users)
    
    // Check profiles table
    const profilesQuery = 'SELECT id, user_id, first_name, last_name, avatar_url FROM profiles WHERE user_id = ?'
    const profiles = await executeQuery(profilesQuery, [decoded.userId])
    console.log('📋 Profiles table data:', profiles)
    
    return NextResponse.json({
      success: true,
      data: {
        users: users,
        profiles: profiles
      }
    })
    
  } catch (error) {
    console.error('❌ Debug avatar error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug data' },
      { status: 500 }
    )
  }
}