-- Migration script to add customer_email field to orders table
-- Run this script to add the customer_email field for storing customer email in orders

USE gkicks;

-- Add customer_email field to orders table
ALTER TABLE orders 
ADD COLUMN customer_email VARCHAR(255) AFTER user_id
COMMENT 'Customer email address for the order';

-- Add index for faster queries on orders by customer email
CREATE INDEX idx_customer_email ON orders (customer_email);

SELECT 'Migration completed: Added customer_email field to orders table' AS status;