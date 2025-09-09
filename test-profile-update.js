const mysql = require('./lib/database/mysql.ts');

async function testProfileUpdate() {
  try {
    console.log('🧪 Testing profile update functionality...');
    
    // First, check current profile data
    const currentProfile = await mysql.executeQuery('SELECT * FROM profiles WHERE id = 1');
    console.log('📋 Current profile data:', JSON.stringify(currentProfile[0], null, 2));
    
    // Test update with sample data
    const testData = {
      first_name: 'Test First Name',
      last_name: 'Test Last Name',
      phone: '+1234567890',
      bio: 'This is a test bio update',
      preferences: JSON.stringify({
        newsletter: false,
        sms_notifications: true,
        email_notifications: true,
        preferred_language: 'en',
        currency: 'PHP'
      })
    };
    
    console.log('📝 Attempting to update profile with test data:', testData);
    
    const updateQuery = `
      UPDATE profiles 
      SET first_name = ?, last_name = ?, phone = ?, bio = ?, preferences = ?, updated_at = NOW()
      WHERE id = ?`;
    
    const updateParams = [
      testData.first_name,
      testData.last_name,
      testData.phone,
      testData.bio,
      testData.preferences,
      1
    ];
    
    const updateResult = await mysql.executeQuery(updateQuery, updateParams);
    console.log('✅ Update result:', updateResult);
    
    // Verify the update
    const updatedProfile = await mysql.executeQuery('SELECT * FROM profiles WHERE id = 1');
    console.log('📋 Updated profile data:', JSON.stringify(updatedProfile[0], null, 2));
    
    // Restore original data
    console.log('🔄 Restoring original profile data...');
    const restoreQuery = `
      UPDATE profiles 
      SET first_name = ?, last_name = ?, phone = ?, bio = ?, preferences = ?, updated_at = NOW()
      WHERE id = ?`;
    
    const restoreParams = [
      currentProfile[0].first_name,
      currentProfile[0].last_name,
      currentProfile[0].phone,
      currentProfile[0].bio,
      currentProfile[0].preferences,
      1
    ];
    
    await mysql.executeQuery(restoreQuery, restoreParams);
    console.log('✅ Profile data restored');
    
  } catch (error) {
    console.error('❌ Error testing profile update:', error);
  } finally {
    process.exit(0);
  }
}

testProfileUpdate();