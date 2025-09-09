-- Migration script to add payment screenshot support to orders table
-- Run this script to add the payment_screenshot field for GCash/PayMaya payments

USE gkicks;

-- Add payment screenshot field to orders table
ALTER TABLE orders 
ADD COLUMN payment_screenshot TEXT AFTER payment_reference
COMMENT 'URL/path to payment proof screenshot for GCash/PayMaya payments';

-- Add index for faster queries on orders with payment screenshots
CREATE INDEX idx_payment_screenshot ON orders (payment_screenshot(100));

SELECT 'Migration completed: Added payment_screenshot field to orders table' AS status;