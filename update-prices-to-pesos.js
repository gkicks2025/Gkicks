const { executeQuery } = require('./lib/database/mysql.ts');

// Convert USD to PHP (using approximate rate of 56 PHP per USD)
const updates = [
  { id: 5, price: 10080, name: 'Adidas Ultraboost 22' }, // $180 -> ₱10,080
  { id: 6, price: 3640, name: 'Converse Chuck Taylor' }, // $65 -> ₱3,640
  { id: 7, price: 62216, name: 'Nike Air Force 1 Low Sneaker for Men' }, // $1111 -> ₱62,216
  { id: 17, price: 28000, name: 'Adizero EVO SL Shoes' }, // $500 -> ₱28,000
  { id: 18, price: 28000, name: 'Samba OG Shoes Kids' } // $500 -> ₱28,000
];

async function updatePrices() {
  try {
    console.log('Updating product prices from USD to PHP...');
    
    for (const product of updates) {
      await executeQuery('UPDATE products SET price = ? WHERE id = ?', [product.price, product.id]);
      console.log(`Updated ${product.name}: ₱${product.price.toLocaleString()}`);
    }
    
    console.log('\nAll prices updated to pesos!');
    
    // Verify the updates
    const updatedProducts = await executeQuery('SELECT id, name, price FROM products WHERE is_active = 1');
    console.log('\nUpdated product prices:');
    console.table(updatedProducts);
    
  } catch (error) {
    console.error('Error updating prices:', error);
  }
}

updatePrices();