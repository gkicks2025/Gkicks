import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// MySQL connection configuration (without database for initial setup)
const mysqlConfigWithoutDB = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  ssl: process.env.MYSQL_SSL === 'true' ? {
    rejectUnauthorized: false
  } : undefined
};

// MySQL connection configuration (with database)
const mysqlConfigWithDB = {
  ...mysqlConfigWithoutDB,
  database: 'gkicks'
};

// Create database and schema
export async function POST() {
  let connection: any;
  
  try {
    console.log('🏗️ Setting up MySQL database and schema...');
    
    // Connect to MySQL (without specifying database)
    console.log('🔗 Connecting to MySQL server...');
    connection = await mysql.createConnection(mysqlConfigWithoutDB);
    console.log('✅ Connected to MySQL server');
    
    // Create database if it doesn't exist
    console.log('📊 Creating database...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS gkicks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ Database "gkicks" created or already exists');
    
    // Close initial connection and reconnect with database
    await connection.end();
    console.log('🔄 Reconnecting with database...');
    connection = await mysql.createConnection(mysqlConfigWithDB);
    console.log('✅ Connected to gkicks database');
    
    // Create tables
    console.log('🏗️ Creating tables...');
    
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        date_of_birth DATE,
        gender ENUM('male', 'female', 'other'),
        avatar_url TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');
    
    // Create categories table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        image_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Categories table created');
    
    // Create products table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        image_url TEXT,
        rating DECIMAL(3,2) DEFAULT 0,
        reviews INT DEFAULT 0,
        colors JSON,
        color_images JSON,
        sizes JSON,
        is_new BOOLEAN DEFAULT FALSE,
        is_sale BOOLEAN DEFAULT FALSE,
        views INT DEFAULT 0,
        category VARCHAR(50) DEFAULT 'unisex',
        stock_quantity INT DEFAULT 0,
        sku VARCHAR(100) UNIQUE,
        is_active BOOLEAN DEFAULT TRUE,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_brand (brand),
        INDEX idx_active (is_active),
        INDEX idx_deleted (is_deleted)
      )
    `);
    console.log('✅ Products table created');
    
    // Create cart_items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        size VARCHAR(10),
        color VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Cart items table created');
    
    // Create wishlist_items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_wishlist_item (user_id, product_id)
      )
    `);
    console.log('✅ Wishlist items table created');
    
    // Create orders table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        total_amount DECIMAL(10,2) NOT NULL,
        shipping_address JSON,
        billing_address JSON,
        payment_method VARCHAR(50),
        payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Orders table created');
    
    // Create order_items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        size VARCHAR(10),
        color VARCHAR(50),
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Order items table created');
    
    // Insert sample categories
    await connection.execute(`
      INSERT IGNORE INTO categories (name, slug, description) VALUES
      ('Men', 'men', 'Footwear for men'),
      ('Women', 'women', 'Footwear for women'),
      ('Kids', 'kids', 'Footwear for children'),
      ('Unisex', 'unisex', 'Footwear for everyone')
    `);
    console.log('✅ Sample categories inserted');
    
    // Create additional indexes
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at)');
    console.log('✅ Additional indexes created');
    
    // Get table count
    const [tables]: any = await connection.execute('SHOW TABLES');
    const tableCount = tables.length;
    
    console.log(`✅ Database setup completed! Created ${tableCount} tables`);
    
    return NextResponse.json({
      success: true,
      message: `MySQL database and schema setup completed successfully! Created ${tableCount} tables.`,
      tables: tables.map((t: any) => Object.values(t)[0])
    });
    
  } catch (error: any) {
    console.error('❌ Database setup failed:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ MySQL connection closed');
    }
  }
}