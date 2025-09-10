const mysql = require('mysql2/promise');

async function checkProduct7() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'gkicks'
    });

    console.log('Connected to MySQL database');

    // Check product ID 7 specifically
    const [rows] = await connection.execute(
      'SELECT id, name, model_3d_url, model_3d_filename FROM products WHERE id = 7'
    );
    
    console.log('\nProduct ID 7 data:');
    if (rows.length > 0) {
      const product = rows[0];
      console.log(`ID: ${product.id}`);
      console.log(`Name: ${product.name}`);
      console.log(`model_3d_url: ${product.model_3d_url || 'NULL/EMPTY'}`);
      console.log(`model_3d_filename: ${product.model_3d_filename || 'NULL/EMPTY'}`);
      console.log(`Has 3D model: ${!!product.model_3d_url}`);
    } else {
      console.log('Product ID 7 not found');
    }

    // Also check all products with 3D models
    const [allWith3D] = await connection.execute(
      'SELECT id, name, model_3d_url FROM products WHERE model_3d_url IS NOT NULL AND model_3d_url != ""'
    );
    
    console.log('\nAll products with 3D models:');
    if (allWith3D.length > 0) {
      allWith3D.forEach(p => {
        console.log(`ID: ${p.id}, Name: ${p.name}, 3D URL: ${p.model_3d_url}`);
      });
    } else {
      console.log('No products have 3D models');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

checkProduct7()
  .then(() => {
    console.log('\nCheck completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Check failed:', error);
    process.exit(1);
  });