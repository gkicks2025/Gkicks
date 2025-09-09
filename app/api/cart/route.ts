import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🚫 CART: No valid authorization header found')
      return null
    }

    const token = authHeader.substring(7)
    console.log('🔍 CART: Token received:', token.substring(0, 50) + '...')
    console.log('🔍 CART: Token length:', token.length)
    console.log('🔍 CART: Token parts:', token.split('.').length)
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, email: string }
    console.log('✅ CART: Token verified successfully for user:', decoded.userId)
    return { id: decoded.userId, email: decoded.email }
  } catch (error) {
    console.error('❌ CART: Token verification failed:', error)
    console.error('❌ CART: Token that failed:', authHeader?.substring(7, 57) + '...')
    return null
  }
}

interface CartItem {
  id: string
  name: string
  price: number
  image: string
  size: string
  quantity: number
  color?: string
  brand?: string
}

// GET - Fetch user's cart items
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🛒 API: Fetching cart items for user:', user.id)
    
    // Fetch cart items with product details
    const cartItems = await executeQuery(
      `SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        ci.size,
        ci.color,
        p.id,
        p.name,
        p.brand,
        p.price,
        p.image_url as image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ? AND p.is_active = 1
      ORDER BY ci.created_at DESC`,
      [user.id]
    ) as any[]

    // Format cart items to match frontend interface
    const formattedItems = cartItems.map((item: any) => ({
      id: item.id.toString(),
      name: item.name,
      price: parseFloat(item.price),
      image: item.image || '/placeholder.svg',
      size: item.size,
      quantity: item.quantity,
      color: item.color,
      brand: item.brand
    }))

    console.log(`✅ API: Successfully returned ${formattedItems.length} cart items`)
    return NextResponse.json(formattedItems)

  } catch (error) {
    console.error('❌ API: Error fetching cart items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart items' },
      { status: 500 }
    )
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { productId, size, color, quantity = 1 } = await request.json()

    if (!productId || !size) {
      return NextResponse.json(
        { error: 'Product ID and size are required' },
        { status: 400 }
      )
    }

    console.log('🛒 API: Adding item to cart for user:', user.id, 'Product:', productId)

    // Check if item already exists in cart
    const existingItem = await executeQuery(
      `SELECT id, quantity FROM cart_items 
       WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?`,
      [user.id, productId, size, color || '']
    ) as any[]

    if (existingItem.length > 0) {
      // Update quantity if item exists
      const newQuantity = existingItem[0].quantity + quantity
      await executeQuery(
        `UPDATE cart_items SET quantity = ?, updated_at = NOW() 
         WHERE id = ?`,
        [newQuantity, existingItem[0].id]
      )
      console.log('✅ API: Updated cart item quantity')
    } else {
      // Add new item to cart
      await executeQuery(
        `INSERT INTO cart_items (user_id, product_id, quantity, size, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [user.id, productId, quantity, size, color || '']
      )
      console.log('✅ API: Added new item to cart')
    }

    // Return updated cart items
    const cartItems = await executeQuery(
      `SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        ci.size,
        ci.color,
        p.id,
        p.name,
        p.brand,
        p.price,
        p.image_url as image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ? AND p.is_active = 1
      ORDER BY ci.created_at DESC`,
      [user.id]
    ) as any[]

    const formattedItems = cartItems.map((item: any) => ({
      id: item.id.toString(),
      name: item.name,
      price: parseFloat(item.price),
      image: item.image || '/placeholder.svg',
      size: item.size,
      quantity: item.quantity,
      color: item.color,
      brand: item.brand
    }))

    return NextResponse.json(formattedItems)

  } catch (error) {
    console.error('❌ API: Error adding item to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

// PUT - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { productId, size, color, quantity } = await request.json()

    if (!productId || !size || quantity === undefined) {
      return NextResponse.json(
        { error: 'Product ID, size, and quantity are required' },
        { status: 400 }
      )
    }

    console.log('🛒 API: Updating cart item quantity for user:', user.id)

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      await executeQuery(
        `DELETE FROM cart_items 
         WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?`,
        [user.id, productId, size, color || '']
      )
      console.log('✅ API: Removed cart item')
    } else {
      // Update quantity
      const result = await executeQuery(
        `UPDATE cart_items SET quantity = ?, updated_at = NOW() 
         WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?`,
        [quantity, user.id, productId, size, color || '']
      ) as any

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: 'Cart item not found' },
          { status: 404 }
        )
      }
      console.log('✅ API: Updated cart item quantity')
    }

    // Return updated cart items
    const cartItems = await executeQuery(
      `SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        ci.size,
        ci.color,
        p.id,
        p.name,
        p.brand,
        p.price,
        p.image_url as image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ? AND p.is_active = 1
      ORDER BY ci.created_at DESC`,
      [user.id]
    ) as any[]

    const formattedItems = cartItems.map((item: any) => ({
      id: item.id.toString(),
      name: item.name,
      price: parseFloat(item.price),
      image: item.image || '/placeholder.svg',
      size: item.size,
      quantity: item.quantity,
      color: item.color,
      brand: item.brand
    }))

    return NextResponse.json(formattedItems)

  } catch (error) {
    console.error('❌ API: Error updating cart item:', error)
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

// DELETE - Remove item from cart or clear entire cart
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const size = searchParams.get('size')
    const color = searchParams.get('color')
    const clearAll = searchParams.get('clearAll')

    console.log('🛒 API: Removing cart item(s) for user:', user.id)

    if (clearAll === 'true') {
      // Clear entire cart
      await executeQuery(
        `DELETE FROM cart_items WHERE user_id = ?`,
        [user.id]
      )
      console.log('✅ API: Cleared entire cart')
      return NextResponse.json({ success: true, items: [] })
    } else if (productId && size) {
      // Remove specific item
      const result = await executeQuery(
        `DELETE FROM cart_items 
         WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?`,
        [user.id, productId, size, color || '']
      ) as any

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: 'Cart item not found' },
          { status: 404 }
        )
      }
      console.log('✅ API: Removed cart item')
    } else {
      return NextResponse.json(
        { error: 'Product ID and size are required, or use clearAll=true' },
        { status: 400 }
      )
    }

    // Return updated cart items
    const cartItems = await executeQuery(
      `SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        ci.size,
        ci.color,
        p.id,
        p.name,
        p.brand,
        p.price,
        p.image_url as image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ? AND p.is_active = 1
      ORDER BY ci.created_at DESC`,
      [user.id]
    ) as any[]

    const formattedItems = cartItems.map((item: any) => ({
      id: item.id.toString(),
      name: item.name,
      price: parseFloat(item.price),
      image: item.image || '/placeholder.svg',
      size: item.size,
      quantity: item.quantity,
      color: item.color,
      brand: item.brand
    }))

    return NextResponse.json({ success: true, items: formattedItems })

  } catch (error) {
    console.error('❌ API: Error removing cart item:', error)
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}