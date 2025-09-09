const mysql = require('mysql2/promise');

async function checkGalleryImages() {
  let connection;
  
  try {
    console.log('Checking gallery images in database...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Update with your MySQL password if needed
      database: 'gkicks'
    });

    console.log('Connected to MySQL database');

    // Check products with gallery images
    const [rows] = await connection.execute('SELECT id, name, gallery_images FROM products WHERE gallery_images IS NOT NULL AND gallery_images != "[]" LIMIT 5');
    console.log('\nProducts with gallery images:');
    
    if (rows.length === 0) {
      console.log('No products found with gallery images');
    } else {
      rows.forEach(p => {
        try {
          const galleryData = JSON.parse(p.gallery_images);
          console.log(`ID: ${p.id}, Name: ${p.name}, Gallery: ${Array.isArray(galleryData) ? galleryData.length + ' images' : 'Invalid format'}`);
          if (Array.isArray(galleryData) && galleryData.length > 0) {
            console.log('  Images:', galleryData.slice(0, 3).join(', ') + (galleryData.length > 3 ? '...' : ''));
          }
        } catch (e) {
          console.log(`ID: ${p.id}, Name: ${p.name}, Gallery: Invalid JSON format`);
        }
      });
    }

    // Check all products to see their image data structure
    const [allProducts] = await connection.execute('SELECT id, name, image_url, gallery_images FROM products LIMIT 3');
    console.log('\nSample products image data:');
    allProducts.forEach(p => {
      console.log(`\nID: ${p.id}, Name: ${p.name}`);
      console.log(`  Main Image: ${p.image_url || 'None'}`);
      console.log(`  Gallery: ${p.gallery_images || 'None'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the check
checkGalleryImages()
  .then(() => {
    console.log('\nCheck completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Check failed:', error);
    process.exit(1);
  });