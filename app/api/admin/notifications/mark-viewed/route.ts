import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get session to verify admin user
    const session = await getServerSession(authOptions);
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orderIds } = await request.json();
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order IDs are required' },
        { status: 400 }
      );
    }

    console.log(`🔔 API: Marking ${orderIds.length} notifications as viewed for admin user ${(session!.user as any).id}`);
    
    // Insert viewed records for each order (using INSERT IGNORE to avoid duplicates)
    const values = orderIds.map(orderId => `(${(session!.user as any).id}, ${orderId})`).join(', ');
    
    const insertSQL = `
      INSERT IGNORE INTO notification_views (admin_user_id, order_id)
      VALUES ${values}
    `;
    
    await executeQuery(insertSQL, []);
    
    console.log(`✅ API: Successfully marked ${orderIds.length} notifications as viewed`);
    
    return NextResponse.json({
      success: true,
      message: `Marked ${orderIds.length} notifications as viewed`
    });
    
  } catch (error) {
    console.error('❌ API: Error marking notifications as viewed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark notifications as viewed' },
      { status: 500 }
    );
  }
}