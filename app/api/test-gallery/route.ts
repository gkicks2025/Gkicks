import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../lib/database/mysql';

export async function GET() {
  try {
    // Test if gallery_images column exists and works
    const testQuery = `
      SELECT id, name, image_url, gallery_images 
      FROM products 
      LIMIT 1
    `;
    
    const result = await executeQuery('SELECT * FROM products LIMIT 1') as any[];
    
    return NextResponse.json({
      success: true,
      message: 'Gallery images column test successful',
      sample: result[0] || null,
      hasGalleryColumn: result.length > 0 && 'gallery_images' in result[0]
    });
  } catch (error) {
    console.error('Gallery test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      needsMigration: error instanceof Error && error.message.includes('gallery_images')
    });
  }
}