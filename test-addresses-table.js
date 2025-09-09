const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function testAddressesTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gkicks'
    });

    console.log('✅ Connected to MySQL database');

    // Check if addresses table exists
    const [tables] = await connection.execute('SHOW TABLES LIKE "addresses"');
    console.log('📋 Tables found:', tables);

    if (tables.length > 0) {
      // Count addresses
      const [result] = await connection.execute('SELECT COUNT(*) as count FROM addresses');
      console.log('📊 Addresses count:', result[0].count);
      
      // Show table structure
      const [columns] = await connection.execute('DESCRIBE addresses');
      console.log('🏗️ Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type}`);
      });
    } else {
      console.log('❌ Addresses table not found');
    }

    await connection.end();
    console.log('🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAddressesTable();