const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkAllUsersVerification() {
  let connection;
  
  try {
    // Database configuration
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gkicks'
    };

    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Get all users and their verification status
    const [users] = await connection.execute(
      'SELECT id, email, email_verified, email_verified_at, created_at FROM users ORDER BY id'
    );
    
    console.log('\n👥 All Users Verification Status:');
    console.log('=' .repeat(80));
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Email Verified: ${user.email_verified ? '✅ YES' : '❌ NO'}`);
        console.log(`   Verified At: ${user.email_verified_at || 'Not verified'}`);
        console.log(`   Created: ${user.created_at}`);
      });
      
      // Summary
      const verifiedCount = users.filter(u => u.email_verified).length;
      const unverifiedCount = users.length - verifiedCount;
      
      console.log('\n📊 Summary:');
      console.log(`   Total Users: ${users.length}`);
      console.log(`   Verified: ${verifiedCount}`);
      console.log(`   Unverified: ${unverifiedCount}`);
      
      if (unverifiedCount > 0) {
        console.log('\n🔧 Unverified Users:');
        users.filter(u => !u.email_verified).forEach(user => {
          console.log(`   - ${user.email} (ID: ${user.id})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connection closed.');
    }
  }
}

checkAllUsersVerification();