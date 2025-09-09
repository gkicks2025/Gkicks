const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function createAddressesTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gkicks'
  });

  console.log('✅ Connected to MySQL database');

  try {
    // Create addresses table
    const createAddressesSQL = `
      CREATE TABLE IF NOT EXISTS addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('shipping', 'billing', 'both') DEFAULT 'shipping',
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        company VARCHAR(100),
        address_line_1 VARCHAR(255) NOT NULL,
        address_line_2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) NOT NULL DEFAULT 'Philippines',
        phone VARCHAR(20),
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_is_default (is_default)
      )
    `;

    await connection.execute(createAddressesSQL);
    console.log('✅ Addresses table created successfully');

    // Verify table creation
    const [tables] = await connection.execute("SHOW TABLES LIKE 'addresses'");
    if (tables.length > 0) {
      console.log('✅ Addresses table exists in database');
      
      // Show table structure
      const [columns] = await connection.execute('DESCRIBE addresses');
      console.log('📋 Addresses table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
      });
    } else {
      console.log('❌ Failed to create addresses table');
    }

  } catch (error) {
    console.error('❌ Error creating addresses table:', error);
  } finally {
    await connection.end();
    console.log('🔌 Database connection closed');
  }
}

createAddressesTable();