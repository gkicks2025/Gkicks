import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

interface JWTPayload {
  userId: number
  email: string
  role: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    // Verify JWT token
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    
    if (!decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { id: orderId } = await params

    // First, check if the order exists and belongs to the user
    const orderQuery = `
      SELECT id, user_id, status 
      FROM orders 
      WHERE id = ? AND user_id = ?
    `
    const orderRows = await executeQuery(orderQuery, [orderId, decoded.userId])
    const orders = orderRows as any[]

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      )
    }

    const order = orders[0]

    // Check if order can be cancelled (only pending or processing orders)
    if (order.status !== 'pending' && order.status !== 'processing') {
      return NextResponse.json(
        { error: 'Order cannot be cancelled. Only pending or processing orders can be cancelled.' },
        { status: 400 }
      )
    }

    // Update order status to cancelled
    const updateQuery = `
      UPDATE orders 
      SET status = 'cancelled', updated_at = NOW() 
      WHERE id = ? AND user_id = ?
    `
    await executeQuery(updateQuery, [orderId, decoded.userId])

    return NextResponse.json(
      { 
        message: 'Order cancelled successfully',
        orderId: orderId,
        status: 'cancelled'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ Cancel order error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    )
  }
}