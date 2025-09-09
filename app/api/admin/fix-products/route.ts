import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/database/mysql';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing products with missing SKU and stock data...');
    
    // Get all products that need fixing
    const products = await executeQuery(`
      SELECT id, name, brand, sku, stock_quantity 
      FROM products 
      WHERE is_active = 1
    `) as any[];
    
    console.log(`📦 Found ${products.length} products to check`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      let needsUpdate = false;
      let updateFields = [];
      let updateValues = [];
      
      // Fix missing or empty SKU
      if (!product.sku || product.sku.trim() === '') {
        const sku = `${product.brand.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}-${product.id.toString().padStart(3, '0')}`;
        updateFields.push('sku = ?');
        updateValues.push(sku);
        needsUpdate = true;
        console.log(`🏷️ Generated SKU for ${product.name}: ${sku}`);
      }
      
      // Fix missing stock_quantity
      if (product.stock_quantity === null || product.stock_quantity === undefined) {
        const stockQuantity = Math.floor(Math.random() * 50) + 10; // Random stock between 10-59
        updateFields.push('stock_quantity = ?');
        updateValues.push(stockQuantity);
        needsUpdate = true;
        console.log(`📊 Set stock for ${product.name}: ${stockQuantity}`);
      }
      
      // Note: low_stock_threshold column doesn't exist in current schema
      
      if (needsUpdate) {
        const updateQuery = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
        updateValues.push(product.id);
        
        await executeQuery(updateQuery, updateValues);
        updatedCount++;
      }
    }
    
    console.log(`✅ Updated ${updatedCount} products with missing data`);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} products`,
      totalProducts: products.length,
      updatedProducts: updatedCount
    });
    
  } catch (error: any) {
    console.error('❌ Error fixing products:', error);
    return NextResponse.json(
      { error: 'Failed to fix products' },
      { status: 500 }
    );
  }
}