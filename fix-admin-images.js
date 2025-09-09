const { executeQuery } = require('./lib/database/mysql.ts');

async function fixAdminImages() {
  try {
    console.log('🔧 Fixing admin page product images...');
    
    // Map of current incorrect URLs to correct ones based on available files
    const imageUpdates = [
      {
        currentUrl: '/images/nike-air-max-90.jpg',
        newUrl: '/images/air-max-97-se.png', // Using available Air Max image
        productName: 'Nike Air Max 90'
      },
      {
        currentUrl: '/images/adidas-ultraboost-22.jpg',
        newUrl: '/images/ultraboost-23.png', // Using available Ultraboost image
        productName: 'Adidas Ultraboost 22'
      },
      {
        currentUrl: '/images/converse-chuck-taylor.jpg',
        newUrl: '/images/chuck-taylor.png', // Using available Chuck Taylor image
        productName: 'Converse Chuck Taylor'
      }
    ];
    
    console.log('📝 Updating product image URLs...');
    
    for (const update of imageUpdates) {
      const updateQuery = `
        UPDATE products 
        SET image_url = ?
        WHERE image_url = ?
      `;
      
      const result = await executeQuery(updateQuery, [update.newUrl, update.currentUrl]);
      console.log(`✅ Updated ${update.productName}: ${update.currentUrl} → ${update.newUrl}`);
      console.log(`   Affected rows: ${result.affectedRows}`);
    }
    
    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const products = await executeQuery(`
      SELECT id, name, brand, image_url 
      FROM products 
      WHERE is_active = 1 
      ORDER BY id
    `);
    
    console.log('📦 Updated products:');
    console.table(products);
    
    console.log('\n✅ Admin page image fixes completed!');
    
  } catch (error) {
    console.error('❌ Failed to fix admin images:', error);
  }
}

fixAdminImages();