-- Create notification_views table for GKICKS MySQL database
-- This script creates the notification_views table to track viewed notifications

USE gkicks;

-- Create notification_views table
CREATE TABLE IF NOT EXISTS notification_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NOT NULL,
    order_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one view record per admin per order
    UNIQUE KEY unique_admin_order_view (admin_user_id, order_id),
    
    INDEX idx_admin_user (admin_user_id),
    INDEX idx_order_id (order_id),
    INDEX idx_viewed_at (viewed_at)
);

-- Show the created table structure
DESCRIBE notification_views;

SELECT 'Notification views table created successfully!' as message;