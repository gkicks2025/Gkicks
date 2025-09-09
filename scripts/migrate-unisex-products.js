const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gkicks',
  port: process.env.DB_PORT || 3306
};

async function migrateUnisexProducts() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Update products with unisex category to men
    console.log('Updating unisex products to men category...');
    const [result] = await connection.execute(
      'UPDATE products SET category = ? WHERE category = ?',
      ['men', 'unisex']
    );
    
    console.log(`Updated ${result.affectedRows} products from unisex to men category`);
    
    // Update categories table if it exists
    try {
      const [categoryResult] = await connection.execute(
        'DELETE FROM categories WHERE slug = ?',
        ['unisex']
      );
      console.log(`Removed unisex category from categories table`);
    } catch (error) {
      console.log('Categories table not found or already updated');
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration
migrateUnisexProducts();