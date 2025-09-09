require('dotenv').config({ path: '.env.production' });
const mysql = require('mysql2/promise');

// Test the exact same configuration as the Next.js app
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'gkicks',
  ssl: process.env.MYSQL_SSL === 'true' ? {
    rejectUnauthorized: false
  } : undefined,
  connectionLimit: 10,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Execute query function (same as in Next.js app)
async function executeQuery(query, params = []) {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('❌ MySQL query failed:', error);
    throw error;
  }
}

async function testDatabaseOperations() {
  try {
    console.log('🔍 Testing database operations...');
    console.log('📋 Database config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      passwordSet: !!dbConfig.password
    });
    
    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful');
    connection.release();
    
    // Test basic query
    const result = await executeQuery('SELECT 1 as test');
    console.log('✅ Basic query successful:', result);
    
    // Test users table query
    const users = await executeQuery('SELECT COUNT(*) as count FROM users');
    console.log('✅ Users table query successful:', users);
    
    // Test email verification tokens table
    const tokens = await executeQuery('SELECT COUNT(*) as count FROM email_verification_tokens');
    console.log('✅ Email verification tokens table query successful:', tokens);
    
    console.log('🎉 All database operations successful!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await pool.end();
  }
}

testDatabaseOperations();