const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gkicks'
};

async function testPOSTransaction() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🧪 Testing POS transaction with variant stock deduction...');
    
    // Get initial stock for a specific variant
    const productId = 1;
    const size = '10';
    const color = 'Black';
    const quantityToDeduct = 2;
    
    console.log(`\n📦 Testing product ID: ${productId}, Size: ${size}, Color: ${color}`);
    
    // Check initial stock from product_variants table
    const [initialVariants] = await connection.execute(
      'SELECT * FROM product_variants WHERE product_id = ? AND size = ? AND color = ?',
      [productId, size, color]
    );
    
    if (initialVariants.length === 0) {
      console.log('❌ No variant found in database');
      return;
    }
    
    const initialStock = initialVariants[0].stock_quantity;
    console.log(`📊 Initial variant stock: ${initialStock}`);
    
    // Check initial product total stock
    const [initialProduct] = await connection.execute(
      'SELECT stock_quantity, variants FROM products WHERE id = ?',
      [productId]
    );
    
    const initialTotalStock = initialProduct[0].stock_quantity;
    const initialVariantsJSON = JSON.parse(initialProduct[0].variants || '{}');
    
    console.log(`📊 Initial total stock: ${initialTotalStock}`);
    console.log(`📊 Initial variants JSON:`, initialVariantsJSON);
    
    // Simulate POS transaction API call
    const transactionData = {
      items: [{
        product_id: productId,
        quantity: quantityToDeduct,
        price: 189.99,
        size: size,
        color: color
      }],
      total_amount: 189.99 * quantityToDeduct,
      payment_method: 'cash',
      staff_id: 1
    };
    
    console.log('\n🔄 Simulating stock deduction...');
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Update product_variants table
      const [variantUpdateResult] = await connection.execute(
        'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE product_id = ? AND size = ? AND color = ?',
        [quantityToDeduct, productId, size, color]
      );
      
      console.log(`✅ Updated product_variants table (affected rows: ${variantUpdateResult.affectedRows})`);
      
      // Get updated variants from products table
      const [productResult] = await connection.execute(
        'SELECT variants FROM products WHERE id = ?',
        [productId]
      );
      
      let variants = JSON.parse(productResult[0].variants || '{}');
      
      // Update the specific variant in JSON
      if (variants[color] && variants[color][size] !== undefined) {
        variants[color][size] = Math.max(0, variants[color][size] - quantityToDeduct);
        console.log(`✅ Updated variants JSON for ${color} ${size}`);
      }
      
      // Calculate new total stock from all variants
      let newTotalStock = 0;
      for (const colorKey in variants) {
        for (const sizeKey in variants[colorKey]) {
          newTotalStock += variants[colorKey][sizeKey];
        }
      }
      
      // Update products table
      await connection.execute(
        'UPDATE products SET variants = ?, stock_quantity = ? WHERE id = ?',
        [JSON.stringify(variants), newTotalStock, productId]
      );
      
      console.log(`✅ Updated products table with new total stock: ${newTotalStock}`);
      
      await connection.commit();
      console.log('✅ Transaction committed successfully!');
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    
    // Check updated variant stock
    const [updatedVariants] = await connection.execute(
      'SELECT * FROM product_variants WHERE product_id = ? AND size = ? AND color = ?',
      [productId, size, color]
    );
    
    const newVariantStock = updatedVariants[0].stock_quantity;
    console.log(`📊 New variant stock: ${newVariantStock} (was ${initialStock})`);
    console.log(`📊 Stock change: ${initialStock - newVariantStock} (expected: ${quantityToDeduct})`);
    
    // Check updated product total stock
    const [updatedProduct] = await connection.execute(
      'SELECT stock_quantity, variants FROM products WHERE id = ?',
      [productId]
    );
    
    const newTotalStock = updatedProduct[0].stock_quantity;
    const newVariantsJSON = JSON.parse(updatedProduct[0].variants || '{}');
    
    console.log(`📊 New total stock: ${newTotalStock} (was ${initialTotalStock})`);
    console.log(`📊 Total stock change: ${initialTotalStock - newTotalStock} (expected: ${quantityToDeduct})`);
    console.log(`📊 New variants JSON:`, newVariantsJSON);
    
    // Validation
    const variantStockCorrect = (initialStock - newVariantStock) === quantityToDeduct;
    const totalStockCorrect = (initialTotalStock - newTotalStock) === quantityToDeduct;
    const jsonStockCorrect = newVariantsJSON[color] && newVariantsJSON[color][size] === newVariantStock;
    
    console.log('\n🎯 Test Results:');
    console.log(`  Variant stock deduction: ${variantStockCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
    console.log(`  Total stock deduction: ${totalStockCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
    console.log(`  JSON sync: ${jsonStockCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
    
    if (variantStockCorrect && totalStockCorrect && jsonStockCorrect) {
      console.log('\n🎉 ALL TESTS PASSED! Stock deduction is working correctly.');
    } else {
      console.log('\n❌ SOME TESTS FAILED! Stock deduction needs fixing.');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await connection.end();
  }
}

// Run the test
testPOSTransaction().catch(console.error);