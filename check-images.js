const { executeQueryMySQL } = require('./lib/database/mysql-config.ts');

async function checkProductImages() {
  try {
    console.log('🔍 Checking product images in database...');
    
    const products = await executeQueryMySQL(`
      SELECT id, name, brand, image_url 
      FROM products 
      WHERE is_active = 1 
      LIMIT 10
    `);
    
    console.log('📦 Products with image data:');
    console.table(products[0]);
    
    if (products[0].length === 0) {
      console.log('❌ No products found in database');
    } else {
      console.log(`✅ Found ${products[0].length} products`);
      
      // Check if image_url has values
      const hasImageData = products[0].some(p => p.image_url && p.image_url.trim() !== '');
      
      console.log('📊 Image data analysis:');
      console.log('- Has image_url data:', hasImageData);
      
      // Show specific image URLs
      products[0].forEach(product => {
        console.log(`Product ${product.id} (${product.name}): ${product.image_url || 'NO IMAGE'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkProductImages();