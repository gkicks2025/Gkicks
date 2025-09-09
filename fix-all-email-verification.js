const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function fixAllEmailVerification() {
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
    
    // Get all unverified users
    const [unverifiedUsers] = await connection.execute(
      'SELECT id, email FROM users WHERE email_verified = FALSE OR email_verified IS NULL'
    );
    
    if (unverifiedUsers.length === 0) {
      console.log('✅ All users are already verified!');
      return;
    }
    
    console.log(`\n🔧 Found ${unverifiedUsers.length} unverified users:`);
    unverifiedUsers.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id})`);
    });
    
    console.log('\n🚀 Fixing email verification status...');
    
    // Update all unverified users
    const [result] = await connection.execute(
      'UPDATE users SET email_verified = TRUE, email_verified_at = NOW() WHERE email_verified = FALSE OR email_verified IS NULL'
    );
    
    console.log(`\n✅ Email verification status updated successfully!`);
    console.log(`   Affected rows: ${result.affectedRows}`);
    
    // Verify the updates
    console.log('\n📋 Verification Results:');
    for (const user of unverifiedUsers) {
      const [updatedUser] = await connection.execute(
        'SELECT email, email_verified, email_verified_at FROM users WHERE id = ?',
        [user.id]
      );
      
      if (updatedUser.length > 0) {
        const userData = updatedUser[0];
        console.log(`\n   📧 ${userData.email}:`);
        console.log(`      Email Verified: ${userData.email_verified ? '✅ YES' : '❌ NO'}`);
        console.log(`      Verified At: ${userData.email_verified_at}`);
      }
    }
    
    // Final summary
    const [finalCount] = await connection.execute(
      'SELECT COUNT(*) as verified_count FROM users WHERE email_verified = TRUE'
    );
    
    const [totalCount] = await connection.execute(
      'SELECT COUNT(*) as total_count FROM users'
    );
    
    console.log('\n🎉 Final Summary:');
    console.log(`   Total Users: ${totalCount[0].total_count}`);
    console.log(`   Verified Users: ${finalCount[0].verified_count}`);
    console.log(`   Unverified Users: ${totalCount[0].total_count - finalCount[0].verified_count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connection closed.');
    }
  }
}

fixAllEmailVerification();