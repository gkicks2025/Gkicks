const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gkicks',
};

async function checkOrders() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database');
    
    // Check if orders table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'orders'"
    );
    
    if (tables.length === 0) {
      console.log('❌ Orders table does not exist');
      return;
    }
    
    console.log('✅ Orders table exists');
    
    // Check orders count
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM orders'
    );
    
    const orderCount = countResult[0].count;
    console.log(`📊 Total orders in database: ${orderCount}`);
    
    if (orderCount > 0) {
      // Get recent orders
      const [orders] = await connection.execute(
        'SELECT id, customer_name, total_amount, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5'
      );
      
      console.log('\n📋 Recent orders:');
      orders.forEach(order => {
        console.log(`  Order #${order.id}: ${order.customer_name} - $${order.total_amount} (${order.status}) - ${order.created_at}`);
      });
    } else {
      console.log('ℹ️  No orders found in database');
      console.log('💡 You may need to create some test orders to test the notification functionality');
    }
    
    // Check notification_views table
    const [notifTables] = await connection.execute(
      "SHOW TABLES LIKE 'notification_views'"
    );
    
    if (notifTables.length > 0) {
      const [notifCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM notification_views'
      );
      console.log(`\n🔔 Notification views tracked: ${notifCount[0].count}`);
    } else {
      console.log('\n❌ notification_views table does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

checkOrders();