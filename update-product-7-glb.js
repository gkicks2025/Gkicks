const mysql = require('mysql2/promise');

async function updateProduct7() {
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

    // Update product ID 7 with GLB file from product 18
    const [result] = await connection.execute(
      'UPDATE products SET model_3d_url = ?, model_3d_filename = ? WHERE id = 7',
      ['/uploads/3d-models/3d-model-1757485344969-nfwpfozwrg.glb', '3d-model-1757485344969-nfwpfozwrg.glb']
    );
    
    console.log('✅ Updated product 7 with GLB file');
    console.log('Affected rows:', result.affectedRows);

    // Verify the update
    const [rows] = await connection.execute(
      'SELECT id, name, model_3d_url, model_3d_filename FROM products WHERE id = 7'
    );
    
    console.log('\nVerified product ID 7:');
    if (rows.length > 0) {
      const product = rows[0];
      console.log(`ID: ${product.id}`);
      console.log(`Name: ${product.name}`);
      console.log(`model_3d_url: ${product.model_3d_url}`);
      console.log(`model_3d_filename: ${product.model_3d_filename}`);
      console.log(`Has 3D model: ${!!product.model_3d_url}`);
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

updateProduct7()
  .then(() => {
    console.log('\nUpdate completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Update failed:', error);
    process.exit(1);
  });