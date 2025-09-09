/**
 * MySQL Database Configuration for GKICKS
 * 
 * This file provides database connection configuration and utilities
 * for the GKICKS shoe store application.
 */

import mysql from 'mysql2/promise';

// Database configuration interface
export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
  reconnect?: boolean;
}

// Default database configuration
const defaultConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gkicks',
  connectionLimit: 10,
  reconnect: true,
};

// Connection pool
let pool: mysql.Pool | null = null;

/**
 * Get database configuration from environment variables
 */
export function getDatabaseConfig(): DatabaseConfig {
  return {
    ...defaultConfig,
    host: process.env.DB_HOST || defaultConfig.host,
    port: parseInt(process.env.DB_PORT || defaultConfig.port.toString()),
    user: process.env.DB_USER || defaultConfig.user,
    password: process.env.DB_PASSWORD || defaultConfig.password,
    database: process.env.DB_NAME || defaultConfig.database,
  };
}

/**
 * Create and return database connection pool
 */
export function getConnectionPool(): mysql.Pool {
  if (!pool) {
    const config = getDatabaseConfig();
    
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: config.connectionLimit,
      queueLimit: 0,
      // Additional MySQL 8.0+ settings
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      charset: 'utf8mb4',
      timezone: '+00:00',
      dateStrings: false,
      // Performance settings
      supportBigNumbers: true,
      bigNumberStrings: false,
    });

    // Handle pool events
    pool.on('connection', (connection: any) => {
      console.log('New MySQL connection established as id ' + connection.threadId);
    });

    pool.on('error' as any, (err: any) => {
      console.error('MySQL pool error:', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Recreating MySQL connection pool...');
        pool = null;
        return getConnectionPool();
      } else {
        throw err;
      }
    });
  }
  
  return pool;
}

/**
 * Get a single database connection
 */
export async function getConnection(): Promise<mysql.PoolConnection> {
  const pool = getConnectionPool();
  return await pool.getConnection();
}

/**
 * Execute a query with automatic connection management
 */
export async function executeQuery<T = any>(
  query: string,
  params?: any[]
): Promise<[T[], mysql.FieldPacket[]]> {
  const pool = getConnectionPool();
  return await pool.execute(query, params) as [T[], mysql.FieldPacket[]];
}

/**
 * Execute a query and return only the results
 */
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const [rows] = await executeQuery<T>(sql, params);
  return rows;
}

/**
 * Execute a query and return the first result
 */
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute an insert query and return the inserted ID
 */
export async function insert(
  sql: string,
  params?: any[]
): Promise<number> {
  const pool = getConnectionPool();
  const [result] = await pool.execute(sql, params) as [mysql.ResultSetHeader, mysql.FieldPacket[]];
  return result.insertId;
}

/**
 * Execute an update/delete query and return affected rows
 */
export async function update(
  sql: string,
  params?: any[]
): Promise<number> {
  const pool = getConnectionPool();
  const [result] = await pool.execute(sql, params) as [mysql.ResultSetHeader, mysql.FieldPacket[]];
  return result.affectedRows;
}

/**
 * Begin a database transaction
 */
export async function beginTransaction(): Promise<mysql.PoolConnection> {
  const connection = await getConnection();
  await connection.beginTransaction();
  return connection;
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await beginTransaction();
  
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const [rows] = await executeQuery('SELECT 1 as test');
    return rows.length > 0 && (rows[0] as any).test === 1;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Close all database connections
 */
export async function closeConnections(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('MySQL connection pool closed');
  }
}

/**
 * Database health check
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: {
    connected: boolean;
    poolConnections?: number;
    error?: string;
  };
}> {
  try {
    const connected = await testConnection();
    
    if (!connected) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          error: 'Connection test failed'
        }
      };
    }

    const pool = getConnectionPool();
    const poolConnections = (pool as any)._allConnections?.length || 0;

    return {
      status: 'healthy',
      details: {
        connected: true,
        poolConnections
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

// Export types
export type { PoolConnection, ResultSetHeader, FieldPacket } from 'mysql2/promise';

// Default export
export default {
  getDatabaseConfig,
  getConnectionPool,
  getConnection,
  executeQuery,
  query,
  queryOne,
  insert,
  update,
  beginTransaction,
  transaction,
  testConnection,
  closeConnections,
  healthCheck,
};