# MySQL Database Setup Guide for GKicks

This guide will help you set up MySQL database integration for your GKicks application. Since local MySQL installation can be complex, we recommend using cloud MySQL services.

## 🚀 Quick Setup with Cloud MySQL Services

### Option 1: PlanetScale (Recommended)

1. **Create Account**: Go to [PlanetScale](https://planetscale.com) and create a free account
2. **Create Database**: Create a new database named `gkicks`
3. **Get Connection Details**: Copy the connection string from your dashboard
4. **Update Environment Variables**:
   ```env
   MYSQL_HOST=your-planetscale-host.com
   MYSQL_PORT=3306
   MYSQL_USER=your-username
   MYSQL_PASSWORD=your-password
   MYSQL_DATABASE=gkicks
   MYSQL_SSL=true
   ```

### Option 2: Railway

1. **Create Account**: Go to [Railway](https://railway.app) and create an account
2. **Deploy MySQL**: Click "New Project" → "Deploy MySQL"
3. **Get Connection Details**: Copy connection details from the Variables tab
4. **Update Environment Variables**: Same as above with your Railway credentials

### Option 3: Local MySQL (Advanced)

If you prefer local installation:

1. **Install MySQL**: Download from [MySQL Official Site](https://dev.mysql.com/downloads/mysql/)
2. **Create Database**:
   ```sql
   CREATE DATABASE gkicks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'gkicks_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON gkicks.* TO 'gkicks_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
3. **Update Environment Variables**:
   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=gkicks_user
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=gkicks
   MYSQL_SSL=false
   ```

## 📋 Database Setup Steps

### 1. Install Dependencies

The `mysql2` package is already installed. If you need to reinstall:

```bash
npm install mysql2
```

### 2. Set Up Database Schema

Run the MySQL setup script to create tables:

```sql
-- Copy and paste the contents of database/mysql-setup.sql
-- into your MySQL client or cloud dashboard
```

### 3. Migrate Data (Optional)

If you have existing SQLite data to migrate:

```bash
# Test connections first
node database/migrate-to-mysql.js --test

# Run migration
node database/migrate-to-mysql.js --migrate
```

### 4. Test MySQL Integration

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Test MySQL API**:
   - Visit: `http://localhost:3002/api/products/mysql`
   - Should return products from MySQL database

3. **Access phpMyAdmin-like Interface**:
   - Visit: `http://localhost:3002/admin/mysql`
   - Manage products through web interface

## 👤 Creating Admin Users

### Method 1: Web Interface (Recommended)
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the admin user management page:
   ```
   http://localhost:3000/admin/users
   ```

3. Use the "Create Admin User" tab to add new administrators

### Method 2: Command Line Script
1. Run the admin creation script:
   ```bash
   node scripts/create-admin.js
   ```

2. Follow the interactive prompts to create an admin user

### Method 3: Direct API Call
```bash
curl -X POST http://localhost:3000/api/admin/mysql \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "securepassword123",
    "first_name": "Admin",
    "last_name": "User",
    "phone": "+1234567890"
  }'
```

## 🔧 Configuration Files

### Environment Variables (.env.local)

```env
# MySQL Configuration
MYSQL_HOST=your-mysql-host
MYSQL_PORT=3306
MYSQL_USER=your-username
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=gkicks
MYSQL_SSL=true  # Set to false for local MySQL
```

### Key Files Created

- `lib/database/mysql.ts` - MySQL connection and query functions
- `app/api/products/mysql/route.ts` - MySQL API endpoints
- `app/api/admin/mysql/route.ts` - Admin user management API
- `app/admin/mysql/page.tsx` - phpMyAdmin-like web interface
- `app/admin/users/page.tsx` - Admin user management interface
- `database/mysql-setup.sql` - Database schema
- `database/migrate-to-mysql.js` - Data migration script
- `scripts/create-admin.js` - CLI tool for creating admin users

## 🌐 API Endpoints

### MySQL Product API

- **GET** `/api/products/mysql` - Fetch all products
- **POST** `/api/products/mysql` - Create new product
- **PUT** `/api/products/mysql` - Update product
- **DELETE** `/api/products/mysql?id=1` - Delete product

### Example Usage

```javascript
// Fetch products from MySQL
const response = await fetch('/api/products/mysql');
const data = await response.json();
console.log(data.products);

// Create new product
const newProduct = {
  name: 'Air Jordan 1',
  brand: 'Nike',
  price: 170.00,
  description: 'Classic basketball shoe',
  colors: ['Black', 'Red', 'White'],
  category: 'men',
  stock_quantity: 25,
  sku: 'NIKE-AJ1-001'
};

const createResponse = await fetch('/api/products/mysql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newProduct)
});
```

## 🎛️ Admin Interface Features

### Database Management

- **Connection Status**: Real-time MySQL connection monitoring
- **Product CRUD**: Create, Read, Update, Delete products
- **Data Visualization**: Statistics and database insights
- **Schema Viewer**: View database structure
- **Bulk Operations**: Import/export capabilities

### Access Admin Panel

1. Start your application: `npm run dev`
2. Navigate to: `http://localhost:3002/admin/mysql`
3. Manage your MySQL database through the web interface

## 🔍 Troubleshooting

### Connection Issues

1. **Check Environment Variables**: Ensure all MySQL credentials are correct
2. **Test Connection**: Run `node database/migrate-to-mysql.js --test`
3. **SSL Issues**: For cloud services, ensure `MYSQL_SSL=true`
4. **Firewall**: Check if MySQL port (3306) is accessible

### Common Errors

- **"Access denied"**: Check username/password
- **"Connection refused"**: Check host/port settings
- **"SSL required"**: Set `MYSQL_SSL=true` for cloud services
- **"Database doesn't exist"**: Create database first

### Migration Issues

- **"No products found"**: Check if SQLite database exists
- **"Duplicate entry"**: Clear MySQL table before migration
- **"JSON parse error"**: Check data format in SQLite

## 📊 Database Schema

### Products Table

```sql
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews INT DEFAULT 0,
  colors JSON,
  color_images JSON,
  sizes JSON,
  is_new BOOLEAN DEFAULT FALSE,
  is_sale BOOLEAN DEFAULT FALSE,
  views INT DEFAULT 0,
  category VARCHAR(50) DEFAULT 'unisex',
  stock_quantity INT DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🚀 Next Steps

1. **Choose MySQL Provider**: Select PlanetScale, Railway, or local MySQL
2. **Set Up Database**: Create database and configure connection
3. **Run Schema Setup**: Execute the SQL schema script
4. **Test Integration**: Verify API endpoints work
5. **Migrate Data**: Transfer existing data if needed
6. **Update Application**: Switch main API to use MySQL

## 💡 Tips

- **Development**: Use local MySQL or SQLite for development
- **Production**: Use cloud MySQL services for production
- **Backup**: Regular database backups are recommended
- **Monitoring**: Monitor connection pool and query performance
- **Security**: Use environment variables for credentials

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.