const { executeQueryMySQL } = require('./lib/database/mysql-config.ts');

async function fixProductImages() {
  try {
    console.log('🔧 Fixing product images in database...');
    
    // Update all products with placeholder images to use correct images
    const updates = [
      {
        name: 'Air Max 97 SE',
        image: '/images/air-max-97-se.png'
      },
      {
        name: 'UltraBoost 23', 
        image: '/images/ultraboost-23.png'
      }
    ];
    
    for (const update of updates) {
      const updateQuery = `
        UPDATE products 
        SET image_url = ?
        WHERE name = ? AND (image_url LIKE '%placeholder%' OR image_url LIKE '%svg%')
      `;
      
      const [result] = await executeQueryMySQL(updateQuery, [update.image, update.name]);
      console.log(`✅ Updated ${update.name} image:`, result.affectedRows, 'rows affected');
    }
    
    // Check all updated products
    const checkQuery = `
      SELECT id, name, image_url 
      FROM products 
      WHERE is_active = 1
      ORDER BY id
    `;
    
    const [products] = await executeQueryMySQL(checkQuery);
    console.log('📦 All products after update:');
    console.table(products);
    
  } catch (error) {
    console.error('❌ Failed to fix product images:', error);
  }
}

fixProductImages();