-- GKICKS POS Database Schema
-- This script creates POS-specific tables for the Point of Sale system
-- Compatible with MySQL 8.0+

USE gkicks;

-- Drop POS tables if they exist (for clean setup)
DROP TABLE IF EXISTS pos_transaction_items;
DROP TABLE IF EXISTS pos_transactions;
DROP TABLE IF EXISTS pos_daily_sales;
DROP TABLE IF EXISTS pos_sessions;
DROP TABLE IF EXISTS pos_payment_methods;

-- =============================================
-- POS PAYMENT METHODS TABLE
-- =============================================

-- Payment methods configuration for POS
CREATE TABLE pos_payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    requires_reference BOOLEAN DEFAULT FALSE,
    icon_url VARCHAR(255),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_code (code),
    INDEX idx_active (is_active),
    INDEX idx_sort (sort_order)
);

-- =============================================
-- POS SESSIONS TABLE
-- =============================================

-- POS session tracking for shift management
CREATE TABLE pos_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    admin_user_id INT NOT NULL,
    terminal_name VARCHAR(100) DEFAULT 'POS Terminal',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    opening_cash DECIMAL(10,2) DEFAULT 0.00,
    closing_cash DECIMAL(10,2) DEFAULT 0.00,
    total_sales DECIMAL(10,2) DEFAULT 0.00,
    total_transactions INT DEFAULT 0,
    status ENUM('active', 'closed', 'suspended') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_admin_user (admin_user_id),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time)
);

-- =============================================
-- POS TRANSACTIONS TABLE
-- =============================================

-- POS transactions (separate from online orders)
CREATE TABLE pos_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    session_id INT,
    admin_user_id INT NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(255),
    cash_received DECIMAL(10,2),
    change_given DECIMAL(10,2),
    status ENUM('completed', 'voided', 'refunded', 'partially_refunded') DEFAULT 'completed',
    void_reason TEXT,
    refund_reason TEXT,
    receipt_number VARCHAR(50),
    notes TEXT,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES pos_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_session_id (session_id),
    INDEX idx_admin_user (admin_user_id),
    INDEX idx_status (status),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_created_at (created_at),
    INDEX idx_total_amount (total_amount)
);

-- =============================================
-- POS TRANSACTION ITEMS TABLE
-- =============================================

-- Items in each POS transaction
CREATE TABLE pos_transaction_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT,
    product_name VARCHAR(255) NOT NULL,
    product_brand VARCHAR(100) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    size VARCHAR(20),
    color VARCHAR(50),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (transaction_id) REFERENCES pos_transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_product_id (product_id),
    INDEX idx_variant_id (variant_id)
);

-- =============================================
-- POS DAILY SALES TABLE
-- =============================================

-- Daily sales summary for reporting
CREATE TABLE pos_daily_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_date DATE NOT NULL,
    admin_user_id INT,
    session_id INT,
    total_transactions INT DEFAULT 0,
    total_items_sold INT DEFAULT 0,
    gross_sales DECIMAL(10,2) DEFAULT 0.00,
    total_discounts DECIMAL(10,2) DEFAULT 0.00,
    total_tax DECIMAL(10,2) DEFAULT 0.00,
    net_sales DECIMAL(10,2) DEFAULT 0.00,
    cash_sales DECIMAL(10,2) DEFAULT 0.00,
    card_sales DECIMAL(10,2) DEFAULT 0.00,
    digital_wallet_sales DECIMAL(10,2) DEFAULT 0.00,
    other_payment_sales DECIMAL(10,2) DEFAULT 0.00,
    refunds_amount DECIMAL(10,2) DEFAULT 0.00,
    voids_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL,
    FOREIGN KEY (session_id) REFERENCES pos_sessions(id) ON DELETE SET NULL,
    INDEX idx_sale_date (sale_date),
    INDEX idx_admin_user (admin_user_id),
    INDEX idx_session_id (session_id),
    UNIQUE KEY unique_daily_sale (sale_date, admin_user_id, session_id)
);

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Insert default payment methods
INSERT INTO pos_payment_methods (name, code, description, requires_reference, sort_order) VALUES
('Cash', 'CASH', 'Cash payment', FALSE, 1),
('Credit Card', 'CARD', 'Credit/Debit card payment', TRUE, 2),
('GCash', 'GCASH', 'GCash digital wallet', TRUE, 3),
('Maya', 'MAYA', 'Maya digital wallet', TRUE, 4),
('Bank Transfer', 'BANK', 'Bank transfer payment', TRUE, 5);

-- =============================================
-- STORED PROCEDURES FOR POS OPERATIONS
-- =============================================

DELIMITER //

