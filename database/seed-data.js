// database/seed-data.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'gkicks.db');

const sampleProducts = [
  {
    name: 'Air Max 97 SE',
    brand: 'Nike',
    category: 'men',
    price: 8999,
    original_price: 9999,
    image_url: '/images/air-max-97-se.png',
    description: 'The Nike Air Max 97 SE brings the celebrated design into the modern era with premium materials and updated colorways.',
    is_new: true,
    is_sale: true,
    is_active: true,
    stock_quantity: 50,
    colors: JSON.stringify(['Black', 'White', 'Red']),
    sku: 'NIKE-AM97-SE-001'
  },
  {
    name: 'UltraBoost 23',
    brand: 'Adidas',
    category: 'unisex',
    price: 9499,
    original_price: 9499,
    image_url: '/images/ultraboost-23.png',
    description: 'Experience incredible energy return with every step in the UltraBoost 23.',
    is_new: false,
    is_sale: false,
    is_active: true,
    stock_quantity: 35,
    colors: JSON.stringify(['Black', 'White', 'Blue']),
    sku: 'ADIDAS-UB23-002'
  },
  {
    name: 'Fresh Foam X',
    brand: 'New Balance',
    category: 'women',
    price: 7299,
    original_price: 7299,
    image_url: '/images/fresh-foam-x.png',
    description: 'Soft, comfortable cushioning for your daily runs with Fresh Foam X technology.',
    is_new: true,
    is_sale: false,
    is_active: true,
    stock_quantity: 42,
    colors: JSON.stringify(['Pink', 'White', 'Grey']),
    sku: 'NB-FFX-003'
  },
  {
    name: 'Gel-Kayano 30',
    brand: 'ASICS',
    category: 'men',
    price: 8799,
    original_price: 10299,
    image_url: '/images/gel-kayano-30.png',
    description: 'Maximum stability and comfort for overpronators with advanced GEL technology.',
    is_new: false,
    is_sale: true,
    is_active: true,
    stock_quantity: 28,
    colors: JSON.stringify(['Navy', 'Black', 'Grey']),
    sku: 'ASICS-GK30-004'
  }
];

function seedDatabase() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err.message);
      return;
    }
    console.log('🔗 Connected to SQLite database for seeding');
  });

  // Insert sample products
  const insertProduct = db.prepare(`
    INSERT INTO products (
      name, brand, category, price, original_price, image_url, 
      description, is_new, is_sale, is_active, stock_quantity, colors, sku
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  console.log('🌱 Seeding database with sample products...');
  
  sampleProducts.forEach((product, index) => {
    insertProduct.run([
      product.name,
      product.brand,
      product.category,
      product.price,
      product.original_price,
      product.image_url,
      product.description,
      product.is_new ? 1 : 0,
      product.is_sale ? 1 : 0,
      product.is_active ? 1 : 0,
      product.stock_quantity,
      product.colors,
      product.sku
    ], function(err) {
      if (err) {
        console.error(`❌ Error inserting product ${index + 1}:`, err.message);
      } else {
        console.log(`✅ Inserted product: ${product.name} (ID: ${this.lastID})`);
      }
    });
  });

  insertProduct.finalize();

  // Close database connection
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err.message);
    } else {
      console.log('🎉 Database seeding completed successfully!');
      console.log('📊 Added', sampleProducts.length, 'sample products');
    }
  });
}

// Run the seeding function
seedDatabase();