import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import jwt from 'jsonwebtoken'

interface UpdateStockRequest {
  productId: string
  color: string
  size: string
  quantity: number
}

interface VariantSizes {
  [size: string]: number
}

interface ColorVariant {
  sizes: VariantSizes
}

interface ProductVariants {
  [color: string]: ColorVariant
}

// POST - Update product stock after sale
export async function POST(request: NextRequest) {
  try {
    // Check for JWT token first
    const authHeader = request.headers.get('authorization');
    let userEmail = null;
    let userRole = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        userEmail = decoded.email;
        userRole = decoded.role;
      } catch (error) {
        console.error('JWT verification failed:', error);
      }
    }
    
    // Fallback to session if JWT not available or invalid
    if (!userEmail) {
      const session = await getServerSession(authOptions);
      if (session && session.user) {
        userEmail = session.user.email;
        userRole = (session.user as any).role;
      }
    }
    
    if (!userEmail || (userRole !== 'admin' && userRole !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateStockRequest = await request.json()
    const { productId, color, size, quantity } = body

    if (!productId || !color || !size || !quantity) {
      return NextResponse.json(
        { error: 'Product ID, color, size, and quantity are required' },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      )
    }

    console.log(`🔄 POS STOCK UPDATE: Updating stock for product ${productId}, ${color}, size ${size}, quantity: -${quantity}`)

    // First, get the current product data
    const productQuery = 'SELECT variants, stock_quantity FROM products WHERE id = ?'
    const productResult = await executeQuery(productQuery, [productId]) as { variants: string | null; stock_quantity: number }[]
    
    if (!productResult || productResult.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const product = productResult[0]
    let variants: ProductVariants = {}
    
    // Parse existing variants
    if (product.variants) {
      try {
        variants = JSON.parse(product.variants)
      } catch (error) {
        console.error('Error parsing variants:', error)
        variants = {}
      }
    }

    // Update the specific variant stock
    if (!variants[color]) {
      variants[color] = { sizes: {} }
    }
    if (!variants[color].sizes) {
      variants[color].sizes = {}
    }

    const currentStock = variants[color].sizes[size] || 0
    const newStock = Math.max(0, currentStock - quantity)
    variants[color].sizes[size] = newStock

    console.log(`📦 Stock update: ${color} size ${size}: ${currentStock} → ${newStock}`)

    // Calculate total stock across all variants
    let totalStock = 0
    Object.values(variants).forEach((colorVariant) => {
      if (colorVariant && typeof colorVariant === 'object' && 'sizes' in colorVariant) {
        const sizes = colorVariant.sizes as Record<string, number>
        Object.values(sizes).forEach((stock) => {
          if (typeof stock === 'number') {
            totalStock += stock
          }
        })
      }
    })

    // Update the product with new variants and total stock
    const updateQuery = `
      UPDATE products 
      SET variants = ?, stock_quantity = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    
    await executeQuery(updateQuery, [
      JSON.stringify(variants),
      totalStock,
      productId
    ])

    console.log(`✅ POS STOCK UPDATE: Successfully updated stock. Total stock: ${totalStock}`)

    return NextResponse.json({
      success: true,
      message: 'Stock updated successfully',
      newStock,
      totalStock,
      variants
    })

  } catch (error) {
    console.error('❌ POS STOCK UPDATE: Error updating stock:', error)
    return NextResponse.json(
      { error: 'Failed to update stock' },
      { status: 500 }
    )
  }
}