import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database/mysql';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Check if user has admin permissions (you may want to add proper auth check)
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const formData = await request.formData();
    const file = formData.get('backup') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No backup file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!file.name.endsWith('.sql') && !file.name.endsWith('.db')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .sql and .db files are allowed.' },
        { status: 400 }
      );
    }
    
    // Read file content
    const fileContent = await file.text();
    
    if (!fileContent.trim()) {
      return NextResponse.json(
        { error: 'Backup file is empty' },
        { status: 400 }
      );
    }
    
    // Get a connection from the pool for transaction
    const connection = await pool.getConnection();
    
    try {
      // Begin transaction for atomic restore
      await connection.query('START TRANSACTION');
      
      // Disable foreign key checks during restore
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Split SQL content into individual statements
      const statements = fileContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
      
      let executedCount = 0;
      
      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.query(statement);
            executedCount++;
          } catch (stmtError) {
            console.error('Statement error:', statement, stmtError);
            // Continue with other statements for non-critical errors
            // But still count critical errors
            if (stmtError instanceof Error && 
                (stmtError.message.includes('syntax error') || 
                 stmtError.message.includes('doesn\'t exist'))) {
              // For critical errors, we might want to continue but log them
              console.warn('Non-critical error, continuing:', stmtError.message);
            }
          }
        }
      }
      
      // Re-enable foreign key checks
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      
      // Commit transaction
      await connection.query('COMMIT');
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'Database restored successfully',
          statementsExecuted: executedCount,
          totalStatements: statements.length
        },
        { status: 200 }
      );
      
    } catch (restoreError) {
      // Rollback transaction on error
      await connection.query('ROLLBACK');
      throw restoreError;
    } finally {
      // Always release the connection back to the pool
      connection.release();
    }
    
  } catch (error) {
    console.error('Restore error:', error);
    
    // Determine error message based on error type
    let errorMessage = 'Failed to restore database';
    if (error instanceof Error) {
      if (error.message.includes('corrupt') || error.message.includes('malformed')) {
        errorMessage = 'Backup file appears to be corrupted';
      } else if (error.message.includes('syntax error') || error.message.includes('SQL syntax')) {
        errorMessage = 'Invalid SQL syntax in backup file';
      } else if (error.message.includes('doesn\'t exist') || error.message.includes('Unknown table')) {
        errorMessage = 'Backup file structure does not match current database';
      } else if (error.message.includes('Access denied') || error.message.includes('permission')) {
        errorMessage = 'Database access denied. Check permissions.';
      } else if (error.message.includes('Connection')) {
        errorMessage = 'Database connection failed. Please try again.';
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to validate SQL content
function isValidSQLBackup(content: string): boolean {
  // Basic validation - check for common SQL keywords
  const sqlKeywords = ['CREATE TABLE', 'INSERT INTO', 'DROP TABLE'];
  return sqlKeywords.some(keyword => content.toUpperCase().includes(keyword));
}