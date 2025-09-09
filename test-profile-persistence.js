const mysql = require('./lib/database/mysql.ts');

async function testProfilePersistence() {
  try {
    console.log('🧪 Testing profile persistence...');
    
    // Step 1: Check current profile
    console.log('\n📋 Step 1: Current profile data');
    const currentProfile = await mysql.executeQuery('SELECT * FROM profiles WHERE id = 1');
    console.log('Current profile:', JSON.stringify(currentProfile[0], null, 2));
    
    // Step 2: Update profile with test data
    console.log('\n📝 Step 2: Updating profile with test data');
    const testData = {
      first_name: 'Updated First',
      last_name: 'Updated Last',
      phone: '+9876543210',
      bio: 'Updated bio for persistence test',
      preferences: JSON.stringify({
        newsletter: false,
        sms_notifications: true,
        email_notifications: false,
        preferred_language: 'es',
        currency: 'EUR'
      })
    };
    
    const updateQuery = `
      UPDATE profiles 
      SET first_name = ?, last_name = ?, phone = ?, bio = ?, preferences = ?, updated_at = NOW()
      WHERE id = ?`;
    
    const updateResult = await mysql.executeQuery(updateQuery, [
      testData.first_name,
      testData.last_name,
      testData.phone,
      testData.bio,
      testData.preferences,
      1
    ]);
    
    console.log('Update result:', updateResult);
    
    // Step 3: Verify the update immediately
    console.log('\n✅ Step 3: Verifying update immediately');
    const updatedProfile = await mysql.executeQuery('SELECT * FROM profiles WHERE id = 1');
    console.log('Updated profile:', JSON.stringify(updatedProfile[0], null, 2));
    
    // Step 4: Wait a moment and check again (simulate page refresh)
    console.log('\n⏳ Step 4: Waiting 2 seconds and checking again...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const persistedProfile = await mysql.executeQuery('SELECT * FROM profiles WHERE id = 1');
    console.log('Persisted profile:', JSON.stringify(persistedProfile[0], null, 2));
    
    // Step 5: Compare data
    console.log('\n🔍 Step 5: Comparing data');
    const original = currentProfile[0];
    const persisted = persistedProfile[0];
    
    console.log('Data persistence check:');
    console.log('- First name changed:', original.first_name, '->', persisted.first_name);
    console.log('- Last name changed:', original.last_name, '->', persisted.last_name);
    console.log('- Phone changed:', original.phone, '->', persisted.phone);
    console.log('- Bio changed:', original.bio, '->', persisted.bio);
    console.log('- Preferences changed:', original.preferences !== persisted.preferences);
    console.log('- Updated timestamp changed:', original.updated_at.getTime() !== persisted.updated_at.getTime());
    
    // Step 6: Restore original data
    console.log('\n🔄 Step 6: Restoring original data');
    await mysql.executeQuery(updateQuery, [
      original.first_name,
      original.last_name,
      original.phone,
      original.bio,
      original.preferences,
      1
    ]);
    
    console.log('✅ Profile persistence test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing profile persistence:', error);
  } finally {
    process.exit(0);
  }
}

testProfilePersistence();