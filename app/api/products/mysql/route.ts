import { NextRequest, NextResponse } from 'next/server';
import {
  testConnection,
  getAllProducts,
  getProductById,
  insertProduct,
  updateProduct,
  deleteProduct
} from '@/lib/database/mysql';

// Product interface
interface Product {
  id: number;
  name: string;
  brand: string;
  description: string;
  price: number;
  original_price?: number;
  image_url: string;
  rating: number;
  reviews: number;
  colors: string[];
  color_images?: { [key: string]: string };
  sizes?: string[];
  isNew: boolean;
  isSale: boolean;
  views: number;
  category: string;
  stock_quantity: number;
  sku: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// GET - Fetch all products from MySQL
export async function GET(request: NextRequest) {
  try {
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed'
        },
        { status: 500 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Get single product
      const product = await getProductById(parseInt(id));
      
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: product
      });
    } else {
      // Get all products
      const products = await getAllProducts();
      
      return NextResponse.json({
        success: true,
        data: products
      });
    }
  } catch (error) {
    console.error('MySQL API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new product in MySQL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }
    
    const productData = {
      name: body.name,
      description: body.description || '',
      price: parseFloat(body.price),
      image_url: body.image_url || '',
      category_id: body.category_id || null,
      stock_quantity: parseInt(body.stock_quantity) || 0,
      is_featured: Boolean(body.is_featured)
    };
    
    const insertId = await insertProduct(productData);
    
    return NextResponse.json({
      success: true,
      data: {
        id: insertId,
        ...productData
      }
    }, { status: 201 });
  } catch (error) {
    console.error('MySQL API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update product in MySQL
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const success = await updateProduct(parseInt(id), body);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Product not found or update failed' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('MySQL API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete product from MySQL (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    const success = await deleteProduct(parseInt(id));
    
    if (!success) {
      return NextResponse.json(
        { error: 'Product not found or delete failed' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('MySQL API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}