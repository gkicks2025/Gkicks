const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

async function executeEmailVerificationMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'gkicks',
    multipleStatements: true
  });

  try {
    console.log('🔌 Connected to MySQL database');
    
    // Read and execute the SQL file
    const sqlFile = path.join(__dirname, 'database', 'add-email-verification-tokens.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log('📝 Executing SQL statements...');
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await connection.execute(statement);
      }
    }
    console.log('✅ All SQL statements executed successfully!');
    
    // Verify the table was created
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'email_verification_tokens'"
    );
    
    if (tables.length > 0) {
      console.log('✅ Verified: email_verification_tokens table exists');
      
      // Show table structure
      const [columns] = await connection.execute(
        'DESCRIBE email_verification_tokens'
      );
      console.log('📋 Table structure:');
      columns.forEach(col => {
        console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
      });
    }
    
    // Check if email_verified column was added to users table
    const [userColumns] = await connection.execute(
      "SHOW COLUMNS FROM users LIKE 'email_verified'"
    );
    
    if (userColumns.length > 0) {
      console.log('✅ Verified: email_verified column added to users table');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
executeEmailVerificationMigration()
  .then(() => {
    console.log('🎉 Email verification migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });