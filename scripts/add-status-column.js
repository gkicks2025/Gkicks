const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gkicks'
};

async function addStatusColumn() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database');
    
    // Check if status column already exists
    console.log('🔍 Checking if status column exists...');
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'gkicks' AND TABLE_NAME = 'products' AND COLUMN_NAME = 'status'"
    );
    
    if (columns.length > 0) {
      console.log('✅ Status column already exists');
      return;
    }
    
    // Add status column
    console.log('🔄 Adding status column to products table...');
    await connection.execute(
      "ALTER TABLE products ADD COLUMN status VARCHAR(50) DEFAULT 'Active' AFTER low_stock_threshold"
    );
    
    console.log('✅ Status column added successfully');
    
    // Update existing products to have 'Active' status
    console.log('🔄 Updating existing products with Active status...');
    const [result] = await connection.execute(
      "UPDATE products SET status = 'Active' WHERE status IS NULL"
    );
    
    console.log(`✅ Updated ${result.affectedRows} products with Active status`);
    
  } catch (error) {
    console.error('❌ Error adding status column:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
addStatusColumn()
  .then(() => {
    console.log('🎉 Status column migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });