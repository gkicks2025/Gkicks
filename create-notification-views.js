const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function createNotificationViewsTable() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL database...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gkicks'
    });
    
    console.log('✅ Connected to MySQL database');
    
    // Create notification_views table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS notification_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_user_id INT NOT NULL,
        order_id INT NOT NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_admin_order_view (admin_user_id, order_id),
        
        INDEX idx_admin_user (admin_user_id),
        INDEX idx_order_id (order_id),
        INDEX idx_viewed_at (viewed_at)
      )
    `;
    
    await connection.execute(createTableSQL);
    console.log('✅ notification_views table created successfully!');
    
    // Show table structure
    const [rows] = await connection.execute('DESCRIBE notification_views');
    console.log('\n📋 Table structure:');
    console.table(rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

createNotificationViewsTable();