import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql'

// Use the centralized database connection

export async function POST(request: NextRequest) {
  try {
    const user = await request.json()
    
    // Check if user already exists
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [user.email]
    ) as any[]
    
    if (existingUsers.length === 0) {
      // Insert new user
      await executeQuery(
        'INSERT INTO users (email, first_name, last_name, avatar_url, is_admin) VALUES (?, ?, ?, ?, ?)',
        [
          user.email,
          user.firstName,
          user.lastName,
          user.avatar,
          user.role === 'admin' ? 1 : 0
        ]
      )
    } else {
      // Update existing user
      await executeQuery(
        'UPDATE users SET first_name = ?, last_name = ?, avatar_url = ? WHERE email = ?',
        [user.firstName, user.lastName, user.avatar, user.email]
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error storing user:', error)
    return NextResponse.json(
      { error: 'Failed to store user' },
      { status: 500 }
    )
  }
}