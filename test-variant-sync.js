const { executeQuery } = require('./lib/database/mysql.ts');

async function testVariantSync() {
  try {
    console.log('🧪 Testing variant synchronization...');
    
    // Get a sample product with variants
    const products = await executeQuery(
      'SELECT id, name, variants, stock_quantity FROM products WHERE variants IS NOT NULL LIMIT 1',
      []
    );
    
    if (products.length === 0) {
      console.log('❌ No products with variants found');
      return;
    }
    
    const product = products[0];
    console.log(`\n📦 Testing product: ${product.name} (ID: ${product.id})`);
    console.log('📊 Total stock:', product.stock_quantity);
    
    // Parse variants JSON
    let variants = {};
    try {
      variants = JSON.parse(product.variants);
      console.log('🎨 Variants from JSON:', variants);
    } catch (e) {
      console.log('❌ Failed to parse variants JSON');
      return;
    }
    
    // Get variants from product_variants table
    const dbVariants = await executeQuery(
      'SELECT size, color, stock_quantity FROM product_variants WHERE product_id = ?',
      [product.id]
    );
    
    console.log('\n🗄️  Variants from database table:');
    dbVariants.forEach(variant => {
      console.log(`  ${variant.color} ${variant.size}: ${variant.stock_quantity}`);
    });
    
    // Compare JSON variants with database variants
    console.log('\n🔍 Comparing JSON vs Database variants:');
    let syncIssues = 0;
    
    Object.keys(variants).forEach(color => {
      Object.keys(variants[color]).forEach(size => {
        const jsonStock = variants[color][size];
        const dbVariant = dbVariants.find(v => v.color === color && v.size === size);
        const dbStock = dbVariant ? dbVariant.stock_quantity : 0;
        
        if (jsonStock !== dbStock) {
          console.log(`  ⚠️  MISMATCH: ${color} ${size} - JSON: ${jsonStock}, DB: ${dbStock}`);
          syncIssues++;
        } else {
          console.log(`  ✅ MATCH: ${color} ${size} - ${jsonStock}`);
        }
      });
    });
    
    // Calculate total stock from variants
    let totalFromVariants = 0;
    Object.values(variants).forEach(sizeStocks => {
      totalFromVariants += Object.values(sizeStocks).reduce((sum, qty) => sum + qty, 0);
    });
    
    console.log('\n📊 Stock totals:');
    console.log(`  Product stock_quantity: ${product.stock_quantity}`);
    console.log(`  Calculated from variants: ${totalFromVariants}`);
    
    if (product.stock_quantity !== totalFromVariants) {
      console.log('  ⚠️  Total stock mismatch!');
      syncIssues++;
    } else {
      console.log('  ✅ Total stock matches!');
    }
    
    console.log(`\n🎯 Test Results: ${syncIssues === 0 ? '✅ ALL SYNCED' : `❌ ${syncIssues} ISSUES FOUND`}`);
    
  } catch (error) {
    console.error('❌ Error testing variant sync:', error);
  }
}

testVariantSync();