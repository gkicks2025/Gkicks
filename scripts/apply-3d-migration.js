const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'gkicks',
  ssl: process.env.MYSQL_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
};

async function applyMigration() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database');
    
    // Check if columns already exist
    console.log('🔍 Checking if 3D model columns exist...');
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME IN ('model_3d_url', 'model_3d_filename')",
      [dbConfig.database]
    );
    
    if (columns.length > 0) {
      console.log('ℹ️  3D model columns already exist. Migration not needed.');
      return;
    }
    
    console.log('🔄 Adding 3D model columns to products table...');
    
    // Add 3D model URL field
    await connection.execute(
      "ALTER TABLE products ADD COLUMN model_3d_url TEXT AFTER gallery_images"
    );
    console.log('✅ Added model_3d_url column');
    
    // Add 3D model filename field
    await connection.execute(
      "ALTER TABLE products ADD COLUMN model_3d_filename VARCHAR(255) AFTER model_3d_url"
    );
    console.log('✅ Added model_3d_filename column');
    
    // Add comments
    await connection.execute(
      "ALTER TABLE products MODIFY COLUMN model_3d_url TEXT COMMENT '3D model file URL path'"
    );
    
    await connection.execute(
      "ALTER TABLE products MODIFY COLUMN model_3d_filename VARCHAR(255) COMMENT 'Original filename of the 3D model'"
    );
    console.log('✅ Added column comments');
    
    // Create index
    await connection.execute(
      "CREATE INDEX idx_has_3d_model ON products (model_3d_url(100))"
    );
    console.log('✅ Created index for 3D model queries');
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
applyMigration();