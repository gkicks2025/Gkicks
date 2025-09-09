const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Database configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306'),
  user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'gkicks',
  ssl: process.env.MYSQL_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
};

async function addPaymentScreenshotField() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database');
    
    // Check if column already exists
    console.log('🔍 Checking if payment_screenshot column exists...');
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_screenshot'",
      [dbConfig.database]
    );
    
    if (columns.length > 0) {
      console.log('ℹ️  payment_screenshot column already exists. Migration not needed.');
      return;
    }
    
    console.log('🔄 Adding payment_screenshot column to orders table...');
    
    // Add payment_screenshot field
    await connection.execute(
      "ALTER TABLE orders ADD COLUMN payment_screenshot TEXT AFTER payment_status"
    );
    console.log('✅ Added payment_screenshot column');
    
    // Add comment separately (MariaDB compatible)
    try {
      await connection.execute(
        "ALTER TABLE orders MODIFY COLUMN payment_screenshot TEXT COMMENT 'URL/path to payment proof screenshot for GCash/PayMaya payments'"
      );
      console.log('✅ Added column comment');
    } catch (commentError) {
      console.log('⚠️  Could not add column comment (this is optional)');
    }
    
    // Create index for faster queries
    await connection.execute(
      "CREATE INDEX idx_payment_screenshot ON orders (payment_screenshot(100))"
    );
    console.log('✅ Created index for payment screenshot queries');
    
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
addPaymentScreenshotField();