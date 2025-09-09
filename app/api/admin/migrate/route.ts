import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import path from 'path';

// SQLite database path
const sqliteDbPath = path.join(process.cwd(), 'database', 'gkicks.db');

// MySQL connection configuration
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'gkicks',
  ssl: process.env.MYSQL_SSL === 'true' ? {
    rejectUnauthorized: false
  } : undefined
};

// Test database connections
export async function GET() {
  try {
    console.log('🧪 Testing database connections...');
    
    // Test SQLite
    const sqliteDb = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY);
    const sqliteCount = await new Promise<number>((resolve, reject) => {
      sqliteDb.get('SELECT COUNT(*) as count FROM products', (err: any, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
    sqliteDb.close();
    console.log(`✅ SQLite: Found ${sqliteCount} products`);
    
    // Test MySQL
    const connection = await mysql.createConnection(mysqlConfig);
    await connection.execute('SELECT 1');
    console.log('✅ MySQL connection test successful');
    await connection.end();
    
    return NextResponse.json({
      success: true,
      message: 'Database connections tested successfully',
      sqliteProducts: sqliteCount,
      mysqlConnected: true
    });
  } catch (error: any) {
    console.error('❌ Connection test failed:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Migrate data from SQLite to MySQL
export async function POST() {
  let sqliteDb: any;
  let mysqlConnection: any;
  
  try {
    console.log('🚀 Starting data migration from SQLite to MySQL...');
    
    // Connect to SQLite
    console.log('📂 Connecting to SQLite database...');
    sqliteDb = new sqlite3.Database(sqliteDbPath, (err: any) => {
      if (err) {
        console.error('❌ SQLite connection failed:', err.message);
        throw err;
      }
      console.log('✅ Connected to SQLite database');
    });
    
    // Connect to MySQL
    console.log('🔗 Connecting to MySQL database...');
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Connected to MySQL database');
    
    // Test MySQL connection
    await mysqlConnection.execute('SELECT 1');
    console.log('✅ MySQL connection test successful');
    
    // Create MySQL schema first
    console.log('🏗️ Creating MySQL schema...');
    
    // Create products table
    await mysqlConnection.execute(`
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
    
    console.log('✅ MySQL schema created successfully');
    
    // Get data from SQLite
    console.log('📊 Fetching data from SQLite...');
    const sqliteData = await new Promise<any[]>((resolve, reject) => {
      sqliteDb.all(`
        SELECT 
          id, name, brand, description, price, original_price,
          image_url, rating, reviews, colors, color_images,
          is_new, is_sale, views, category, stock_quantity,
          sku, is_active, is_deleted, created_at, updated_at
        FROM products 
        WHERE is_deleted = 0 OR is_deleted IS NULL
        ORDER BY id
      `, (err: any, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    
    console.log(`📋 Found ${sqliteData.length} products in SQLite database`);
    
    if (sqliteData.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products found in SQLite database to migrate',
        migrated: 0
      });
    }
    
    // Clear existing data in MySQL
    console.log('🧹 Clearing existing products in MySQL...');
    await mysqlConnection.execute('DELETE FROM products');
    await mysqlConnection.execute('ALTER TABLE products AUTO_INCREMENT = 1');
    
    // Insert data into MySQL
    console.log('📥 Inserting data into MySQL...');
    
    const insertQuery = `
      INSERT INTO products (
        name, brand, description, price, original_price,
        image_url, rating, reviews, colors, color_images,
        is_new, is_sale, views, category, stock_quantity,
        sku, is_active, is_deleted, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of sqliteData) {
      try {
        // Prepare data for MySQL
        const mysqlData = [
          product.name,
          product.brand,
          product.description,
          product.price,
          product.original_price,
          product.image_url,
          product.rating || 0,
          product.reviews || 0,
          product.colors, // Keep as JSON string
          product.color_images, // Keep as JSON string
          product.is_new ? 1 : 0,
          product.is_sale ? 1 : 0,
          product.views || 0,
          product.category || 'unisex',
          product.stock_quantity || 0,
          product.sku,
          product.is_active ? 1 : 0,
          product.is_deleted ? 1 : 0,
          product.created_at,
          product.updated_at
        ];
        
        await mysqlConnection.execute(insertQuery, mysqlData);
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`✅ Migrated ${successCount} products...`);
        }
      } catch (err: any) {
        console.error(`❌ Failed to migrate product ${product.id}:`, err.message);
        errorCount++;
      }
    }
    
    // Verify migration
    console.log('🔍 Verifying migration...');
    const [mysqlRows]: any = await mysqlConnection.execute('SELECT COUNT(*) as count FROM products WHERE is_deleted = 0');
    const mysqlCount = mysqlRows[0].count;
    
    console.log(`📊 Products in MySQL: ${mysqlCount}`);
    console.log(`📊 Products migrated: ${successCount}`);
    
    const migrationSuccess = mysqlCount === successCount;
    
    return NextResponse.json({
      success: true,
      message: `Migration completed! Successfully migrated ${successCount} products to MySQL`,
      summary: {
        totalProcessed: sqliteData.length,
        successfulMigrations: successCount,
        failedMigrations: errorCount,
        mysqlProductCount: mysqlCount,
        verificationPassed: migrationSuccess
      }
    });
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  } finally {
    // Close connections
    if (sqliteDb) {
      sqliteDb.close((err: any) => {
        if (err) {
          console.error('❌ Error closing SQLite connection:', err.message);
        } else {
          console.log('✅ SQLite connection closed');
        }
      });
    }
    
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log('✅ MySQL connection closed');
    }
  }
}