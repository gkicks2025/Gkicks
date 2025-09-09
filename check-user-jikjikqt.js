const mysql = require('mysql2/promise');

async function checkUser() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gkicks'
  });

  try {
    const [rows] = await connection.execute(
      'SELECT id, email, first_name, last_name, email_verified, created_at FROM users WHERE email = ?',
      ['jikjikqt@gmail.com']
    );
    
    if (rows.length > 0) {
      console.log('✅ User found:');
      console.log('ID:', rows[0].id);
      console.log('Email:', rows[0].email);
      console.log('Name:', rows[0].first_name, rows[0].last_name);
      console.log('Email Verified:', rows[0].email_verified ? 'Yes' : 'No');
      console.log('Created:', rows[0].created_at);
    } else {
      console.log('❌ No user found with email: jikjikqt@gmail.com');
    }
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await connection.end();
  }
}

checkUser();