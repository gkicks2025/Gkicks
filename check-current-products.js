const { executeQuery } = require('./lib/database/mysql.ts');

async function checkCurrentProducts() {
  try {
    console.log('🔍 Checking current products in database...');
    
    const products = await executeQuery(`
      SELECT id, name, brand, image_url 
      FROM products 
      WHERE is_active = 1 
      ORDER BY id
    `);
    
    console.log('📦 Current products in database:');
    console.table(products);
    
    console.log('\n🖼️ Image URL analysis:');
    products.forEach(product => {
      console.log(`Product ${product.id} (${product.name}): ${product.image_url || 'NO IMAGE'}`);
    });
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkCurrentProducts();