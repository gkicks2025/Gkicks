const { executeQuery } = require('./lib/database/mysql.ts');

async function fixProductVariants() {
  try {
    console.log('🔧 Adding missing variants column and updating product data...');
    
    // First, add the variants column if it doesn't exist (using TEXT for MariaDB compatibility)
    try {
      await executeQuery('ALTER TABLE products ADD COLUMN variants TEXT');
      console.log('✅ Added variants column to products table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Variants column already exists');
      } else {
        console.error('❌ Error adding variants column:', error.message);
      }
    }
    
    // Define product data with colors, sizes, and variants
    const productUpdates = [
      {
        id: 4,
        name: 'Nike Air Max 90',
        colors: ['Black', 'White', 'Red', 'Grey'],
        sizes: ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'],
        variants: {
          'Black': { '7': 5, '8': 8, '9': 12, '10': 15, '11': 10 },
          'White': { '7': 3, '8': 6, '9': 10, '10': 12, '11': 8 },
          'Red': { '7': 2, '8': 4, '9': 8, '10': 10, '11': 6 },
          'Grey': { '7': 4, '8': 7, '9': 11, '10': 13, '11': 9 }
        }
      },
      {
        id: 5,
        name: 'Adidas Ultraboost 22',
        colors: ['Black', 'White', 'Blue', 'Grey'],
        sizes: ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'],
        variants: {
          'Black': { '7': 4, '8': 7, '9': 10, '10': 12, '11': 8 },
          'White': { '7': 3, '8': 5, '9': 8, '10': 10, '11': 6 },
          'Blue': { '7': 2, '8': 4, '9': 6, '10': 8, '11': 5 },
          'Grey': { '7': 3, '8': 6, '9': 9, '10': 11, '11': 7 }
        }
      },
      {
        id: 6,
        name: 'Converse Chuck Taylor',
        colors: ['Black', 'White', 'Red', 'Navy'],
        sizes: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'],
        variants: {
          'Black': { '6': 6, '7': 9, '8': 12, '9': 15, '10': 11 },
          'White': { '6': 4, '7': 7, '8': 10, '9': 13, '10': 9 },
          'Red': { '6': 3, '7': 5, '8': 8, '9': 10, '10': 7 },
          'Navy': { '6': 5, '7': 8, '8': 11, '9': 14, '10': 10 }
        }
      }
    ];
    
    // Update each product
    for (const product of productUpdates) {
      console.log(`\n🔄 Updating ${product.name}...`);
      
      const updateQuery = `
        UPDATE products 
        SET 
          colors = ?,
          sizes = ?,
          variants = ?
        WHERE id = ?
      `;
      
      await executeQuery(updateQuery, [
        JSON.stringify(product.colors),
        JSON.stringify(product.sizes),
        JSON.stringify(product.variants),
        product.id
      ]);
      
      console.log(`✅ Updated ${product.name} with:`);
      console.log(`   - Colors: ${product.colors.join(', ')}`);
      console.log(`   - Sizes: ${product.sizes.join(', ')}`);
      console.log(`   - Variants: ${Object.keys(product.variants).length} color variants`);
    }
    
    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const verifyQuery = `
      SELECT id, name, colors, sizes, variants
      FROM products 
      WHERE id IN (4, 5, 6)
      ORDER BY id
    `;
    
    const updatedProducts = await executeQuery(verifyQuery);
    
    updatedProducts.forEach((product, index) => {
      console.log(`\nProduct ${index + 1} (ID: ${product.id}):`);
      console.log(`  - Name: ${product.name}`);
      
      try {
        const colors = JSON.parse(product.colors || '[]');
        const sizes = JSON.parse(product.sizes || '[]');
        const variants = JSON.parse(product.variants || '{}');
        
        console.log(`  - Colors (${colors.length}): ${colors.join(', ')}`);
        console.log(`  - Sizes (${sizes.length}): ${sizes.join(', ')}`);
        console.log(`  - Variants: ${Object.keys(variants).length} color variants`);
        
        // Show stock for each color/size combination
        Object.entries(variants).forEach(([color, sizeStock]) => {
          const totalStock = Object.values(sizeStock).reduce((sum, stock) => sum + stock, 0);
          console.log(`    - ${color}: ${totalStock} total units`);
        });
        
      } catch (e) {
        console.log(`  - Error parsing JSON: ${e.message}`);
      }
    });
    
    console.log('\n🎉 Product variants update completed!');
    
  } catch (error) {
    console.error('❌ Error fixing product variants:', error);
  }
}

fixProductVariants();