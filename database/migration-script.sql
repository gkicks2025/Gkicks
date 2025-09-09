-- GKICKS Database Migration Script
-- This script helps migrate from existing database to the new comprehensive schema
-- Run this after creating the new schema with complete-mysql-schema.sql

-- =============================================
-- DATA MIGRATION PROCEDURES
-- =============================================

-- Migrate existing product data if any
-- This assumes you have existing product data in a different format

-- Update existing products to match new schema requirements
UPDATE products SET 
    slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '--', '-')),
    short_description = LEFT(description, 500),
    is_featured = (rating >= 4.5),
    low_stock_threshold = 10,
    meta_title = CONCAT(name, ' - ', brand, ' | GKICKS'),
    meta_description = CONCAT('Buy ', name, ' by ', brand, ' at GKICKS. ', LEFT(description, 100), '...')
WHERE slug IS NULL OR slug = '';

-- Create product variants from existing color/size data
INSERT INTO product_variants (product_id, sku, size, color, price, stock_quantity)
SELECT 
    p.id,
    CONCAT(p.sku, '-', REPLACE(sizes.size, '.', ''), '-', SUBSTRING(colors.color, 1, 3)),
    sizes.size,
    colors.color,
    p.price,
    FLOOR(p.stock_quantity / (JSON_LENGTH(p.sizes) * JSON_LENGTH(p.colors)))
FROM products p
CROSS JOIN JSON_TABLE(p.sizes, '$[*]' COLUMNS (size VARCHAR(20) PATH '$')) AS sizes
CROSS JOIN JSON_TABLE(p.colors, '$[*]' COLUMNS (color VARCHAR(50) PATH '$')) AS colors
WHERE p.sizes IS NOT NULL AND p.colors IS NOT NULL
AND JSON_LENGTH(p.sizes) > 0 AND JSON_LENGTH(p.colors) > 0;

-- =============================================
-- DATA CLEANUP AND OPTIMIZATION
-- =============================================

-- Remove duplicate products based on name and brand
DELETE p1 FROM products p1
INNER JOIN products p2 
WHERE p1.id > p2.id 
AND p1.name = p2.name 
AND p1.brand = p2.brand;

-- Update product ratings based on reviews (if you have review data)
-- UPDATE products SET rating = (SELECT AVG(rating) FROM reviews WHERE product_id = products.id) WHERE id IN (SELECT DISTINCT product_id FROM reviews);

-- Set featured products (top-rated or best-selling)
UPDATE products SET is_featured = TRUE 
WHERE rating >= 4.5 OR views > 1000 
LIMIT 10;

-- =============================================
-- CREATE STORED PROCEDURES FOR COMMON OPERATIONS
-- =============================================

DELIMITER //

-- Procedure to update product stock
CREATE PROCEDURE UpdateProductStock(
    IN p_product_id INT,
    IN p_variant_id INT,
    IN p_quantity_change INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    IF p_variant_id IS NOT NULL THEN
        UPDATE product_variants 
        SET stock_quantity = stock_quantity + p_quantity_change,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_variant_id;
    END IF;
    
    UPDATE products 
    SET stock_quantity = (
        SELECT COALESCE(SUM(stock_quantity), 0) 
        FROM product_variants 
        WHERE product_id = p_product_id
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = p_product_id;
    
    COMMIT;
END //

-- Procedure to create order
CREATE PROCEDURE CreateOrder(
    IN p_user_id INT,
    IN p_order_number VARCHAR(50),
    IN p_total_amount DECIMAL(10,2),
    IN p_shipping_address JSON,
    IN p_billing_address JSON,
    IN p_payment_method VARCHAR(50)
)
BEGIN
    DECLARE v_order_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    INSERT INTO orders (
        user_id, order_number, total_amount, subtotal,
        shipping_address, billing_address, payment_method
    ) VALUES (
        p_user_id, p_order_number, p_total_amount, p_total_amount,
        p_shipping_address, p_billing_address, p_payment_method
    );
    
    SET v_order_id = LAST_INSERT_ID();
    
    -- Move cart items to order items
    INSERT INTO order_items (
        order_id, product_id, variant_id, product_name, product_sku,
        size, color, quantity, unit_price, total_price
    )
    SELECT 
        v_order_id, ci.product_id, ci.variant_id, p.name, p.sku,
        ci.size, ci.color, ci.quantity, ci.price, (ci.quantity * ci.price)
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = p_user_id;
    
    -- Clear user's cart
    DELETE FROM cart_items WHERE user_id = p_user_id;
    
    COMMIT;
    
    SELECT v_order_id as order_id;
END //

-- Function to generate order number
CREATE FUNCTION GenerateOrderNumber() RETURNS VARCHAR(50)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_count INT;
    DECLARE v_order_number VARCHAR(50);
    
    SELECT COUNT(*) + 1 INTO v_count FROM orders WHERE DATE(created_at) = CURDATE();
    
    SET v_order_number = CONCAT('GK', DATE_FORMAT(NOW(), '%Y%m%d'), LPAD(v_count, 4, '0'));
    
    RETURN v_order_number;
END //

-- Procedure to record product view
CREATE PROCEDURE RecordProductView(
    IN p_user_id INT,
    IN p_product_id INT,
    IN p_ip_address VARCHAR(45)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Insert or update product view
    INSERT INTO product_views (user_id, product_id, ip_address)
    VALUES (p_user_id, p_product_id, p_ip_address)
    ON DUPLICATE KEY UPDATE viewed_at = CURRENT_TIMESTAMP;
    
    -- Update product view count
    UPDATE products 
    SET views = views + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_product_id;
    
    COMMIT;
END //

DELIMITER ;

-- =============================================
-- CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Trigger to update product stock when variant stock changes
DELIMITER //
CREATE TRIGGER update_product_stock_after_variant_update
AFTER UPDATE ON product_variants
FOR EACH ROW
BEGIN
    IF OLD.stock_quantity != NEW.stock_quantity THEN
        UPDATE products 
        SET stock_quantity = (
            SELECT COALESCE(SUM(stock_quantity), 0) 
            FROM product_variants 
            WHERE product_id = NEW.product_id
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.product_id;
    END IF;
END //
DELIMITER ;

-- Trigger to update order total when order items change
DELIMITER //
CREATE TRIGGER update_order_total_after_item_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders 
    SET subtotal = (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM order_items 
        WHERE order_id = NEW.order_id
    ),
    total_amount = subtotal + shipping_amount + tax_amount - discount_amount,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.order_id;
END //
DELIMITER ;

-- =============================================
-- CREATE VIEWS FOR COMMON QUERIES
-- =============================================

-- View for active products with stock info
CREATE VIEW active_products_view AS
SELECT 
    p.*,
    c.name as category_name,
    CASE 
        WHEN p.stock_quantity <= p.low_stock_threshold THEN 'Low Stock'
        WHEN p.stock_quantity = 0 THEN 'Out of Stock'
        ELSE 'In Stock'
    END as stock_status,
    COALESCE(pv.variant_count, 0) as variant_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN (
    SELECT product_id, COUNT(*) as variant_count
    FROM product_variants
    WHERE is_active = TRUE
    GROUP BY product_id
) pv ON p.id = pv.product_id
WHERE p.is_active = TRUE AND p.is_deleted = FALSE;

-- View for order summary
CREATE VIEW order_summary_view AS
SELECT 
    o.*,
    u.email as customer_email,
    u.first_name as customer_first_name,
    u.last_name as customer_last_name,
    COUNT(oi.id) as item_count,
    SUM(oi.quantity) as total_quantity
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- =============================================
-- PERFORMANCE OPTIMIZATION
-- =============================================

-- Additional indexes for better performance
CREATE INDEX idx_products_search ON products(name, brand, description(100));
CREATE INDEX idx_products_filters ON products(category, price, is_active, is_deleted);
CREATE INDEX idx_orders_reporting ON orders(created_at, status, total_amount);
CREATE INDEX idx_order_items_reporting ON order_items(created_at, product_id, quantity);

-- =============================================
-- SAMPLE QUERIES FOR TESTING
-- =============================================

-- Test the schema with some sample queries
/*
-- Get all active products with stock status
SELECT * FROM active_products_view LIMIT 10;

-- Get order summary
SELECT * FROM order_summary_view WHERE status = 'pending';

-- Get products by category
SELECT * FROM products WHERE category = 'men' AND is_active = TRUE;

-- Get low stock products
SELECT name, brand, stock_quantity, low_stock_threshold 
FROM products 
WHERE stock_quantity <= low_stock_threshold AND is_active = TRUE;

-- Get best selling products (by order count)
SELECT p.name, p.brand, COUNT(oi.id) as order_count
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('delivered', 'shipped')
GROUP BY p.id
ORDER BY order_count DESC
LIMIT 10;
*/

SELECT 'Migration script completed successfully!' as message;