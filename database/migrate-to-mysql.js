const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// SQLite database path
const sqliteDbPath = path.join(__dirname, 'gkicks.db');

// MySQL connection configuration
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'gkicks',
  ssl: process.env.MYSQL_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
};

// Migration function
async function migrateData() {
  let sqliteDb;
  let mysqlConnection;
  
  try {
    console.log('🚀 Starting data migration from SQLite to MySQL...');
    
    // Connect to SQLite
    console.log('📂 Connecting to SQLite database...');
    sqliteDb = new sqlite3.Database(sqliteDbPath, (err) => {
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
    
    // Get data from SQLite
    console.log('📊 Fetching data from SQLite...');
    const sqliteData = await new Promise((resolve, reject) => {
      sqliteDb.all(`
        SELECT 
          id, name, brand, description, price, original_price,
          image_url, rating, reviews, colors, color_images,
          is_new, is_sale, views, category, stock_quantity,
          sku, is_active, is_deleted, created_at, updated_at
        FROM products 
        WHERE is_deleted = 0
        ORDER BY id
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    
    console.log(`📋 Found ${sqliteData.length} products in SQLite database`);
    
    if (sqliteData.length === 0) {
      console.log('⚠️ No products found in SQLite database to migrate');
      return;
    }
    
    // Clear existing data in MySQL (optional)
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
      } catch (err) {
        console.error(`❌ Failed to migrate product ${product.id}:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${successCount} products`);
    console.log(`❌ Failed migrations: ${errorCount} products`);
    console.log(`📋 Total processed: ${sqliteData.length} products`);
    
    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const [mysqlRows] = await mysqlConnection.execute('SELECT COUNT(*) as count FROM products WHERE is_deleted = 0');
    const mysqlCount = mysqlRows[0].count;
    
    console.log(`📊 Products in MySQL: ${mysqlCount}`);
    console.log(`📊 Products in SQLite: ${sqliteData.length}`);
    
    if (mysqlCount === successCount) {
      console.log('✅ Migration verification successful!');
    } else {
      console.log('⚠️ Migration verification failed - counts do not match');
    }
    
    // Show sample data
    console.log('\n📋 Sample migrated data:');
    const [sampleRows] = await mysqlConnection.execute('SELECT id, name, brand, price, category FROM products LIMIT 5');
    console.table(sampleRows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close connections
    if (sqliteDb) {
      sqliteDb.close((err) => {
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

// Connection test function
async function testConnections() {
  console.log('🧪 Testing database connections...');
  
  // Test SQLite
  try {
    const sqliteDb = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY);
    await new Promise((resolve, reject) => {
      sqliteDb.get('SELECT COUNT(*) as count FROM products', (err, row) => {
        if (err) {
          reject(err);
        } else {
          console.log(`✅ SQLite: Found ${row.count} products`);
          resolve(row);
        }
      });
    });
    sqliteDb.close();
  } catch (error) {
    console.error('❌ SQLite connection test failed:', error.message);
    return false;
  }
  
  // Test MySQL
  try {
    const connection = await mysql.createConnection(mysqlConfig);
    await connection.execute('SELECT 1');
    console.log('✅ MySQL connection test successful');
    await connection.end();
  } catch (error) {
    console.error('❌ MySQL connection test failed:', error.message);
    console.error('Make sure MySQL server is running and credentials are correct');
    return false;
  }
  
  return true;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testConnections();
  } else if (args.includes('--migrate')) {
    const connectionsOk = await testConnections();
    if (connectionsOk) {
      await migrateData();
    } else {
      console.log('❌ Connection tests failed. Please fix connection issues before migrating.');
      process.exit(1);
    }
  } else {
    console.log('📖 Usage:');
    console.log('  node migrate-to-mysql.js --test     # Test database connections');
    console.log('  node migrate-to-mysql.js --migrate  # Run full migration');
    console.log('');
    console.log('📋 Environment variables required:');
    console.log('  MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE');
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { migrateData, testConnections };