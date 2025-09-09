const { executeQuery } = require('./lib/database/mysql.ts');

async function createVariantsTable() {
  try {
    console.log('🔧 Creating product_variants table...');
    
    // Create the product_variants table
    await executeQuery(`
      CREATE TABLE product_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        sku VARCHAR(100) UNIQUE NOT NULL,
        size VARCHAR(20),
        color VARCHAR(50),
        price DECIMAL(10,2),
        stock_quantity INT DEFAULT 0,
        image_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_product_id (product_id),
        INDEX idx_sku (sku),
        INDEX idx_size (size),
        INDEX idx_color (color),
        INDEX idx_active (is_active),
        UNIQUE KEY unique_variant (product_id, size, color)
      )
    `, []);
    
    console.log('✅ Successfully created product_variants table!');
    
    // Now populate it with data from existing products
    console.log('🔧 Populating variants from existing products...');
    
    const products = await executeQuery(
      'SELECT id, sku, colors, sizes, variants, price, stock_quantity FROM products WHERE colors IS NOT NULL AND sizes IS NOT NULL',
      []
    );
    
    console.log(`📦 Found ${products.length} products to process`);
    
    for (const product of products) {
      let colors = [];
      let sizes = [];
      let variants = {};
      
      try {
        colors = product.colors ? JSON.parse(product.colors) : [];
        sizes = product.sizes ? JSON.parse(product.sizes) : [];
        variants = product.variants ? JSON.parse(product.variants) : {};
      } catch (e) {
        console.warn(`⚠️  Failed to parse data for product ${product.id}:`, e.message);
        continue;
      }
      
      if (colors.length === 0 || sizes.length === 0) {
        console.log(`⏭️  Skipping product ${product.id} - no colors or sizes`);
        continue;
      }
      
      // Create variants for each color/size combination
      for (const color of colors) {
        for (const size of sizes) {
          // Get stock from variants JSON if available, otherwise distribute evenly
          let stock = 0;
          if (variants[color] && variants[color][size] !== undefined) {
            stock = variants[color][size];
          } else {
            // Distribute total stock evenly among all variants
            stock = Math.floor(product.stock_quantity / (colors.length * sizes.length)) || 0;
          }
          
          const variantSku = `${product.sku}-${size.replace('.', '')}-${color.substring(0, 3).toUpperCase()}`;
          
          try {
            await executeQuery(
              'INSERT INTO product_variants (product_id, sku, size, color, price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
              [product.id, variantSku, size, color, product.price, stock]
            );
          } catch (insertError) {
            if (insertError.code === 'ER_DUP_ENTRY') {
              console.log(`⚠️  Variant already exists: ${variantSku}`);
            } else {
              console.error(`❌ Error inserting variant ${variantSku}:`, insertError.message);
            }
          }
        }
      }
      
      console.log(`✅ Processed product ${product.id} (${product.sku})`);
    }
    
    // Show final count
    const finalCount = await executeQuery('SELECT COUNT(*) as count FROM product_variants', []);
    console.log(`🎉 Successfully created ${finalCount[0].count} product variants!`);
    
  } catch (error) {
    console.error('❌ Error creating variants table:', error);
  }
}

createVariantsTable();