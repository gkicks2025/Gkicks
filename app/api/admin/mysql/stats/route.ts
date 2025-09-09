import { NextResponse } from 'next/server';
import {
  testConnection,
  getDatabaseStats,
  getTableSchema,
  executeQuery
} from '@/lib/database/mysql-simulator';

export async function GET() {
  try {
    console.log('🔍 Getting MySQL database stats...');
    
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json({
        connection: 'Failed',
        error: 'Database connection failed',
        database: 'gkicks',
        host: 'localhost (SQLite backend)',
        port: 'N/A',
        tables: [],
        totalRecords: 0
      }, { status: 500 });
    }
    
    console.log('✅ MySQL Simulator connection successful for stats');
    
    // Get database statistics
    const dbStats = await getDatabaseStats();
    
    const stats = {
      connection: 'Connected',
      database: 'gkicks',
      host: 'localhost (SQLite backend)',
      port: 'N/A',
      tables: [] as any[],
      totalRecords: 0
    };
    
    // Get table information
    const tableNames = ['products', 'categories', 'users', 'orders', 'order_items'];
    
    for (const tableName of tableNames) {
      try {
        // Get row count for each table
        const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
        const countResult = await executeQuery(countQuery);
        const count = countResult[0]?.count || 0;
        
        // Get table structure
        const structure = await getTableSchema(tableName);
        
        stats.tables.push({
          name: tableName,
          rows: count,
          structure: structure
        });
        
        stats.totalRecords += count;
      } catch (tableError) {
        console.warn(`⚠️ Could not get info for table ${tableName}:`, tableError);
        stats.tables.push({
          name: tableName,
          rows: 0,
          structure: [],
          error: 'Table does not exist or could not access'
        });
      }
    }
    
    console.log(`✅ Retrieved stats for ${stats.tables.length} tables`);
    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('❌ MySQL stats error:', error);
    
    return NextResponse.json({
      connection: 'Failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      database: 'gkicks',
      host: 'localhost (SQLite backend)',
      port: 'N/A',
      tables: [],
      totalRecords: 0
    }, { status: 500 });
  }
}