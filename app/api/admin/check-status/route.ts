import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql'

export async function POST(request: NextRequest) {
  try {
    let email: string
    
    try {
      const body = await request.json()
      email = body.email
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // First check admin_users table for staff/admin roles
    const adminUserArray = await executeQuery(
      'SELECT id, username, email, role, permissions, is_active, created_at FROM admin_users WHERE email = ? AND is_active = 1',
      [email]
    ) as any[]
    
    if (adminUserArray.length > 0) {
      const adminUser = adminUserArray[0]
      let permissions = []
      
      try {
        permissions = adminUser.permissions ? JSON.parse(adminUser.permissions) : {}
      } catch (e) {
        permissions = []
      }
      
      // Return admin user data from admin_users table
      const userData = {
        id: adminUser.id.toString(),
        email: adminUser.email,
        role: adminUser.role,
        permissions: permissions,
        is_active: adminUser.is_active,
        created_at: adminUser.created_at
      }
      
      return NextResponse.json({
        message: 'Admin status confirmed',
        user: userData
      })
    }
    
    // Fallback: Check users table for legacy admin users
    const userArray = await executeQuery(
      'SELECT id, email, is_admin, created_at FROM users WHERE email = ? AND is_admin = 1',
      [email]
    ) as any[]
    
    if (userArray.length === 0) {
      return NextResponse.json(
        { error: 'User is not an admin or staff member' },
        { status: 403 }
      )
    }

    const user = userArray[0]

    // Return legacy admin user data
    const adminUser = {
      id: user.id.toString(),
      email: user.email,
      role: 'admin' as const,
      permissions: { all: true },
      is_active: true,
      created_at: user.created_at
    }

    return NextResponse.json({
      message: 'Admin status confirmed',
      user: adminUser
    })

  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}