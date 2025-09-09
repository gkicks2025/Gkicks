// @ts-ignore - better-sqlite3 types not available
const Database = require('better-sqlite3');
import path from 'path';

// MySQL Simulator using SQLite backend
// This provides MySQL-like functionality while using SQLite as the storage engine

const dbPath = path.join(process.cwd(), 'database', 'gkicks.db');
let db: any | null = null;

// Initialize database connection
function getDatabase() {
  if (!db) {
    try {
      db = new Database(dbPath);
      console.log('✅ MySQL Simulator: Connected to SQLite backend');
    } catch (error) {
      console.error('❌ MySQL Simulator: Failed to connect to SQLite backend:', error);
      throw error;
    }
  }
  return db;
}

// Ensure admin_users table exists
async function ensureAdminUsersTable(): Promise<void> {
  try {
    const database = getDatabase();
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL
      )
    `;
    
    database.prepare(createTableQuery).run();
    
    // Create indexes for better performance
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email)',
      'CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_admin_users_deleted ON admin_users(deleted_at)'
    ];
    
    for (const indexQuery of createIndexes) {
      database.prepare(indexQuery).run();
    }
    
    console.log('✅ MySQL Simulator: admin_users table and indexes ensured');
  } catch (error) {
    console.error('❌ MySQL Simulator: Failed to create admin_users table:', error);
    throw error;
  }
}

// Test connection (MySQL-compatible)
export async function testConnection(): Promise<boolean> {
  try {
    const database = getDatabase();
    
    // Ensure admin_users table exists
    await ensureAdminUsersTable();
    
    // Test with a simple query
    database.prepare('SELECT 1 as test').get();
    console.log('✅ MySQL Simulator: Connection test successful');
    return true;
  } catch (error) {
    console.error('❌ MySQL Simulator: Connection test failed:', error);
    return false;
  }
}

// Execute query (MySQL-compatible interface)
export async function executeQuery(query: string, params: any[] = []): Promise<any> {
  try {
    const database = getDatabase();
    
    // Convert boolean values to integers for SQLite compatibility
    const sqliteParams = params.map(param => {
      if (typeof param === 'boolean') {
        return param ? 1 : 0;
      }
      return param;
    });
    
    // Handle different query types
    const queryType = query.trim().toUpperCase();
    
    if (queryType.startsWith('SELECT') || queryType.startsWith('PRAGMA')) {
      // SELECT and PRAGMA queries - return array of results
      const stmt = database.prepare(query);
      const results = stmt.all(...sqliteParams);
      console.log(`✅ MySQL Simulator: ${queryType.split(' ')[0]} query returned ${results.length} rows`);
      return results;
    } else if (queryType.startsWith('INSERT')) {
      // INSERT queries - return insertId and affectedRows
      const stmt = database.prepare(query);
      const result = stmt.run(...sqliteParams);
      console.log(`✅ MySQL Simulator: INSERT query affected ${result.changes} rows`);
      return {
        insertId: result.lastInsertRowid,
        affectedRows: result.changes
      };
    } else if (queryType.startsWith('UPDATE') || queryType.startsWith('DELETE')) {
      // UPDATE/DELETE queries - return affectedRows
      const stmt = database.prepare(query);
      const result = stmt.run(...sqliteParams);
      console.log(`✅ MySQL Simulator: ${queryType.split(' ')[0]} query affected ${result.changes} rows`);
      return {
        affectedRows: result.changes
      };
    } else {
      // Other queries (CREATE, DROP, etc.)
      const stmt = database.prepare(query);
      const result = stmt.run(...sqliteParams);
      console.log(`✅ MySQL Simulator: ${queryType.split(' ')[0]} query executed successfully`);
      return result;
    }
  } catch (error) {
    console.error('❌ MySQL Simulator: Query execution failed:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

// Get all products (MySQL-compatible)
export async function getAllProducts(): Promise<any[]> {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.description,
      p.price,
      p.image_url,
      p.category_id,
      p.stock_quantity,
      p.is_featured,
      p.created_at,
      p.updated_at,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.deleted_at IS NULL
    ORDER BY p.created_at DESC
  `;
  
  return await executeQuery(query);
}

