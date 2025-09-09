const { executeQuery } = require('./lib/database/mysql.ts');

async function addVariantsColumn() {
  try {
    console.log('🔧 Adding variants column to products table...');
    
    // Check if variants column already exists
    const checkResult = await executeQuery(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'gkicks' AND TABLE_NAME = 'products' AND COLUMN_NAME = 'variants'",
      []
    );
    
    if (checkResult.length > 0) {
      console.log('✅ Variants column already exists!');
      return;
    }
    
    // Add variants column
    await executeQuery(
      'ALTER TABLE products ADD COLUMN variants JSON',
      []
    );
    
    console.log('✅ Successfully added variants column to products table!');
    
    // Initialize variants for existing products with default structure
    console.log('🔧 Initializing variants for existing products...');
    
    const products = await executeQuery(
      'SELECT id, colors, sizes FROM products WHERE variants IS NULL',
      []
    );
    
    for (const product of products) {
      let colors = [];
      let sizes = [];
      
      try {
        colors = product.colors ? JSON.parse(product.colors) : ['default'];
      } catch (e) {
        colors = ['default'];
      }
      
      try {
        sizes = product.sizes ? JSON.parse(product.sizes) : ['5', '6', '7', '8', '9', '10', '11', '12'];
      } catch (e) {
        sizes = ['5', '6', '7', '8', '9', '10', '11', '12'];
      }
      
      // Create variants structure
      const variants = {};
      for (const color of colors) {
        variants[color] = {};
        for (const size of sizes) {
          variants[color][size] = 10; // Default stock of 10 for each size
        }
      }
      
      await executeQuery(
        'UPDATE products SET variants = ? WHERE id = ?',
        [JSON.stringify(variants), product.id]
      );
      
      console.log(`✅ Initialized variants for product ${product.id}`);
    }
    
    console.log('🎉 All done! Variants column added and initialized.');
    
  } catch (error) {
    console.error('❌ Error adding variants column:', error);
  }
}

addVariantsColumn();