const mysql = require('mysql2/promise');

async function test3DModelDB() {
  let connection;
  
  try {
    console.log('Testing 3D model database insertion...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Update with your MySQL password if needed
      database: 'gkicks'
    });

    console.log('Connected to MySQL database');

    // Check table structure
    const [rows] = await connection.execute('DESCRIBE products');
    console.log('\nProducts table structure:');
    rows.forEach(row => {
      console.log(`${row.Field}: ${row.Type} ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${row.Default ? `DEFAULT ${row.Default}` : ''}`);
    });

    // Check for model_3d column specifically
    const model3dColumn = rows.find(row => row.Field === 'model_3d');
    if (model3dColumn) {
      console.log('\n✅ model_3d column exists:', model3dColumn);
    } else {
      console.log('\n❌ model_3d column NOT found');
    }

    // Check sample products
    const [products] = await connection.execute('SELECT id, name, model_3d, gallery_images FROM products LIMIT 5');
    console.log('\nSample products with 3D models:');
    products.forEach(p => {
      console.log(`ID: ${p.id}, Name: ${p.name}, 3D Model: ${p.model_3d || 'None'}, Gallery: ${p.gallery_images ? 'Yes' : 'None'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the test
test3DModelDB()
  .then(() => {
    console.log('\nTest completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });