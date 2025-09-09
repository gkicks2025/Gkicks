import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { executeQuery } from '@/lib/database/mysql'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, email: string }
    return { id: decoded.userId, email: decoded.email }
  } catch (error: any) {
    console.error('Token verification failed:', error)
    return null
  }
}

// GET - Debug profile data
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🐛 DEBUG: Fetching profile for user:', user.id)
    
    // Fetch profile from database
    const profileQuery = 'SELECT * FROM profiles WHERE id = ?'
    const profiles = await executeQuery(profileQuery, [user.id])
    
    console.log('🐛 DEBUG: Raw profile data from DB:', profiles)
    
    const profilesArray = profiles as any[]
    if (profilesArray.length > 0) {
      const dbProfile = profilesArray[0]
      console.log('🐛 DEBUG: Profile found:', {
        id: dbProfile.id,
        first_name: dbProfile.first_name,
        last_name: dbProfile.last_name,
        phone: dbProfile.phone,
        preferences: dbProfile.preferences
      })
      
      return NextResponse.json({
        success: true,
        profile: dbProfile,
        message: 'Profile data retrieved successfully'
      })
    } else {
      console.log('🐛 DEBUG: No profile found for user:', user.id)
      return NextResponse.json({
        success: false,
        message: 'No profile found for user'
      })
    }

  } catch (error: any) {
    console.error('🐛 DEBUG: Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}