import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database data for analytics...')
    
    // Check orders table
    const orders = await executeQuery('SELECT COUNT(*) as count FROM orders')
    console.log('Orders count:', orders)
    
    // Check products table
    const products = await executeQuery('SELECT COUNT(*) as count FROM products')
    console.log('Products count:', products)
    
    // Check users table
    const users = await executeQuery('SELECT COUNT(*) as count FROM users')
    console.log('Users count:', users)
    
    // Check if there are any completed orders
    const completedOrders = await executeQuery(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE status IN ('completed', 'delivered')
    `)
    console.log('Completed orders:', completedOrders)
    
    return NextResponse.json({
      orders: (orders as any[])[0],
      products: (products as any[])[0],
      users: (users as any[])[0],
      completedOrders: (completedOrders as any[])[0]
    })
  } catch (error) {
    console.error('❌ Test data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}