// Get product by ID (MySQL-compatible)
export async function getProductById(id: number): Promise<any | null> {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.description,
      p.price,
      p.image_url,
      p.category_id,
      p.stock_quantity,
      p.is_featured,
      p.created_at,
      p.updated_at,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ? AND p.deleted_at IS NULL
  `;
  
  const results = await executeQuery(query, [id]);
  return results.length > 0 ? results[0] : null;
}

// Insert product (MySQL-compatible)
export async function insertProduct(productData: any): Promise<number> {
  const query = `
    INSERT INTO products (
      name, description, price, image_url, category_id, 
      stock_quantity, is_featured, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `;
  
  const params = [
    productData.name,
    productData.description,
    productData.price,
    productData.image_url,
    productData.category_id,
    productData.stock_quantity || 0,
    productData.is_featured || false
  ];
  
  const result = await executeQuery(query, params);
  return result.insertId;
}

// Update product (MySQL-compatible)
export async function updateProduct(id: number, productData: any): Promise<boolean> {
  const query = `
    UPDATE products SET
      name = ?, description = ?, price = ?, image_url = ?,
      category_id = ?, stock_quantity = ?, is_featured = ?,
      updated_at = datetime('now')
    WHERE id = ? AND deleted_at IS NULL
  `;
  
  const params = [
    productData.name,
    productData.description,
    productData.price,
    productData.image_url,
    productData.category_id,
    productData.stock_quantity,
    productData.is_featured,
    id
  ];
  
  const result = await executeQuery(query, params);
  return result.affectedRows > 0;
}

// Soft delete product (MySQL-compatible)
export async function deleteProduct(id: number): Promise<boolean> {
  const query = `
    UPDATE products SET
      deleted_at = datetime('now'),
      updated_at = datetime('now')
    WHERE id = ? AND deleted_at IS NULL
  `;
  
  const result = await executeQuery(query, [id]);
  return result.affectedRows > 0;
}

// Get database statistics (MySQL-compatible)
export async function getDatabaseStats(): Promise<any> {
  const queries = {
    totalProducts: 'SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL',
    totalCategories: 'SELECT COUNT(*) as count FROM categories',
    totalUsers: 'SELECT COUNT(*) as count FROM users',
    featuredProducts: 'SELECT COUNT(*) as count FROM products WHERE is_featured = 1 AND deleted_at IS NULL'
  };
  
  const stats: any = {};
  
  for (const [key, query] of Object.entries(queries)) {
    try {
      const result = await executeQuery(query);
      stats[key] = result[0]?.count || 0;
    } catch (error) {
      console.warn(`Warning: Could not get ${key} stat:`, error);
      stats[key] = 0;
    }
  }
  
  return stats;
}

// Get table schema (MySQL-compatible)
export async function getTableSchema(tableName: string): Promise<any[]> {
  try {
    const query = `PRAGMA table_info(${tableName})`;
    const columns = await executeQuery(query);
    
    // Check if columns is an array and has data
    if (!Array.isArray(columns) || columns.length === 0) {
      console.warn(`⚠️ No schema found for table ${tableName} or table does not exist`);
      return [];
    }
    
    // Convert SQLite schema to MySQL-like format
    return columns.map((col: any) => ({
      Field: col.name,
      Type: col.type,
      Null: col.notnull ? 'NO' : 'YES',
      Key: col.pk ? 'PRI' : '',
      Default: col.dflt_value,
      Extra: col.pk ? 'auto_increment' : ''
    }));
  } catch (error) {
    console.error(`❌ Error getting schema for table ${tableName}:`, error);
    return [];
  }
}

// Close database connection
export function closeConnection(): void {
  if (db) {
    db.close();
    db = null;
    console.log('✅ MySQL Simulator: Database connection closed');
  }
}

// Export for compatibility
export {
  testConnection as testMySQLConnection,
  executeQuery as executeMySQLQuery,
  getAllProducts as getAllMySQLProducts,
  getProductById as getMySQLProductById,
  insertProduct as insertMySQLProduct,
  updateProduct as updateMySQLProduct,
  deleteProduct as deleteMySQLProduct
};