-- Procedure to create a new POS transaction
CREATE PROCEDURE CreatePOSTransaction(
    IN p_admin_user_id INT,
    IN p_session_id INT,
    IN p_customer_name VARCHAR(255),
    IN p_subtotal DECIMAL(10,2),
    IN p_total_amount DECIMAL(10,2),
    IN p_payment_method VARCHAR(50),
    IN p_payment_reference VARCHAR(255),
    IN p_cash_received DECIMAL(10,2),
    IN p_change_given DECIMAL(10,2),
    OUT p_transaction_id INT
)
BEGIN
    DECLARE v_transaction_number VARCHAR(50);
    DECLARE v_receipt_number VARCHAR(50);
    
    -- Generate transaction number
    SET v_transaction_number = CONCAT('POS-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0'));
    SET v_receipt_number = CONCAT('RCP-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0'));
    
    -- Insert transaction
    INSERT INTO pos_transactions (
        transaction_id, session_id, admin_user_id, customer_name,
        subtotal, total_amount, payment_method, payment_reference,
        cash_received, change_given, receipt_number, transaction_date
    ) VALUES (
        v_transaction_number, p_session_id, p_admin_user_id, p_customer_name,
        p_subtotal, p_total_amount, p_payment_method, p_payment_reference,
        p_cash_received, p_change_given, v_receipt_number, CURDATE()
    );
    
    SET p_transaction_id = LAST_INSERT_ID();
END //

-- Procedure to update daily sales
CREATE PROCEDURE UpdateDailySales(
    IN p_sale_date DATE,
    IN p_admin_user_id INT,
    IN p_session_id INT
)
BEGIN
    INSERT INTO pos_daily_sales (
        sale_date, admin_user_id, session_id,
        total_transactions, total_items_sold, gross_sales, net_sales,
        cash_sales, card_sales, digital_wallet_sales
    )
    SELECT 
        p_sale_date,
        p_admin_user_id,
        p_session_id,
        COUNT(DISTINCT t.id) as total_transactions,
        COALESCE(SUM(ti.quantity), 0) as total_items_sold,
        COALESCE(SUM(t.total_amount), 0.00) as gross_sales,
        COALESCE(SUM(t.total_amount), 0.00) as net_sales,
        COALESCE(SUM(CASE WHEN t.payment_method = 'CASH' THEN t.total_amount ELSE 0 END), 0.00) as cash_sales,
        COALESCE(SUM(CASE WHEN t.payment_method = 'CARD' THEN t.total_amount ELSE 0 END), 0.00) as card_sales,
        COALESCE(SUM(CASE WHEN t.payment_method IN ('GCASH', 'MAYA') THEN t.total_amount ELSE 0 END), 0.00) as digital_wallet_sales
    FROM pos_transactions t
    LEFT JOIN pos_transaction_items ti ON t.id = ti.transaction_id
    WHERE t.transaction_date = p_sale_date
        AND (p_admin_user_id IS NULL OR t.admin_user_id = p_admin_user_id)
        AND (p_session_id IS NULL OR t.session_id = p_session_id)
        AND t.status = 'completed'
    ON DUPLICATE KEY UPDATE
        total_transactions = VALUES(total_transactions),
        total_items_sold = VALUES(total_items_sold),
        gross_sales = VALUES(gross_sales),
        net_sales = VALUES(net_sales),
        cash_sales = VALUES(cash_sales),
        card_sales = VALUES(card_sales),
        digital_wallet_sales = VALUES(digital_wallet_sales),
        updated_at = CURRENT_TIMESTAMP;
END //

DELIMITER ;

-- =============================================
-- CREATE VIEWS FOR REPORTING
-- =============================================

-- View for transaction summary
CREATE VIEW pos_transaction_summary AS
SELECT 
    t.id,
    t.transaction_id,
    t.admin_user_id,
    CONCAT(au.first_name, ' ', au.last_name) as cashier_name,
    t.customer_name,
    t.total_amount,
    t.payment_method,
    t.status,
    t.transaction_date,
    t.created_at,
    COUNT(ti.id) as item_count,
    SUM(ti.quantity) as total_quantity
FROM pos_transactions t
LEFT JOIN admin_users au ON t.admin_user_id = au.id
LEFT JOIN pos_transaction_items ti ON t.id = ti.transaction_id
GROUP BY t.id;

-- View for daily sales report
CREATE VIEW pos_daily_report AS
SELECT 
    ds.sale_date,
    ds.total_transactions,
    ds.total_items_sold,
    ds.gross_sales,
    ds.net_sales,
    ds.cash_sales,
    ds.card_sales,
    ds.digital_wallet_sales,
    CONCAT(au.first_name, ' ', au.last_name) as cashier_name
FROM pos_daily_sales ds
LEFT JOIN admin_users au ON ds.admin_user_id = au.id
ORDER BY ds.sale_date DESC;

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_pos_transactions_date_status ON pos_transactions(transaction_date, status);
CREATE INDEX idx_pos_transactions_payment ON pos_transactions(payment_method, status);
CREATE INDEX idx_pos_daily_sales_date_user ON pos_daily_sales(sale_date, admin_user_id);

-- Show completion message
SELECT 'POS database schema created successfully!' as message;
SHOW TABLES LIKE 'pos_%';

-- Display table counts
SELECT 
    'pos_payment_methods' as table_name, COUNT(*) as record_count FROM pos_payment_methods
UNION ALL
SELECT 
    'pos_sessions' as table_name, COUNT(*) as record_count FROM pos_sessions
UNION ALL
SELECT 
    'pos_transactions' as table_name, COUNT(*) as record_count FROM pos_transactions
UNION ALL
SELECT 
    'pos_transaction_items' as table_name, COUNT(*) as record_count FROM pos_transaction_items
UNION ALL
SELECT 
    'pos_daily_sales' as table_name, COUNT(*) as record_count FROM pos_daily_sales;