import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Adding status column to products table...');
    
    try {
      // Check if status column already exists
      console.log('🔍 Checking if status column exists...');
      const columns = await executeQuery(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'gkicks' AND TABLE_NAME = 'products' AND COLUMN_NAME = 'status'"
      ) as any[];
      
      if (columns.length > 0) {
        console.log('✅ Status column already exists!');
        return NextResponse.json({ 
          success: true, 
          message: 'Status column already exists',
          alreadyExists: true 
        });
      }
      
      // Add status column
      console.log('➕ Adding status column...');
      await executeQuery(
        "ALTER TABLE products ADD COLUMN status ENUM('Active', 'Inactive', 'Discontinued') DEFAULT 'Active'"
      );
      
      // Update existing products to have 'Active' status
      console.log('🔄 Updating existing products with Active status...');
      const updateResult = await executeQuery(
        "UPDATE products SET status = 'Active' WHERE status IS NULL"
      ) as any;
      
      console.log(`✅ Updated ${updateResult.affectedRows} existing products`);
      
      // Verify the column was added
      const verifyColumns = await executeQuery(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'gkicks' AND TABLE_NAME = 'products' AND COLUMN_NAME = 'status'"
      ) as any[];
      
      if (verifyColumns.length > 0) {
        console.log('✅ Status column successfully added and verified!');
        return NextResponse.json({ 
          success: true, 
          message: 'Status column added successfully',
          updatedRows: updateResult.affectedRows
        });
      } else {
        throw new Error('Failed to verify status column creation');
      }
      
    } catch (innerError: any) {
      console.error('❌ Inner error:', innerError);
      return NextResponse.json(
        { 
          success: false, 
          error: innerError instanceof Error ? innerError.message : 'Unknown error occurred' 
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('❌ Error adding status column:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}