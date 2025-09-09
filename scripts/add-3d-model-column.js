const mysql = require('mysql2/promise');

async function addModel3DColumn() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Update with your MySQL password if needed
      database: 'gkicks'
    });

    console.log('Connected to MySQL database');

    // Add model_3d column to products table
    const alterQuery = `
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS model_3d VARCHAR(255) DEFAULT NULL 
      COMMENT '3D model file path'
    `;

    await connection.execute(alterQuery);
    console.log('✅ Successfully added model_3d column to products table');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  model_3d column already exists in products table');
    } else {
      console.error('❌ Error adding model_3d column:', error.message);
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
addModel3DColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });