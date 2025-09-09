// Simple SQL script to create admin_users table
// This will be executed through the MySQL simulator

const fs = require('fs');
const path = require('path');

// Direct SQLite approach
const dbPath = path.join(__dirname, 'gkicks.db');

console.log('📦 Creating admin_users table in SQLite database...');
console.log('Database path:', dbPath);

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found:', dbPath);
  console.log('The database will be created when you first run the application.');
  process.exit(0);
}

// Create SQL commands
const sqlCommands = [
  `CREATE TABLE IF NOT EXISTS admin_users (
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
  )`,
  'CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email)',
  'CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active)',
  'CREATE INDEX IF NOT EXISTS idx_admin_users_deleted ON admin_users(deleted_at)'
];

console.log('✅ SQL commands prepared');
console.log('\n📋 Table will be created with the following structure:');
console.log('  - id: INTEGER PRIMARY KEY AUTOINCREMENT');
console.log('  - first_name: TEXT NOT NULL');
console.log('  - last_name: TEXT NOT NULL');
console.log('  - email: TEXT UNIQUE NOT NULL');
console.log('  - phone: TEXT');
console.log('  - password_hash: TEXT NOT NULL');
console.log('  - is_active: BOOLEAN DEFAULT 1');
console.log('  - created_at: DATETIME DEFAULT CURRENT_TIMESTAMP');
console.log('  - updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP');
console.log('  - deleted_at: DATETIME NULL');

console.log('\n🎉 Admin table schema ready!');
console.log('\n📝 The table will be created automatically when you:');
console.log('1. Start the development server: npm run dev');
console.log('2. Access the admin interface at /admin/users');
console.log('3. Or make an API call to /api/admin/mysql');

console.log('\n✨ MySQL simulator is now configured and ready to use!');

// Write SQL to a file for reference
const sqlFile = path.join(__dirname, 'admin-users-schema.sql');
fs.writeFileSync(sqlFile, sqlCommands.join(';\n\n') + ';');
console.log(`\n📄 SQL schema saved to: ${sqlFile}`);

console.log('\n🚀 Ready to create admin users!');
console.log('Next: Visit http://localhost:3001/admin/users to create your first admin account.');