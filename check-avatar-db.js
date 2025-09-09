const { executeQuery } = require('./lib/database/index');

async function checkAvatarData() {
  try {
    console.log('🔍 Checking avatar data in database...');
    
    // Check users table
    const users = await executeQuery('SELECT id, first_name, last_name, avatar_url FROM users WHERE id = 1');
    console.log('👤 Users table:', users);
    
    // Check profiles table
    const profiles = await executeQuery('SELECT id, user_id, first_name, last_name, avatar_url FROM profiles WHERE user_id = 1');
    console.log('📋 Profiles table:', profiles);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkAvatarData();