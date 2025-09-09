import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Check if user has admin permissions (you may want to add proper auth check)
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Get all table names from MySQL
    const tables = await executeQuery(`
      SELECT TABLE_NAME as name 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `) as { name: string }[];

    let sqlDump = '';
    
    // Add header comment
    sqlDump += `-- GKICKS Database Backup\n`;
    sqlDump += `-- Generated on: ${new Date().toISOString()}\n`;
    sqlDump += `-- Database: MySQL\n\n`;
    
    // Disable foreign key checks during restore
    sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
    
    for (const table of tables) {
      const tableName = table.name;
      
      try {
        // Get table structure
        const createTableResult = await executeQuery(`SHOW CREATE TABLE \`${tableName}\``) as { 'Create Table': string }[];
        
        if (createTableResult && createTableResult.length > 0) {
          const createTableSQL = createTableResult[0]['Create Table'];
          
          sqlDump += `-- Table structure for ${tableName}\n`;
          sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
          sqlDump += `${createTableSQL};\n\n`;
          
          // Get table data
          const rows = await executeQuery(`SELECT * FROM \`${tableName}\``);
          
          if (rows && rows.length > 0) {
            sqlDump += `-- Data for table ${tableName}\n`;
            
            // Get column information
            const columns = await executeQuery(`
              SELECT COLUMN_NAME as name, DATA_TYPE as type 
              FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = '${tableName}'
              ORDER BY ORDINAL_POSITION
            `) as { name: string; type: string }[];
            
            const columnNames = columns.map(col => `\`${col.name}\``).join(', ');
            
            for (const row of rows) {
              const values = columns.map((col: { name: string }) => {
                const value = (row as any)[col.name];
                if (value === null || value === undefined) return 'NULL';
                if (typeof value === 'string') {
                  return `'${value.replace(/'/g, "\\'").replace(/\\/g, '\\\\')}'`; // Escape quotes and backslashes
                }
                if (value instanceof Date) {
                  return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
                }
                if (typeof value === 'boolean') {
                  return value ? '1' : '0';
                }
                return value;
              }).join(', ');
              
              sqlDump += `INSERT INTO \`${tableName}\` (${columnNames}) VALUES (${values});\n`;
            }
            sqlDump += '\n';
          }
        }
      } catch (tableError) {
        console.error(`Error processing table ${tableName}:`, tableError);
        sqlDump += `-- Error processing table ${tableName}: ${tableError}\n\n`;
      }
    }
    
    // Re-enable foreign key checks
    sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    
    // Create response with SQL dump
    const response = new NextResponse(sqlDump, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="gkicks-backup-${new Date().toISOString().split('T')[0]}.sql"`,
      },
    });
    
    return response;
    
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}