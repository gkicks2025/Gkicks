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

    console.log('🔍 API: Updating view count for product:', productId, 'user:', userId)
    
    // Check if user has already viewed this product
    const existingViews = await executeQuery(
      `SELECT id FROM product_views WHERE user_id = ? AND product_id = ?`,
      [userId, productId]
    ) as any[]
    
    if (existingViews.length > 0) {
      console.log('ℹ️ API: User has already viewed this product, not incrementing view count')
      
      // Get current view count without incrementing
      const results = await executeQuery(
        `SELECT views FROM products WHERE id = ?`,
        [productId]
      ) as any[]
      
      const product = results[0]
      
      return NextResponse.json({
        views: product?.views || 0,
        message: 'User has already viewed this product',
        alreadyViewed: true
      })
    }
    
    // Record the view in product_views table
    await executeQuery(
      `INSERT INTO product_views (user_id, product_id) VALUES (?, ?)`,
      [userId, productId]
    )
    
    // Update the view count for the product
    await executeQuery(
      `UPDATE products SET views = views + 1 WHERE id = ?`,
      [productId]
    )

    // Get the updated view count
    const results = await executeQuery(
      `SELECT views FROM products WHERE id = ?`,
      [productId]
    ) as any[]
    
    const product = results[0]

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    console.log('✅ API: Successfully updated view count:', product.views)
    
    return NextResponse.json({
      views: product.views,
      message: 'View count updated successfully',
      alreadyViewed: false
    })

  } catch (error) {
    console.error('❌ API: Error updating view count:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}