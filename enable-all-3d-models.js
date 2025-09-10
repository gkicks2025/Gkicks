const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function enableAll3DModels() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'gkicks'
    });

    console.log('✅ Connected to MySQL database');

    // Get all available 3D model files
    const modelsDir = path.join(__dirname, 'public', 'uploads', '3d-models');
    const files = fs.readdirSync(modelsDir);
    
    // Filter for OBJ files only (exclude MTL and texture files)
    const objFiles = files.filter(file => file.endsWith('.obj'));
    console.log(`\n📁 Found ${objFiles.length} OBJ files:`);
    objFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });

    // Get all products that don't have 3D models yet
    const [products] = await connection.execute(
      'SELECT id, name FROM products WHERE (model_3d_url IS NULL OR model_3d_url = "") AND is_active = 1 ORDER BY id LIMIT ?',
      [objFiles.length]
    );
    
    console.log(`\n👟 Found ${products.length} products without 3D models:`);
    products.forEach(p => {
      console.log(`  ID: ${p.id} - ${p.name}`);
    });

    if (products.length === 0) {
      console.log('\n⚠️  No products available to assign 3D models to.');
      return;
    }

    // Assign 3D models to products
    console.log('\n🔄 Assigning 3D models to products...');
    
    const assignments = [];
    const maxAssignments = Math.min(objFiles.length, products.length);
    
    for (let i = 0; i < maxAssignments; i++) {
      const product = products[i];
      const objFile = objFiles[i];
      const modelUrl = `/uploads/3d-models/${objFile}`;
      
      // Update the product with 3D model
      const [result] = await connection.execute(
        'UPDATE products SET model_3d_url = ?, model_3d_filename = ? WHERE id = ?',
        [modelUrl, objFile, product.id]
      );
      
      if (result.affectedRows > 0) {
        assignments.push({
          productId: product.id,
          productName: product.name,
          modelFile: objFile,
          modelUrl: modelUrl
        });
        console.log(`  ✅ Product ${product.id} (${product.name}) → ${objFile}`);
      } else {
        console.log(`  ❌ Failed to update product ${product.id}`);
      }
    }

    // Verify assignments
    console.log('\n🔍 Verifying assignments...');
    const [updatedProducts] = await connection.execute(
      'SELECT id, name, model_3d_url, model_3d_filename FROM products WHERE model_3d_url IS NOT NULL AND model_3d_url != ""'
    );
    
    console.log(`\n📊 Summary:`);
    console.log(`  • Total 3D models assigned: ${assignments.length}`);
    console.log(`  • Total products with 3D models: ${updatedProducts.length}`);
    
    console.log('\n🎯 Products with 3D models:');
    updatedProducts.forEach(p => {
      console.log(`  ID: ${p.id} - ${p.name}`);
      console.log(`    📁 File: ${p.model_3d_filename}`);
      console.log(`    🔗 URL: ${p.model_3d_url}`);
      console.log('');
    });

    console.log('🎉 All available 3D models have been enabled!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
enableAll3DModels()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });