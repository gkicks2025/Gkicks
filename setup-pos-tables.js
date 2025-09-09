const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gkicks',
};

async function setupPOSTables() {
  let connection;
  
  try {
    console.log('🏪 Setting up POS tables...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Create POS tables
    const posTablesSQL = `
      -- POS Payment Methods
      CREATE TABLE IF NOT EXISTS pos_payment_methods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- POS Sessions
      CREATE TABLE IF NOT EXISTS pos_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_end TIMESTAMP NULL,
        opening_cash DECIMAL(10,2) DEFAULT 0.00,
        closing_cash DECIMAL(10,2) NULL,
        expected_cash DECIMAL(10,2) DEFAULT 0.00,
        cash_variance DECIMAL(10,2) DEFAULT 0.00,
        status ENUM('active', 'suspended', 'closed') DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
      
      -- POS Transactions
      CREATE TABLE IF NOT EXISTS pos_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id VARCHAR(50) UNIQUE NOT NULL,
        session_id INT,
        user_id INT NOT NULL,
        customer_name VARCHAR(255),
        subtotal DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_reference VARCHAR(255),
        cash_received DECIMAL(10,2),
        change_given DECIMAL(10,2) DEFAULT 0.00,
        receipt_number VARCHAR(100),
        transaction_date DATE,
        status ENUM('completed', 'refunded', 'cancelled') DEFAULT 'completed',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_transaction_date (transaction_date),
        INDEX idx_user_id (user_id),
        INDEX idx_session_id (session_id)
      );
      
      -- POS Transaction Items
      CREATE TABLE IF NOT EXISTS pos_transaction_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        brand VARCHAR(100),
        color VARCHAR(50),
        size VARCHAR(20),
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES pos_transactions(id) ON DELETE CASCADE
      );
      
      -- POS Daily Sales
      CREATE TABLE IF NOT EXISTS pos_daily_sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_date DATE NOT NULL UNIQUE,
        admin_user_id INT,
        total_transactions INT DEFAULT 0,
        total_items_sold INT DEFAULT 0,
        gross_sales DECIMAL(12,2) DEFAULT 0.00,
        net_sales DECIMAL(12,2) DEFAULT 0.00,
        cash_sales DECIMAL(12,2) DEFAULT 0.00,
        card_sales DECIMAL(12,2) DEFAULT 0.00,
        digital_wallet_sales DECIMAL(12,2) DEFAULT 0.00,
        refunds DECIMAL(12,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sale_date (sale_date)
      );
      
      -- Insert default payment methods
      INSERT IGNORE INTO pos_payment_methods (name) VALUES 
        ('cash'),
        ('card'),
        ('digital_wallet'),
        ('bank_transfer');
    `;
    
    // Split and execute each statement
    const statements = posTablesSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    
    console.log('✅ POS tables created successfully!');
    
    // Test the tables
    const [tables] = await connection.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name LIKE 'pos_%'
    `, [dbConfig.database]);
    
    console.log('📋 Created POS tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up POS tables:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupPOSTables();