const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function setupMainDatabase() {
  console.log('🚀 Setting up main database schema...');
  
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'gkicks',
      multipleStatements: true
    });
    
    console.log('✅ Connected to MySQL database');
    
    // Read the complete schema file
    const schemaPath = path.join(__dirname, 'database', 'complete-mysql-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Reading complete-mysql-schema.sql...');
    
    // Execute the entire schema as one statement (MySQL supports multiple statements)
    console.log('🔄 Executing complete schema...');
    
    try {
      await connection.query(schema);
      console.log('✅ Schema executed successfully');
    } catch (error) {
      console.error('❌ Error executing schema:', error.message);
      
      // Fallback: try executing statement by statement
      console.log('🔄 Trying statement-by-statement execution...');
      
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
      
      console.log(`📋 Found ${statements.length} SQL statements to execute`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          try {
            await connection.execute(statement);
            if (statement.toLowerCase().includes('create table')) {
              const tableName = statement.match(/create table (?:if not exists )?`?([a-zA-Z_]+)`?/i)?.[1];
              if (tableName) {
                console.log(`✅ Created table: ${tableName}`);
              }
            }
          } catch (error) {
            // Skip errors for DROP TABLE IF EXISTS and other non-critical errors
            if (!error.message.includes('Unknown table') && 
                !error.message.includes('doesn\'t exist') &&
                !error.message.includes('already exists')) {
              console.warn(`⚠️  Warning executing statement ${i + 1}: ${error.message}`);
              console.warn(`Statement: ${statement.substring(0, 100)}...`);
            }
          }
        }
      }
    }
    
    // Verify tables were created
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📊 Database tables created:');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    
    await connection.end();
    console.log('\n🎉 Main database schema setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart the development server to clear any cached errors');
    console.log('2. Create an admin user using: node scripts/create-admin.js');
    console.log('3. Test the POS system with proper authentication');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

setupMainDatabase();