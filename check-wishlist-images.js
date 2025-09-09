const { executeQuery } = require('./lib/database/mysql-config.ts');

async function checkWishlistImages() {
  try {
    console.log('🔍 Checking products in database...');
    
    // Check all products
    const [products] = await executeQuery(`
      SELECT id, name, brand, image_url, is_active 
      FROM products 
      WHERE is_active = 1 
      ORDER BY id
    `);
    
    console.log('📦 Products in database:');
    products.forEach(product => {
      console.log(`ID: ${product.id}, Name: ${product.name}, Image: ${product.image_url || 'NO IMAGE'}`);
    });
    
    // Check wishlist items
    const [wishlistItems] = await executeQuery(`
      SELECT 
        w.id as wishlist_id,
        w.user_id,
        p.id as product_id,
        p.name,
        p.brand,
        p.image_url
      FROM wishlist_items w
      JOIN products p ON w.product_id = p.id
      WHERE p.is_active = 1
    `);
    
    console.log('\n💝 Wishlist items in database:');
    if (wishlistItems.length === 0) {
      console.log('No wishlist items found');
    } else {
      wishlistItems.forEach(item => {
        console.log(`User: ${item.user_id}, Product: ${item.name}, Image: ${item.image_url || 'NO IMAGE'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkWishlistImages();