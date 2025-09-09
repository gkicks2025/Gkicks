import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Database connection singleton
let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

// Initialize database connection
export async function getDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (db) {
    return db;
  }

  try {
    const dbPath = process.env.DATABASE_PATH || './database/gkicks.db';
    const fullPath = path.resolve(process.cwd(), dbPath);
    
    db = await open({
      filename: fullPath,
      driver: sqlite3.Database
    });

    console.log('✅ SQLite database connected successfully');
    return db;
  } catch (error) {
    console.error('❌ Error connecting to SQLite database:', error);
    throw error;
  }
}

// Close database connection
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    console.log('🔒 SQLite database connection closed');
  }
}

// Execute a query with parameters
export async function executeQuery<T = any>(
  query: string, 
  params: any[] = []
): Promise<T[]> {
  try {
    const database = await getDatabase();
    const result = await database.all(query, params);
    return result as T[];
  } catch (error) {
    console.error('❌ Database query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

// Execute a single query (for INSERT, UPDATE, DELETE)
export async function executeRun(
  query: string, 
  params: any[] = []
): Promise<{ lastID?: number; changes: number }> {
  try {
    const database = await getDatabase();
    const result = await database.run(query, params);
    return {
      lastID: result.lastID,
      changes: result.changes || 0
    };
  } catch (error) {
    console.error('❌ Database run error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

// Get a single row
export async function getOne<T = any>(
  query: string, 
  params: any[] = []
): Promise<T | null> {
  try {
    const database = await getDatabase();
    const result = await database.get(query, params);
    return (result as T) || null;
  } catch (error) {
    console.error('❌ Database get error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (db: Database<sqlite3.Database, sqlite3.Statement>) => Promise<T>
): Promise<T> {
  const database = await getDatabase();
  
  try {
    await database.exec('BEGIN TRANSACTION');
    const result = await callback(database);
    await database.exec('COMMIT');
    return result;
  } catch (error) {
    await database.exec('ROLLBACK');
    throw error;
  }
}

// Helper function to check if database exists and is accessible
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const database = await getDatabase();
    await database.get('SELECT 1');
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}

// Export types for better TypeScript support
export type DatabaseConnection = Database<sqlite3.Database, sqlite3.Statement>;