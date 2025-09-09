import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql'
import jwt from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    console.log('Received token length:', token.length);
    console.log('Token preview:', token.substring(0, 50) + '...');
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, email: string };
    return { id: decoded.userId, email: decoded.email };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const productId = parseInt(id)
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }

    console.log('🔍 API: Fetching product by ID from MySQL database...', productId)
    
    const results = await executeQuery(
      `SELECT * FROM products WHERE id = ? AND is_active = 1 AND is_deleted = 0`,
      [productId]
    ) as any[]
    
    const product = results[0]

    if (!product) {
      console.log('❌ API: Product not found:', productId)
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    console.log('✅ API: Successfully fetched product from database:', product.name)
    
    // Parse JSON fields if they exist
    const parsedProduct = {
      ...product,
      colors: product.colors ? JSON.parse(product.colors) : [],
      color_images: product.color_images ? JSON.parse(product.color_images) : {},
      variants: product.variants ? JSON.parse(product.variants) : {},
      gallery_images: product.gallery_images ? JSON.parse(product.gallery_images) : []
    }

    return NextResponse.json(parsedProduct)

  } catch (error) {
    console.error('❌ API: Error fetching product by ID:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params
    const productId = parseInt(id)
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }

    const body = await request.json();
    const {
      name,
      brand,
      price,
      originalPrice,
      original_price, // Handle both camelCase and snake_case
      category,
      sku,
      stock_quantity,
      image_url,
      gallery_images,
      description,
      is_active,
      is_new,
      is_sale,
      colors,
      sizes,
      low_stock_threshold,
      model_3d_url,
      model_3d_filename
    } = body;

    // Validate required fields
    if (!name || !brand || price === undefined || !category) {
      return NextResponse.json(
        { error: 'Name, brand, price, and category are required' },
        { status: 400 }
      );
    }

    console.log('🔄 API: Updating product:', productId);

    // Update product in MySQL database
    const updateQuery = `
      UPDATE products SET
        name = ?,
        brand = ?,
        price = ?,
        original_price = ?,
        category = ?,
        sku = ?,
        stock_quantity = ?,
        low_stock_threshold = ?,
        image_url = ?,
        gallery_images = ?,
        description = ?,
        is_active = ?,
        is_new = ?,
        is_sale = ?,
        colors = ?,
        sizes = ?,
        model_3d_url = ?,
        model_3d_filename = ?,
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `;

    const params = [
      name,
      brand,
      parseFloat(price),
      (originalPrice || original_price) ? parseFloat(originalPrice || original_price) : null,
      category,
      sku || `${brand.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      parseInt(stock_quantity) || 0,
      parseInt(low_stock_threshold) || 10,
      image_url || '/placeholder-product.jpg',
      JSON.stringify(gallery_images || []),
      description || '',
      is_active !== false,
      is_new || false,
      is_sale || false,
      JSON.stringify(colors || []),
      JSON.stringify(sizes || []),
      model_3d_url || null,
      model_3d_filename || null,
      productId
    ];

    const result = await executeQuery(updateQuery, params);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Product not found or no changes made' },
        { status: 404 }
      );
    }

    console.log('✅ API: Product updated successfully:', productId);

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      productId: productId
    });

  } catch (error) {
    console.error('❌ API: Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// PATCH - Update specific product fields (like stock)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params
    const productId = parseInt(id)
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }

    const body = await request.json();
    const { stock_quantity, stock_update_reason, low_stock_threshold, variants } = body;

    console.log('🔄 API: Updating product stock:', productId, 'New quantity:', stock_quantity);

    // Build dynamic update query based on provided fields
    const updateFields = [];
    const params = [];

    if (stock_quantity !== undefined) {
      updateFields.push('stock_quantity = ?');
      params.push(parseInt(stock_quantity));
    }

    if (low_stock_threshold !== undefined) {
      updateFields.push('low_stock_threshold = ?');
      params.push(parseInt(low_stock_threshold));
    }

    if (variants !== undefined) {
      updateFields.push('variants = ?');
      params.push(variants);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updateFields.push('updated_at = NOW()');
    params.push(productId);

    const updateQuery = `
      UPDATE products SET
        ${updateFields.join(', ')}
      WHERE id = ? AND is_deleted = 0
    `;

    const result = await executeQuery(updateQuery, params);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Product not found or no changes made' },
        { status: 404 }
      );
    }

    // Log stock update if reason provided
    if (stock_update_reason && stock_quantity !== undefined) {
      console.log(`📝 Stock update logged: Product ${productId}, Quantity: ${stock_quantity}, Reason: ${stock_update_reason}`);
      // TODO: Add to stock_updates log table if needed
    }

    console.log('✅ API: Product stock updated successfully:', productId);

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      productId: productId,
      stock_quantity: stock_quantity
    });

  } catch (error) {
    console.error('❌ API: Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params
    const productId = parseInt(id)
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }

    console.log('🗑️ API: Deleting product:', productId);

    // Soft delete the product
    const deleteQuery = `
      UPDATE products SET
        is_deleted = 1,
        is_active = 0,
        updated_at = NOW()
      WHERE id = ?
    `;

    const result = await executeQuery(deleteQuery, [productId]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('✅ API: Product deleted successfully:', productId);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('❌ API: Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}