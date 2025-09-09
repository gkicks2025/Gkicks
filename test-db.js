const { executeQuery } = require('./lib/database/mysql.ts');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection and data...');
    
    const products = await executeQuery(`
      SELECT id, name, brand, sku, stock_quantity, low_stock_threshold 
      FROM products 
      WHERE is_active = 1 
      LIMIT 5
    `);
    
    console.log('📦 Products in database:');
    console.table(products);
    
    if (products.length === 0) {
      console.log('❌ No products found in database');
    } else {
      console.log(`✅ Found ${products.length} products`);
      
      // Check if SKU and stock_quantity have values
      const hasSkuData = products.some(p => p.sku && p.sku.trim() !== '');
      const hasStockData = products.some(p => p.stock_quantity > 0);
      
      console.log('📊 Data analysis:');
      console.log('- Has SKU data:', hasSkuData);
      console.log('- Has stock data:', hasStockData);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();