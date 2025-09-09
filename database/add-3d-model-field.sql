-- Migration script to add 3D model support to products table
-- Run this script to add the model_3d_url field to the existing products table

USE gkicks_db;

-- Add 3D model URL field to products table
ALTER TABLE products 
ADD COLUMN model_3d_url TEXT AFTER gallery_images,
ADD COLUMN model_3d_filename VARCHAR(255) AFTER model_3d_url;

-- Add comment to document the new fields
ALTER TABLE products 
MODIFY COLUMN model_3d_url TEXT COMMENT '3D model file URL path',
MODIFY COLUMN model_3d_filename VARCHAR(255) COMMENT 'Original filename of the 3D model';

-- Create index for faster queries on products with 3D models
CREATE INDEX idx_has_3d_model ON products (model_3d_url(100));

SELECT 'Migration completed: Added 3D model support to products table' AS status;