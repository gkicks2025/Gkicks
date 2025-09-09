const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gkicks',
};

async function alterPOSDailySalesTable() {
  let connection;
  
  try {
    console.log('🔧 Altering POS daily sales table...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Add missing columns to pos_daily_sales table
    const alterQueries = [
      'ALTER TABLE pos_daily_sales ADD COLUMN IF NOT EXISTS admin_user_id INT AFTER sale_date',
      'ALTER TABLE pos_daily_sales ADD COLUMN IF NOT EXISTS total_items_sold INT DEFAULT 0 AFTER total_transactions',
      'ALTER TABLE pos_daily_sales ADD COLUMN IF NOT EXISTS gross_sales DECIMAL(12,2) DEFAULT 0.00 AFTER total_items_sold',
      'ALTER TABLE pos_daily_sales ADD COLUMN IF NOT EXISTS digital_wallet_sales DECIMAL(12,2) DEFAULT 0.00 AFTER card_sales',
      // Rename existing columns if they exist with different names
      'ALTER TABLE pos_daily_sales CHANGE COLUMN total_sales gross_sales DECIMAL(12,2) DEFAULT 0.00',
      'ALTER TABLE pos_daily_sales CHANGE COLUMN other_sales digital_wallet_sales DECIMAL(12,2) DEFAULT 0.00'
    ];
    
    for (const query of alterQueries) {
      try {
        await connection.execute(query);
        console.log('✅ Column operation completed successfully');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('ℹ️ Column already exists, skipping...');
        } else if (error.code === 'ER_BAD_FIELD_ERROR') {
          console.log('ℹ️ Column does not exist for rename, skipping...');
        } else {
          console.log('⚠️ Error with column operation:', error.message);
        }
      }
    }
    
    console.log('✅ POS daily sales table updated successfully!');
    
  } catch (error) {
    console.error('❌ Error altering table:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

alterPOSDailySalesTable();