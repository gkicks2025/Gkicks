const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function executeSchema() {
  console.log('🚀 Executing MySQL schema...');
  
  // Database configuration
  const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'gkicks',
    multipleStatements: true
  };

  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL database');
    
    // Read SQL file
    const sqlFile = path.join(__dirname, 'database', 'mysql-setup.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    console.log('📄 Read mysql-setup.sql file');
    
    // Clean up SQL content - remove comments and empty lines
    const cleanedSql = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n');
    
    // Split SQL into individual statements
    const statements = cleanedSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log(`✅ Executed statement ${i + 1}/${statements.length}: ${statement.substring(0, 30)}...`);
        } catch (error) {
          console.log(`⚠️  Warning executing statement ${i + 1}: ${error.message}`);
          console.log(`Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }
    
    // Verify tables were created
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📊 Database tables created:');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    
    console.log('\n🎉 MySQL schema execution completed successfully!');
    
  } catch (error) {
    console.error('❌ Error executing schema:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

executeSchema();