const { executeQuery } = require('./lib/database/mysql.ts');

async function checkVariants() {
  try {
    console.log('🔍 Checking product_variants table...');
    
    // Check if table exists and has data
    const variantCount = await executeQuery(
      'SELECT COUNT(*) as count FROM product_variants',
      []
    );
    
    console.log('📊 Product variants count:', variantCount[0]?.count || 0);
    
    if (variantCount[0]?.count > 0) {
      // Show sample variants
      const sampleVariants = await executeQuery(
        'SELECT * FROM product_variants LIMIT 5',
        []
      );
      console.log('📦 Sample variants:', sampleVariants);
    } else {
      console.log('⚠️  No product variants found in database');
      
      // Check products table for variants JSON data
      const productsWithVariants = await executeQuery(
        'SELECT id, name, variants FROM products WHERE variants IS NOT NULL LIMIT 3',
        []
      );
      console.log('🔍 Products with variants JSON:', productsWithVariants);
    }
    
  } catch (error) {
    console.error('❌ Error checking variants:', error);
  }
}

checkVariants();