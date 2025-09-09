import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql'

export async function POST(request: NextRequest) {
  try {
    const { productId, userId } = await request.json()

    if (!productId || !userId) {
      return NextResponse.json(
        { error: 'Product ID and User ID are required' },
        { status: 400 }
      )
    }

    console.log('🔍 API: Checking if user has viewed product:', productId, 'user:', userId)
    
    // Check if user has already viewed this product
    const results = await executeQuery(
      `SELECT id FROM product_views WHERE user_id = ? AND product_id = ?`,
      [userId, productId]
    ) as any[]
    
    const hasViewed = results.length > 0

    console.log('✅ API: User view check result:', hasViewed)
    
    return NextResponse.json({
      hasViewed,
      message: hasViewed ? 'User has already viewed this product' : 'User has not viewed this product'
    })

  } catch (error) {
    console.error('❌ API: Error checking user view:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}