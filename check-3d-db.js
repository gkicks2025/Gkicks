const mysql = require('mysql2/promise');

async function check3DModels() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'gkicks'
    });
    
    console.log('Connected! Checking products with 3D models...');
    
    const [rows] = await connection.execute(
      'SELECT id, name, model_3d_url, model_3d_filename FROM products WHERE model_3d_url IS NOT NULL LIMIT 5'
    );
    
    console.log('\nProducts with 3D models:');
    console.log('========================');
    
    rows.forEach(p => {
      console.log(`ID: ${p.id}`);
      console.log(`Name: ${p.name}`);
      console.log(`URL: ${p.model_3d_url}`);
      console.log(`Filename: ${p.model_3d_filename}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

check3DModels();