#!/usr/bin/env node

/**
 * GKICKS Database Initialization Script
 * 
 * This script helps initialize the MySQL database with the complete schema
 * and provides testing utilities for the database connection.
 * 
 * Usage:
 *   node init-database.js [command]
 * 
 * Commands:
 *   setup    - Create database and run schema
 *   test     - Test database connection
 *   seed     - Add sample data
 *   reset    - Drop and recreate database
 *   status   - Show database status
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gkicks',
  multipleStatements: true
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

/**
 * Create database connection
 */
async function createConnection(includeDatabase = true) {
  const config = { ...DB_CONFIG };
  if (!includeDatabase) {
    delete config.database;
  }
  
  try {
    const connection = await mysql.createConnection(config);
    return connection;
  } catch (err) {
    error(`Failed to connect to MySQL: ${err.message}`);
    throw err;
  }
}

/**
 * Read SQL file
 */
async function readSQLFile(filename) {
  try {
    const filePath = path.join(__dirname, filename);
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (err) {
    error(`Failed to read SQL file ${filename}: ${err.message}`);
    throw err;
  }
}

/**
 * Execute SQL script
 */
async function executeSQLScript(connection, sqlContent, description) {
  try {
    info(`Executing ${description}...`);
    
    // Split by semicolon and filter out empty statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    
    success(`${description} completed successfully`);
  } catch (err) {
    error(`Failed to execute ${description}: ${err.message}`);
    throw err;
  }
}

/**
 * Create database if it doesn't exist
 */
async function createDatabase() {
  const connection = await createConnection(false);
  
  try {
    info('Creating database if it doesn\'t exist...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${DB_CONFIG.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    success(`Database '${DB_CONFIG.database}' is ready`);
  } finally {
    await connection.end();
  }
}

/**
 * Setup complete database schema
 */
async function setupDatabase() {
  try {
    log('🚀 Starting database setup...', 'cyan');
    
    // Create database
    await createDatabase();
    
    // Connect to the database
    const connection = await createConnection();
    
    try {
      // Read and execute schema
      const schemaSQL = await readSQLFile('complete-mysql-schema.sql');
      await executeSQLScript(connection, schemaSQL, 'database schema');
      
      // Read and execute migration script
      try {
        const migrationSQL = await readSQLFile('migration-script.sql');
        await executeSQLScript(connection, migrationSQL, 'migration script');
      } catch (err) {
        warning('Migration script not found or failed - this is normal for fresh installations');
      }
      
      success('Database setup completed successfully!');
      
    } finally {
      await connection.end();
    }
    
  } catch (err) {
    error(`Database setup failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Test database connection and basic functionality
 */
async function testDatabase() {
  try {
    log('🧪 Testing database connection...', 'cyan');
    
    const connection = await createConnection();
    
    try {
      // Test basic connection
      const [rows] = await connection.execute('SELECT 1 as test');
      success('Database connection successful');
      
      // Test tables exist
      const [tables] = await connection.execute('SHOW TABLES');
      info(`Found ${tables.length} tables`);
      
      // Test sample data
      const [products] = await connection.execute('SELECT COUNT(*) as count FROM products');
      info(`Products in database: ${products[0].count}`);
      
      const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
      info(`Users in database: ${users[0].count}`);
      
      const [admins] = await connection.execute('SELECT COUNT(*) as count FROM admin_users');
      info(`Admin users in database: ${admins[0].count}`);
      
      const [categories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
      info(`Categories in database: ${categories[0].count}`);
      
      success('Database test completed successfully!');
      
    } finally {
      await connection.end();
    }
    
  } catch (err) {
    error(`Database test failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Add additional sample data
 */
async function seedDatabase() {
  try {
    log('🌱 Seeding database with additional sample data...', 'cyan');
    
    const connection = await createConnection();
    
    try {
      // Add sample users
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await connection.execute(`
        INSERT IGNORE INTO users (email, password_hash, first_name, last_name, is_active) VALUES
        ('john.doe@example.com', ?, 'John', 'Doe', TRUE),
        ('jane.smith@example.com', ?, 'Jane', 'Smith', TRUE),
        ('mike.wilson@example.com', ?, 'Mike', 'Wilson', TRUE)
      `, [hashedPassword, hashedPassword, hashedPassword]);
      
      // Add more products
      await connection.execute(`
        INSERT IGNORE INTO products (
          name, slug, brand, description, short_description, price, 
          image_url, colors, sizes, category, stock_quantity, sku
        ) VALUES
        (
          'Air Force 1 Low',
          'air-force-1-low',
          'Nike',
          'The Nike Air Force 1 Low is a timeless classic with premium leather construction.',
          'Timeless classic basketball shoe',
          109.99,
          '/images/air-force-1-low.png',
          JSON_ARRAY('White', 'Black', 'Red'),
          JSON_ARRAY('6', '7', '8', '9', '10', '11', '12'),
          'unisex',
          75,
          'NIKE-AF1-LOW-005'
        ),
        (
          'Stan Smith',
          'stan-smith',
          'Adidas',
          'The Adidas Stan Smith is a clean and classic tennis-inspired sneaker.',
          'Classic tennis-inspired sneaker',
          89.99,
          '/images/stan-smith.png',
          JSON_ARRAY('White', 'Green'),
          JSON_ARRAY('6', '7', '8', '9', '10', '11', '12'),
          'unisex',
          60,
          'ADIDAS-SS-006'
        )
      `);
      
      // Add sample addresses
      const [userRows] = await connection.execute('SELECT id FROM users LIMIT 3');
      if (userRows.length > 0) {
        for (const user of userRows) {
          await connection.execute(`
            INSERT IGNORE INTO addresses (
              user_id, type, first_name, last_name, address_line_1, 
              city, state, postal_code, country, is_default
            ) VALUES (?, 'both', 'Sample', 'Address', '123 Main Street', 'Manila', 'Metro Manila', '1000', 'Philippines', TRUE)
          `, [user.id]);
        }
      }
      
      success('Database seeding completed successfully!');
      
    } finally {
      await connection.end();
    }
    
  } catch (err) {
    error(`Database seeding failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Reset database (drop and recreate)
 */
async function resetDatabase() {
  try {
    log('🔄 Resetting database...', 'cyan');
    warning('This will delete all data in the database!');
    
    const connection = await createConnection(false);
    
    try {
      await connection.execute(`DROP DATABASE IF EXISTS ${DB_CONFIG.database}`);
      info('Database dropped');
      
      await connection.execute(`CREATE DATABASE ${DB_CONFIG.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      success('Database recreated');
      
    } finally {
      await connection.end();
    }
    
    // Now setup the schema
    await setupDatabase();
    
  } catch (err) {
    error(`Database reset failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Show database status
 */
async function showStatus() {
  try {
    log('📊 Database Status', 'cyan');
    
    const connection = await createConnection();
    
    try {
      // Database info
      const [dbInfo] = await connection.execute(`
        SELECT 
          SCHEMA_NAME as database_name,
          DEFAULT_CHARACTER_SET_NAME as charset,
          DEFAULT_COLLATION_NAME as collation
        FROM information_schema.SCHEMATA 
        WHERE SCHEMA_NAME = ?
      `, [DB_CONFIG.database]);
      
      if (dbInfo.length > 0) {
        info(`Database: ${dbInfo[0].database_name}`);
        info(`Charset: ${dbInfo[0].charset}`);
        info(`Collation: ${dbInfo[0].collation}`);
      }
      
      // Table info
      const [tables] = await connection.execute(`
        SELECT 
          table_name,
          table_rows,
          ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'size_mb'
        FROM information_schema.tables
        WHERE table_schema = ?
        ORDER BY (data_length + index_length) DESC
      `, [DB_CONFIG.database]);
      
      console.log('\n📋 Tables:');
      console.table(tables);
      
      // Connection info
      const [connInfo] = await connection.execute('SELECT CONNECTION_ID() as connection_id, USER() as user, @@version as version');
      info(`\nConnection ID: ${connInfo[0].connection_id}`);
      info(`User: ${connInfo[0].user}`);
      info(`MySQL Version: ${connInfo[0].version}`);
      
    } finally {
      await connection.end();
    }
    
  } catch (err) {
    error(`Failed to get database status: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2] || 'help';
  
  log('🏪 GKICKS Database Manager', 'magenta');
  log('================================\n', 'magenta');
  
  switch (command) {
    case 'setup':
      await setupDatabase();
      break;
      
    case 'test':
      await testDatabase();
      break;
      
    case 'seed':
      await seedDatabase();
      break;
      
    case 'reset':
      await resetDatabase();
      break;
      
    case 'status':
      await showStatus();
      break;
      
    case 'help':
    default:
      log('Available commands:', 'yellow');
      log('  setup  - Create database and run schema');
      log('  test   - Test database connection');
      log('  seed   - Add sample data');
      log('  reset  - Drop and recreate database');
      log('  status - Show database status');
      log('\nUsage: node init-database.js [command]');
      break;
  }
}

// Run the script
if (require.main === module) {
  main().catch(err => {
    error(`Script failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  createConnection,
  setupDatabase,
  testDatabase,
  seedDatabase,
  resetDatabase,
  showStatus
};