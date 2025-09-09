import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql-simulator';

const sampleProducts = [
  {
    name: 'Air Max 97 SE',
    brand: 'Nike',
    category: 'men',
    price: 8999,
    original_price: 9999,
    image_url: '/images/air-max-97-se.png',
    description: 'The Nike Air Max 97 SE brings the celebrated design into the modern era with premium materials and updated colorways.',
    is_new: true,
    is_sale: true,
    is_active: true,
    stock_quantity: 50,
    colors: JSON.stringify(['Black', 'White', 'Red']),
    sku: 'NIKE-AM97-SE-001'
  },
  {
    name: 'UltraBoost 23',
    brand: 'Adidas',
    category: 'unisex',
    price: 9499,
    original_price: 9499,
    image_url: '/images/ultraboost-23.png',
    description: 'Experience incredible energy return with every step in the UltraBoost 23.',
    is_new: false,
    is_sale: false,
    is_active: true,
    stock_quantity: 35,
    colors: JSON.stringify(['Black', 'White', 'Blue']),
    sku: 'ADIDAS-UB23-002'
  },
  {
    name: 'Fresh Foam X',
    brand: 'New Balance',
    category: 'women',
    price: 7299,
    original_price: 7299,
    image_url: '/images/fresh-foam-x.png',
    description: 'Soft, comfortable cushioning for your daily runs with Fresh Foam X technology.',
    is_new: true,
    is_sale: false,
    is_active: true,
    stock_quantity: 42,
    colors: JSON.stringify(['Pink', 'White', 'Grey']),
    sku: 'NB-FFX-003'
  },
  {
    name: 'Chuck Taylor All Star',
    brand: 'Converse',
    category: 'unisex',
    price: 3299,
    original_price: 3299,
    image_url: '/images/chuck-taylor.png',
    description: 'The iconic Chuck Taylor All Star sneaker that started it all.',
    is_new: false,
    is_sale: false,
    is_active: true,
    stock_quantity: 60,
    colors: JSON.stringify(['Black', 'White', 'Red']),
    sku: 'CONVERSE-CT-004'
  },
  {
    name: 'Air Force 1',
    brand: 'Nike',
    category: 'unisex',
    price: 5499,
    original_price: 6499,
    image_url: '/images/air-force-1.png',
    description: 'The classic Air Force 1 with timeless style and comfort.',
    is_new: false,
    is_sale: true,
    is_active: true,
    stock_quantity: 25,
    colors: JSON.stringify(['White', 'Black']),
    sku: 'NIKE-AF1-005'
  }
];

export async function POST() {
  try {
    // First, create the products table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        image_url TEXT,
        rating DECIMAL(3,2) DEFAULT 0,
        reviews INTEGER DEFAULT 0,
        colors TEXT,
        color_images TEXT,
        is_new BOOLEAN DEFAULT FALSE,
        is_sale BOOLEAN DEFAULT FALSE,
        views INTEGER DEFAULT 0,
        category TEXT NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        sku TEXT UNIQUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await executeQuery(createTableQuery);
    console.log('✅ Products table created successfully');
    
    // Clear existing products
    await executeQuery('DELETE FROM products');
    console.log('✅ Existing products cleared');
    
    // Insert sample products
    for (const product of sampleProducts) {
      const insertQuery = `
        INSERT INTO products (
          name, brand, category, price, original_price, image_url, 
          description, is_new, is_sale, is_active, stock_quantity, colors, sku
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await executeQuery(insertQuery, [
        product.name,
        product.brand,
        product.category,
        product.price,
        product.original_price,
        product.image_url,
        product.description,
        product.is_new ? 1 : 0,
        product.is_sale ? 1 : 0,
        product.is_active ? 1 : 0,
        product.stock_quantity,
        product.colors,
        product.sku
      ]);
    }
    
    console.log(`✅ Inserted ${sampleProducts.length} sample products`);
    
    return NextResponse.json({
      success: true,
      message: `Database initialized successfully with ${sampleProducts.length} products`,
      productsCount: sampleProducts.length
    });
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database initialization failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}