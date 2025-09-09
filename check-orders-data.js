const { executeQuery } = require('./lib/database/mysql');

async function checkOrdersData() {

  try {
    console.log('Checking orders table data...');
    
    // Check total orders by status
    const ordersResult = await executeQuery(
      'SELECT COUNT(*) as total_orders, status FROM orders GROUP BY status'
    );
    console.log('Orders by status:', ordersResult);
    
    // Check recent orders
    const recentOrders = await executeQuery(
      'SELECT id, user_id, total_amount, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5'
    );
    console.log('Recent orders:', recentOrders);
    
    // Check POS transactions
    const posResult = await executeQuery(
      'SELECT COUNT(*) as total_pos, status FROM pos_transactions GROUP BY status'
    );
    console.log('POS transactions by status:', posResult);
    
    // Check recent POS transactions
    const recentPos = await executeQuery(
      'SELECT id, customer_name, total_amount, status, created_at FROM pos_transactions ORDER BY created_at DESC LIMIT 5'
    );
    console.log('Recent POS transactions:', recentPos);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkOrdersData();