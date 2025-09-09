const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// MySQL connection configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'gkicks',
  ssl: process.env.MYSQL_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  connectionLimit: 10,
};

console.log('🔍 Testing MySQL Connection...');
console.log('Configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  password: dbConfig.password ? '***' : 'EMPTY'
});

async function testMySQLConnection() {
  let connection;
  
  try {
    console.log('\n📡 Attempting to connect to MySQL...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL connection successful!');
    
    // Test database existence
    console.log('\n🗄️  Testing database access...');
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === dbConfig.database);
    
    if (dbExists) {
      console.log(`✅ Database '${dbConfig.database}' exists`);
    } else {
      console.log(`❌ Database '${dbConfig.database}' does not exist`);
      console.log('Available databases:', databases.map(db => db.Database));
      return false;
    }
    
    // Test products table
    console.log('\n📋 Testing products table...');
    try {
      const [tables] = await connection.execute(`SHOW TABLES LIKE 'products'`);
      if (tables.length > 0) {
        console.log('✅ Products table exists');
        
        // Test table structure
        const [columns] = await connection.execute('DESCRIBE products');
        console.log('📊 Products table columns:', columns.map(col => col.Field));
        
        // Test data access
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM products');
        console.log(`📈 Products table has ${rows[0].count} records`);
        
        // Test a sample query
        const [sampleProducts] = await connection.execute('SELECT id, name, price FROM products LIMIT 3');
        console.log('🔍 Sample products:', sampleProducts);
        
      } else {
        console.log('❌ Products table does not exist');
        return false;
      }
    } catch (tableError) {
      console.log('❌ Error accessing products table:', tableError.message);
      return false;
    }
    
    // Test other important tables
    console.log('\n🔍 Checking other tables...');
    const importantTables = ['users', 'wishlist', 'orders', 'admins'];
    
    for (const tableName of importantTables) {
      try {
        const [tables] = await connection.execute(`SHOW TABLES LIKE '${tableName}'`);
        if (tables.length > 0) {
          const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`✅ ${tableName} table: ${count[0].count} records`);
        } else {
          console.log(`⚠️  ${tableName} table does not exist`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${tableName} table:`, error.message);
      }
    }
    
    console.log('\n🎉 All database tests completed successfully!');
    return true;
    
  } catch (error) {
    console.log('❌ MySQL connection failed:', error.message);
    console.log('\n🔧 Troubleshooting suggestions:');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('- MySQL server is not running. Start XAMPP/MySQL service.');
      console.log('- Check if MySQL is running on the correct port (3306).');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('- Check MySQL username and password in .env.local');
      console.log('- Verify user has proper permissions');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log(`- Database '${dbConfig.database}' does not exist`);
      console.log('- Create the database or check the database name');
    }
    
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connection closed.');
    }
  }
}

// Run the test
testMySQLConnection().then(success => {
  if (success) {
    console.log('\n✅ MySQL connection test PASSED');
    process.exit(0);
  } else {
    console.log('\n❌ MySQL connection test FAILED');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});