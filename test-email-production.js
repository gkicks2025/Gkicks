require('dotenv').config({ path: '.env.production' });
const nodemailer = require('nodemailer');

async function testEmailConfig() {
  try {
    console.log('🧪 Testing email configuration...');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    
    await transporter.verify();
    console.log('✅ Email configuration is valid!');
    
    // Send a test email
    const testEmail = {
      from: `"GKICKS Shop" <${process.env.GMAIL_USER}>`,
      to: 'gkcksdmn@gmail.com',
      subject: 'Test Email - GKICKS Production Server',
      html: `
        <h2>🎉 Email Test Successful!</h2>
        <p>This email confirms that the GKICKS Shop email system is working properly on the production server.</p>
        <p><strong>Server:</strong> 72.60.111.2</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Status:</strong> ✅ Email delivery is functional</p>
      `
    };
    
    await transporter.sendMail(testEmail);
    console.log('📧 Test email sent successfully to gkcksdmn@gmail.com');
    console.log('📬 Please check your inbox and spam folder');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

testEmailConfig();