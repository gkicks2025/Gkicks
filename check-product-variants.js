const { executeQuery } = require('./lib/database/mysql.ts');

async function checkProductVariants() {
  try {
    console.log('🔍 Checking product colors and sizes...');
    
    const query = `
      SELECT id, name, brand, colors, sizes, variants
      FROM products 
      WHERE is_active = 1 AND (is_deleted = 0 OR is_deleted IS NULL)
      ORDER BY id
    `;
    
    const products = await executeQuery(query);
    
    console.log('📦 Current product variants:');
    products.forEach((product, index) => {
      console.log(`\nProduct ${index + 1} (ID: ${product.id}):`);
      console.log(`  - Name: ${product.name}`);
      console.log(`  - Brand: ${product.brand}`);
      console.log(`  - Colors: ${product.colors || 'NULL'}`);
      console.log(`  - Sizes: ${product.sizes || 'NULL'}`);
      console.log(`  - Variants: ${product.variants || 'NULL'}`);
      
      // Parse JSON if exists
      try {
        if (product.colors) {
          const colors = JSON.parse(product.colors);
          console.log(`  - Parsed Colors: ${JSON.stringify(colors)}`);
        }
        if (product.sizes) {
          const sizes = JSON.parse(product.sizes);
          console.log(`  - Parsed Sizes: ${JSON.stringify(sizes)}`);
        }
        if (product.variants) {
          const variants = JSON.parse(product.variants);
          console.log(`  - Parsed Variants: ${JSON.stringify(variants)}`);
        }
      } catch (e) {
        console.log(`  - JSON Parse Error: ${e.message}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking product variants:', error);
  }
}

checkProductVariants();