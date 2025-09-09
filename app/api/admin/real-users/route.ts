import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: Fetching real users from MySQL database...')
    
    // Fetch all users from the real MySQL database with address information
    const users = await executeQuery(`
      SELECT 
        u.id,
        u.email,
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as full_name,
        u.first_name,
        u.last_name,
        u.phone,
        u.date_of_birth,
        u.gender,
        u.avatar_url,
        u.is_admin,
        u.is_active,
        u.created_at,
        u.updated_at,
        a.city,
        a.state,
        a.country,
        CONCAT(COALESCE(a.city, ''), CASE WHEN a.city IS NOT NULL AND a.state IS NOT NULL THEN ', ' ELSE '' END, COALESCE(a.state, ''), CASE WHEN (a.city IS NOT NULL OR a.state IS NOT NULL) AND a.country IS NOT NULL THEN ', ' ELSE '' END, COALESCE(a.country, '')) as location
      FROM users u
      LEFT JOIN addresses a ON u.id = a.user_id AND a.is_default = TRUE
      ORDER BY u.created_at DESC
    `)
    
    console.log(`✅ API: Successfully returned ${Array.isArray(users) ? users.length : 0} real users from MySQL`)
    
    return NextResponse.json({
      success: true,
      data: users || [],
      source: 'MySQL Database'
    })
  } catch (error) {
    console.error('❌ API: Error fetching real users from MySQL:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch real users from MySQL',
        details: error instanceof Error ? error.message : 'Unknown error',
        source: 'MySQL Database'
      },
      { status: 500 }
    )
  }
}