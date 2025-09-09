const { sendVerificationEmail } = require('./lib/email/email-service.ts');

async function testRegistrationEmail() {
  try {
    console.log('🧪 Testing registration email functionality...');
    
    const result = await sendVerificationEmail(
      'test@gmail.com',
      'Test User',
      'test-token-123'
    );
    
    console.log('✅ Email sent result:', result);
    
    if (result) {
      console.log('🎉 Registration email system is working!');
    } else {
      console.log('❌ Registration email failed to send');
    }
    
  } catch (error) {
    console.error('❌ Email error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testRegistrationEmail();