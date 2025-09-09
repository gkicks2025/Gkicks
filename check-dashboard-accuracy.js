const { executeQuery } = require('./lib/database/mysql.ts');

async function checkDashboardAccuracy() {
  try {
    // Get product statistics
    const productStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_products,
        SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= 5 THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN stock_quantity > 5 THEN 1 ELSE 0 END) as in_stock
      FROM products
    `);

    // Get order statistics
    const orderStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status IN ('completed', 'delivered') THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status NOT IN ('cancelled', 'refunded') THEN total_amount ELSE 0 END) as total_revenue
      FROM orders
    `);

    // Get user statistics
    const userStats = await executeQuery(`
      SELECT COUNT(*) as total_users FROM users
    `);

    // Get all products for detailed view
    const products = await executeQuery(`
      SELECT id, name, stock_quantity, is_active FROM products ORDER BY id
    `);

    // Get all orders for detailed view
    const orders = await executeQuery(`
      SELECT id, total_amount, status, created_at FROM orders ORDER BY id
    `);

    console.log('=== CURRENT DATABASE VALUES ===');
    console.log('\nProduct Statistics:');
    console.table(productStats);
    
    console.log('\nOrder Statistics:');
    console.table(orderStats);
    
    console.log('\nUser Statistics:');
    console.table(userStats);
    
    console.log('\n=== DETAILED PRODUCT DATA ===');
    console.table(products.map(p => ({
      id: p.id,
      name: p.name.substring(0, 30) + '...',
      stock: p.stock_quantity,
      active: p.is_active ? 'Yes' : 'No'
    })));
    
    console.log('\n=== DETAILED ORDER DATA ===');
    console.table(orders.map(o => ({
      id: o.id,
      total: parseFloat(o.total_amount).toFixed(2),
      status: o.status,
      date: o.created_at.toISOString().split('T')[0]
    })));

    console.log('\n=== DASHBOARD EXPECTED VALUES ===');
    console.log(`Total Revenue: ₱${parseFloat(orderStats[0].total_revenue).toFixed(2)}`);
    console.log(`Total Orders: ${orderStats[0].total_orders}`);
    console.log(`Pending Orders: ${orderStats[0].pending_orders}`);
    console.log(`Completed Orders: ${orderStats[0].completed_orders}`);
    console.log(`Total Products: ${productStats[0].total_products}`);
    console.log(`Active Products: ${productStats[0].active_products}`);
    console.log(`Out of Stock: ${productStats[0].out_of_stock}`);
    console.log(`Low Stock: ${productStats[0].low_stock}`);
    console.log(`In Stock: ${productStats[0].in_stock}`);
    console.log(`Total Users: ${userStats[0].total_users}`);

  } catch (error) {
    console.error('Error checking dashboard accuracy:', error);
  }
}

checkDashboardAccuracy();