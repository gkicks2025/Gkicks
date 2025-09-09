import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      authenticated: !!session?.user?.email,
      user: session?.user || null,
      isAdmin: session?.user?.email === 'gkcksdmn@gmail.com',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json(
      { error: 'Failed to check auth status', details: error },
      { status: 500 }
    )
  }
}