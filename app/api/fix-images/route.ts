import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing product images in database...')
    
    // Update all products with placeholder images to use correct images
    const updates = [
      {
        name: 'Air Max 97 SE',
        image: '/images/air-max-97-se.png'
      },
      {
        name: 'UltraBoost 23', 
        image: '/images/ultraboost-23.png'
      }
    ]
    
    const results = []
    
    for (const update of updates) {
      const updateQuery = `
        UPDATE products 
        SET image_url = ?
        WHERE name = ? AND (image_url LIKE '%placeholder%' OR image_url LIKE '%svg%')
      `
      
      const queryResult = await executeQuery(updateQuery, [update.image, update.name])
      const result = Array.isArray(queryResult) ? queryResult[0] : queryResult
      const affectedRows = (result as any)?.affectedRows || 0
      console.log(`✅ Updated ${update.name} image:`, affectedRows, 'rows affected')
      results.push({
        product: update.name,
        affectedRows: affectedRows,
        newImage: update.image
      })
    }
    
    // Check all updated products
    const checkQuery = `
      SELECT id, name, image_url 
      FROM products 
      WHERE is_active = 1
      ORDER BY id
    `
    
    const [products] = await executeQuery(checkQuery)
    console.log('📦 All products after update:')
    console.table(products)
    
    return NextResponse.json({
      success: true,
      message: 'Product images updated successfully',
      updates: results,
      products: products
    })
    
  } catch (error: any) {
    console.error('❌ Failed to fix product images:', error)
    return NextResponse.json(
      { error: 'Failed to fix product images', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Just check current product images
    const checkQuery = `
      SELECT id, name, image_url 
      FROM products 
      WHERE is_active = 1
      ORDER BY id
    `
    
    const [products] = await executeQuery(checkQuery)
    
    return NextResponse.json({
      success: true,
      products: products
    })
    
  } catch (error: any) {
    console.error('❌ Failed to check product images:', error)
    return NextResponse.json(
      { error: 'Failed to check product images', details: error.message },
      { status: 500 }
    )
  }
}