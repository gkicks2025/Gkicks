#!/usr/bin/env node

/**
 * Production Database Setup Script for GKicks
 * This script sets up the database for production deployment
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.production' });

// Configuration
const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'gkicks',
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

function logInfo(message) {
  log(`[INFO] ${message}`, 'blue');
}

function logSuccess(message) {
  log(`[SUCCESS] ${message}`, 'green');
}

function logWarning(message) {
  log(`[WARNING] ${message}`, 'yellow');
}

function logError(message) {
  log(`[ERROR] ${message}`, 'red');
}

async function checkConnection() {
  logInfo('Testing database connection...');
  
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });
    
    await connection.execute('SELECT 1');
    await connection.end();
    
    logSuccess('Database connection successful');
    return true;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return false;
  }
}

async function createDatabase() {
  logInfo(`Creating database '${config.database}' if it doesn't exist...`);
  
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.end();
    
    logSuccess(`Database '${config.database}' created/verified`);
    return true;
  } catch (error) {
    logError(`Failed to create database: ${error.message}`);
    return false;
  }
}

async function runSQLFile(filePath, description) {
  logInfo(`Running ${description}...`);
  
  try {
    const sqlContent = await fs.readFile(filePath, 'utf8');
    
    const connection = await mysql.createConnection(config);
    
    // Split SQL content by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    
    await connection.end();
    
    logSuccess(`${description} completed successfully`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      logWarning(`${description} file not found: ${filePath}`);
      return false;
    }
    logError(`Failed to run ${description}: ${error.message}`);
    return false;
  }
}

async function checkTableExists(tableName) {
  try {
    const connection = await mysql.createConnection(config);
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
      [config.database, tableName]
    );
    await connection.end();
    
    return rows[0].count > 0;
  } catch (error) {
    logError(`Failed to check table existence: ${error.message}`);
    return false;
  }
}

async function seedInitialData() {
  logInfo('Seeding initial data...');
  
  try {
    const connection = await mysql.createConnection(config);
    
    // Check if admin user exists
    const [adminRows] = await connection.execute('SELECT COUNT(*) as count FROM admin WHERE email = ?', ['admin@gkicks.com']);
    
    if (adminRows[0].count === 0) {
      // Create default admin user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await connection.execute(
        'INSERT INTO admin (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
        ['Admin User', 'admin@gkicks.com', hashedPassword, 'super_admin']
      );
      
      logSuccess('Default admin user created (email: admin@gkicks.com, password: admin123)');
      logWarning('Please change the default admin password after first login!');
    } else {
      logInfo('Admin user already exists, skipping creation');
    }
    
    // Check if categories exist
    const [categoryRows] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    
    if (categoryRows[0].count === 0) {
      // Create default categories
      const categories = [
        ['Men', 'men', 'Footwear for men'],
        ['Women', 'women', 'Footwear for women'],
        ['Kids', 'kids', 'Footwear for kids'],
        ['Unisex', 'unisex', 'Unisex footwear'],
        ['Sale', 'sale', 'Sale items']
      ];
      
      for (const [name, slug, description] of categories) {
        await connection.execute(
          'INSERT INTO categories (name, slug, description, created_at) VALUES (?, ?, ?, NOW())',
          [name, slug, description]
        );
      }
      
      logSuccess('Default categories created');
    } else {
      logInfo('Categories already exist, skipping creation');
    }
    
    await connection.end();
    
    logSuccess('Initial data seeding completed');
    return true;
  } catch (error) {
    logError(`Failed to seed initial data: ${error.message}`);
    return false;
  }
}

async function optimizeDatabase() {
  logInfo('Optimizing database...');
  
  try {
    const connection = await mysql.createConnection(config);
    
    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)',
      'CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)',
      'CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)'
    ];
    
    for (const indexQuery of indexes) {
      try {
        await connection.execute(indexQuery);
      } catch (error) {
        // Index might already exist, continue
        if (!error.message.includes('Duplicate key name')) {
          logWarning(`Index creation warning: ${error.message}`);
        }
      }
    }
    
    await connection.end();
    
    logSuccess('Database optimization completed');
    return true;
  } catch (error) {
    logError(`Failed to optimize database: ${error.message}`);
    return false;
  }
}

async function verifySetup() {
  logInfo('Verifying database setup...');
  
  try {
    const connection = await mysql.createConnection(config);
    
    // Check essential tables
    const essentialTables = ['users', 'products', 'orders', 'admin', 'categories'];
    const missingTables = [];
    
    for (const table of essentialTables) {
      const exists = await checkTableExists(table);
      if (!exists) {
        missingTables.push(table);
      }
    }
    
    if (missingTables.length > 0) {
      logError(`Missing essential tables: ${missingTables.join(', ')}`);
      return false;
    }
    
    // Check if we can perform basic operations
    await connection.execute('SELECT 1 FROM users LIMIT 1');
    await connection.execute('SELECT 1 FROM products LIMIT 1');
    await connection.execute('SELECT 1 FROM admin LIMIT 1');
    
    await connection.end();
    
    logSuccess('Database setup verification completed successfully');
    return true;
  } catch (error) {
    logError(`Database verification failed: ${error.message}`);
    return false;
  }
}

async function main() {
  log('\n=== GKicks Production Database Setup ===\n', 'cyan');
  
  // Check if environment variables are set
  if (!process.env.MYSQL_PASSWORD) {
    logError('MYSQL_PASSWORD environment variable is not set');
    logError('Please set up your .env.production file with database credentials');
    process.exit(1);
  }
  
  try {
    // Step 1: Test connection
    const connectionOk = await checkConnection();
    if (!connectionOk) {
      process.exit(1);
    }
    
    // Step 2: Create database
    const dbCreated = await createDatabase();
    if (!dbCreated) {
      process.exit(1);
    }
    
    // Step 3: Run schema files
    const schemaFiles = [
      { path: path.join(__dirname, '..', 'database', 'complete-mysql-schema.sql'), desc: 'Main schema' },
      { path: path.join(__dirname, '..', 'database', 'mysql-setup.sql'), desc: 'Additional setup' }
    ];
    
    for (const { path: filePath, desc } of schemaFiles) {
      await runSQLFile(filePath, desc);
    }
    
    // Step 4: Seed initial data
    await seedInitialData();
    
    // Step 5: Optimize database
    await optimizeDatabase();
    
    // Step 6: Verify setup
    const setupOk = await verifySetup();
    if (!setupOk) {
      process.exit(1);
    }
    
    log('\n=== Database Setup Completed Successfully ===\n', 'green');
    log('Next steps:', 'cyan');
    log('1. Start your application: npm start', 'yellow');
    log('2. Access admin panel with: admin@gkicks.com / admin123', 'yellow');
    log('3. Change the default admin password immediately!', 'red');
    log('4. Configure your application settings', 'yellow');
    
  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  checkConnection,
  createDatabase,
  runSQLFile,
  seedInitialData,
  optimizeDatabase,
  verifySetup
};