// Simple SMTP test without TypeScript
const nodemailer = require('nodemailer');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

const config = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'gkcksdmn@gmail.com',
    pass: process.env.SMTP_PASS || 'wrzu shni msfd uoqy',
  },
};

console.log('Testing SMTP connection with config:');
console.log('Host:', config.host);
console.log('Port:', config.port);
console.log('Secure:', config.secure);
console.log('User:', config.auth.user);
console.log('Pass:', config.auth.pass ? '***hidden***' : 'NOT SET');

const transporter = nodemailer.createTransport(config);

console.log('\nVerifying SMTP connection...');

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP Connection Error:', error.message);
    console.log('Full error:', error);
  } else {
    console.log('✅ SMTP Connection: SUCCESS');
    
    // Test sending an actual email
    console.log('\nSending test email...');
    const mailOptions = {
      from: process.env.SMTP_FROM || 'GKICKS <gkcksdmn@gmail.com>',
      to: 'creeek20@gmail.com',
      subject: 'Test Email from GKICKS - SMTP Debug',
      text: 'This is a test email to verify SMTP functionality. If you receive this, the email system is working.',
      html: '<h2>GKICKS Email Test</h2><p>This is a test email to verify SMTP functionality.</p><p>If you receive this, the email system is working correctly!</p>'
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('❌ Send Error:', error.message);
        console.log('Full error:', error);
      } else {
        console.log('✅ Email sent successfully!');
        console.log('Response:', info.response);
        console.log('Message ID:', info.messageId);
      }
      process.exit(error ? 1 : 0);
    });
  }
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('❌ Test timed out after 30 seconds');
  process.exit(1);
}, 30000);