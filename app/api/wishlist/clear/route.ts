import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

// Clear all items from user's wishlist
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    console.log('🔍 API: Clearing wishlist for user:', userId)

    const deleteQuery = 'DELETE FROM wishlist_items WHERE user_id = ?'
    const result = await executeQuery(deleteQuery, [userId])

    console.log('✅ API: Successfully cleared wishlist')
    return NextResponse.json({ message: 'Wishlist cleared successfully' })
    
  } catch (error) {
    console.error('❌ API: Error clearing wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to clear wishlist' },
      { status: 500 }
    )
  }
}