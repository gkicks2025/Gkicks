import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql-simulator'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: Fetching users from database...')
    
    // Fetch all users from the database
    const users = await executeQuery(`
      SELECT 
        id,
        email,
        full_name,
        phone,
        address,
        city,
        postal_code,
        country,
        is_admin,
        avatar_url,
        created_at,
        updated_at
      FROM users 
      ORDER BY created_at DESC
    `)
    
    console.log(`✅ API: Successfully returned ${Array.isArray(users) ? users.length : 0} users`)
    
    return NextResponse.json({
      success: true,
      data: users || []
    })
  } catch (error) {
    console.error('❌ API: Error fetching users:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}