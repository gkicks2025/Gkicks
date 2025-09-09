const mysql = require('mysql2/promise');
require('dotenv').config();

async function addGalleryImagesColumn() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'gkicks',
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    console.log('✅ Connected to MySQL database');

    // Check if gallery_images column already exists
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'gallery_images'",
      [process.env.MYSQL_DATABASE || 'gkicks']
    );

    if (columns.length > 0) {
      console.log('⚠️  gallery_images column already exists');
      return;
    }

    // Add gallery_images column
    await connection.execute(
      'ALTER TABLE products ADD COLUMN gallery_images JSON AFTER image_url'
    );

    console.log('✅ Successfully added gallery_images column to products table');

    // Update existing products to have empty gallery_images array
    await connection.execute(
      "UPDATE products SET gallery_images = JSON_ARRAY() WHERE gallery_images IS NULL"
    );

    console.log('✅ Updated existing products with empty gallery_images array');

  } catch (error) {
    console.error('❌ Error adding gallery_images column:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  addGalleryImagesColumn()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addGalleryImagesColumn };