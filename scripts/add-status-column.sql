-- Add status column to products table
USE gkicks;

-- Check if status column exists and add it if it doesn't
ALTER TABLE products ADD COLUMN IF NOT EXISTS status ENUM('Active', 'Inactive', 'Discontinued') DEFAULT 'Active';

-- Update existing products to have 'Active' status
UPDATE products SET status = 'Active' WHERE status IS NULL;

-- Show the updated table structure
DESCRIBE products;

SELECT 'Status column added successfully!' as message;