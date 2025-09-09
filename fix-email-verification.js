const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function fixEmailVerification() {
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
    
    // Update email verification status for gkcksdmn@gmail.com
    const [result] = await connection.execute(
      'UPDATE users SET email_verified = TRUE, email_verified_at = NOW() WHERE email = ?',
      ['gkcksdmn@gmail.com']
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Email verification status updated successfully!');
      console.log(`   Affected rows: ${result.affectedRows}`);
      
      // Verify the update
      const [users] = await connection.execute(
        'SELECT email, email_verified, email_verified_at FROM users WHERE email = ?',
        ['gkcksdmn@gmail.com']
      );
      
      if (users.length > 0) {
        const user = users[0];
        console.log('\n📧 Updated User Status:');
        console.log(`   Email: ${user.email}`);
        console.log(`   Email Verified: ${user.email_verified ? 'YES' : 'NO'}`);
        console.log(`   Verified At: ${user.email_verified_at}`);
      }
    } else {
      console.log('❌ No rows were updated. User might not exist.');
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

fixEmailVerification();