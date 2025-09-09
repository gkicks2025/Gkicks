const { executeQuery } = require('./lib/database/mysql.ts');

async function checkTableStructure() {
  try {
    console.log('🔍 Checking products table structure...');
    
    // Check table structure
    const columns = await executeQuery('DESCRIBE products');
    
    console.log('📋 Current columns in products table:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check if colors and sizes columns exist
    const hasColors = columns.some(col => col.Field === 'colors');
    const hasSizes = columns.some(col => col.Field === 'sizes');
    const hasVariants = columns.some(col => col.Field === 'variants');
    
    console.log('\n🔍 Column availability:');
    console.log(`  - colors: ${hasColors ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  - sizes: ${hasSizes ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  - variants: ${hasVariants ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // If columns exist, check current data
    if (hasColors || hasSizes) {
      console.log('\n📦 Checking current product data...');
      const selectFields = ['id', 'name', 'brand'];
      if (hasColors) selectFields.push('colors');
      if (hasSizes) selectFields.push('sizes');
      if (hasVariants) selectFields.push('variants');
      
      const products = await executeQuery(`
        SELECT ${selectFields.join(', ')}
        FROM products 
        WHERE is_active = 1 AND (is_deleted = 0 OR is_deleted IS NULL)
        ORDER BY id
      `);
      
      products.forEach((product, index) => {
        console.log(`\nProduct ${index + 1} (ID: ${product.id}):`);
        console.log(`  - Name: ${product.name}`);
        console.log(`  - Brand: ${product.brand}`);
        if (hasColors) console.log(`  - Colors: ${product.colors || 'NULL'}`);
        if (hasSizes) console.log(`  - Sizes: ${product.sizes || 'NULL'}`);
        if (hasVariants) console.log(`  - Variants: ${product.variants || 'NULL'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  }
}

checkTableStructure();