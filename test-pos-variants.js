// Test script to check if POS variants are working
const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gkicks'
};

async function testVariants() {
  try {
    const connection = await mysql.createConnection(config);
    
    // Get products with variants
    const [rows] = await connection.execute(
      'SELECT id, name, variants FROM products WHERE variants IS NOT NULL AND variants != "{}" LIMIT 3'
    );
    
    console.log('Products with variants:');
    rows.forEach(product => {
      console.log(`\nProduct: ${product.name} (ID: ${product.id})`);
      try {
        const variants = JSON.parse(product.variants);
        console.log('Colors available:', Object.keys(variants));
        
        Object.entries(variants).forEach(([color, sizes]) => {
          console.log(`  ${color}: sizes ${Object.keys(sizes).join(', ')}`);
        });
      } catch (e) {
        console.log('  Error parsing variants:', e.message);
      }
    });
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testVariants();