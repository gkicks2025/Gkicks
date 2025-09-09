import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('🔍 Session API: Fetching session for user:', session?.user?.email || 'No user')
    
    if (!session) {
      console.log('❌ Session API: No session found')
      return NextResponse.json({ user: null }, { status: 200 })
    }
    
    console.log('✅ Session API: Session found for user:', session?.user?.email, 'role:', (session?.user as any)?.role)
    
    return NextResponse.json({ user: session.user }, { status: 200 })
  } catch (error) {
    console.error('❌ Session API Error:', error)
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 })
  }
}