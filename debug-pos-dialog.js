const mysql = require('mysql2/promise');

async function debugPOSDialog() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gkicks'
  });

  try {
    console.log('=== Debugging POS Dialog Issue ===');
    
    // Get a sample product
    const [products] = await connection.execute(
      'SELECT id, name, brand, price, colors, variants FROM products LIMIT 3'
    );
    
    if (products.length > 0) {
      const product = products[0];
      console.log('\n📦 Product Data:');
      console.log('ID:', product.id);
      console.log('Name:', product.name);
      console.log('Brand:', product.brand);
      console.log('Price:', product.price);
      console.log('Colors (raw):', product.colors);
      console.log('Variants (raw):', product.variants);
      
      // Parse colors
      let parsedColors = [];
      if (product.colors) {
        try {
          parsedColors = JSON.parse(product.colors);
          console.log('\n🎨 Parsed Colors:', parsedColors);
        } catch (e) {
          console.log('\n❌ Error parsing colors:', e.message);
        }
      }
      
      // Parse variants
      let parsedVariants = {};
      if (product.variants) {
        try {
          parsedVariants = JSON.parse(product.variants);
          console.log('\n🔄 Parsed Variants:', JSON.stringify(parsedVariants, null, 2));
          
          // Check available colors from variants
          const availableColors = Object.keys(parsedVariants).filter(color => {
            const variant = parsedVariants[color];
            const sizeData = variant.sizes || variant;
            if (typeof sizeData === 'object' && sizeData !== null) {
              return Object.values(sizeData).some(stock => 
                typeof stock === 'number' && stock > 0
              );
            }
            return false;
          });
          
          console.log('\n✅ Available Colors (with stock):', availableColors);
          
          // Check sizes for first available color
          if (availableColors.length > 0) {
            const firstColor = availableColors[0];
            const sizeData = parsedVariants[firstColor].sizes || parsedVariants[firstColor];
            const availableSizes = Object.entries(sizeData)
              .filter(([, stock]) => typeof stock === 'number' && stock > 0)
              .map(([size]) => size)
              .sort((a, b) => Number(a) - Number(b));
            
            console.log(`\n👟 Available Sizes for ${firstColor}:`, availableSizes);
          }
        } catch (e) {
          console.log('\n❌ Error parsing variants:', e.message);
        }
      }
      
      if (parsedColors.length === 0 && Object.keys(parsedVariants).length === 0) {
        console.log('\n⚠️  WARNING: No colors or variants found! This is why the dialog shows no options.');
      }
    } else {
      console.log('\n❌ No Jordan products found in database');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await connection.end();
  }
}

debugPOSDialog();