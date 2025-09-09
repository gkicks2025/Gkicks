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

async function checkOrdersTable() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database');
    
    // Check orders table structure
    console.log('🔍 Checking orders table structure...');
    const [columns] = await connection.execute(
      "DESCRIBE orders"
    );
    
    console.log('📋 Orders table columns:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field} (${col.Type})`);
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run check
checkOrdersTable();