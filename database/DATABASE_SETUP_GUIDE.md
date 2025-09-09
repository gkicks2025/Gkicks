# GKICKS Database Setup Guide

This guide will help you set up the complete MySQL database schema for the GKICKS shoe store system.

## Overview

The new database schema includes:
- **User Management**: Customer accounts and admin users
- **Product Catalog**: Products, categories, variants, and inventory
- **Shopping Experience**: Cart, wishlist, and product views
- **Order Management**: Orders, order items, and payment tracking
- **Analytics**: Product views and sales reporting

## Files Included

1. **`complete-mysql-schema.sql`** - Complete database schema with all tables
2. **`migration-script.sql`** - Migration helpers and stored procedures
3. **`mysql-setup.sql`** - Original basic schema (legacy)
4. **`DATABASE_SETUP_GUIDE.md`** - This guide

## Prerequisites

- MySQL 8.0 or higher
- XAMPP, WAMP, or standalone MySQL installation
- MySQL Workbench or phpMyAdmin (recommended)
- Node.js application with MySQL2 driver

## Setup Instructions

### Step 1: Create Database

```sql
CREATE DATABASE IF NOT EXISTS gkicks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gkicks;
```

### Step 2: Run Complete Schema

Execute the complete schema file:

```bash
mysql -u root -p gkicks < complete-mysql-schema.sql
```

Or import via phpMyAdmin/MySQL Workbench:
1. Open phpMyAdmin
2. Select `gkicks` database
3. Go to Import tab
4. Choose `complete-mysql-schema.sql`
5. Click Go

### Step 3: Run Migration Script (Optional)

If you have existing data to migrate:

```bash
mysql -u root -p gkicks < migration-script.sql
```

### Step 4: Update Environment Variables

Update your `.env.local` file:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gkicks
DB_USER=root
DB_PASSWORD=your_password

# For connection string format
DATABASE_URL="mysql://root:your_password@localhost:3306/gkicks"
```

### Step 5: Test Connection

Test your database connection:

```javascript
// Test in Node.js
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'your_password',
      database: 'gkicks'
    });
    
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM products');
    console.log('Products in database:', rows[0].count);
    
    await connection.end();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

testConnection();
```

## Database Schema Details

### Core Tables

#### Users Table
- **Purpose**: Customer account management
- **Key Fields**: email, password_hash, profile info
- **Features**: Email verification, last login tracking

#### Admin Users Table
- **Purpose**: Admin and staff account management
- **Key Fields**: username, role, permissions
- **Roles**: admin, staff, manager

#### Products Table
- **Purpose**: Main product catalog
- **Key Fields**: name, brand, price, stock, SEO fields
- **Features**: Multi-category support, inventory tracking

#### Product Variants Table
- **Purpose**: Size/color combinations
- **Key Fields**: size, color, individual stock levels
- **Features**: Separate inventory per variant

#### Orders Table
- **Purpose**: Order management
- **Key Fields**: status, payment info, addresses
- **Features**: Complete order lifecycle tracking

### Relationships

```
Users (1) -----> (M) Orders
Users (1) -----> (M) Cart Items
Users (1) -----> (M) Wishlist Items

Products (1) -----> (M) Product Variants
Products (1) -----> (M) Cart Items
Products (1) -----> (M) Order Items

Orders (1) -----> (M) Order Items
Categories (1) -----> (M) Products
```

## Default Data

### Admin Accounts
- **Username**: `admin` / **Password**: `admin123`
- **Username**: `staff` / **Password**: `admin123`

### Sample Products
- Nike Air Max 97 SE
- Adidas UltraBoost 23
- New Balance Fresh Foam X
- ASICS Gel-Kayano 30

### Categories
- Men, Women, Kids, Unisex
- Running, Casual, Formal

## Stored Procedures

### UpdateProductStock
Updates product and variant stock levels:
```sql
CALL UpdateProductStock(product_id, variant_id, quantity_change);
```

### CreateOrder
Creates order and moves cart items:
```sql
CALL CreateOrder(user_id, order_number, total_amount, shipping_address, billing_address, payment_method);
```

### RecordProductView
Tracks product views for analytics:
```sql
CALL RecordProductView(user_id, product_id, ip_address);
```

## Views

### active_products_view
Shows active products with stock status and variant count.

### order_summary_view
Provides order summaries with customer info and item counts.

## Performance Features

### Indexes
- Product search optimization
- Category and brand filtering
- Order reporting queries
- User lookup optimization

### Triggers
- Automatic stock updates
- Order total calculations
- Timestamp management

## Common Queries

### Get Products by Category
```sql
SELECT * FROM active_products_view 
WHERE category = 'men' 
ORDER BY created_at DESC;
```

### Get User's Cart
```sql
SELECT ci.*, p.name, p.brand, p.image_url
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
WHERE ci.user_id = ?;
```

### Get Order History
```sql
SELECT * FROM order_summary_view
WHERE user_id = ?
ORDER BY created_at DESC;
```

### Get Low Stock Products
```sql
SELECT name, brand, stock_quantity, low_stock_threshold
FROM products
WHERE stock_quantity <= low_stock_threshold
AND is_active = TRUE;
```

## Maintenance

### Regular Tasks
1. **Backup Database**: Schedule regular backups
2. **Clean Old Sessions**: Remove expired cart items
3. **Update Analytics**: Refresh product view counts
4. **Archive Orders**: Move old completed orders to archive

### Monitoring
- Monitor slow queries
- Check index usage
- Track database size growth
- Monitor connection pool usage

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check MySQL service is running
   - Verify credentials in .env.local
   - Check firewall settings

2. **Foreign Key Errors**
   - Ensure parent records exist
   - Check constraint definitions
   - Verify data types match

3. **Performance Issues**
   - Check query execution plans
   - Verify indexes are being used
   - Consider query optimization

### Debug Queries

```sql
-- Check table sizes
SELECT 
    table_name,
    table_rows,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'gkicks'
ORDER BY (data_length + index_length) DESC;

-- Check index usage
SHOW INDEX FROM products;

-- Check slow queries
SHOW PROCESSLIST;
```

## Security Considerations

1. **Password Hashing**: Use bcrypt with salt rounds ≥ 10
2. **SQL Injection**: Always use prepared statements
3. **Access Control**: Implement proper role-based permissions
4. **Data Validation**: Validate all input data
5. **Audit Trail**: Log important database changes

## Next Steps

1. Update your application's database connection
2. Modify API endpoints to use new schema
3. Update frontend components to match new data structure
4. Test all functionality thoroughly
5. Set up database monitoring and backups

---

**Note**: Always backup your existing database before running migration scripts!