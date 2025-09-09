const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'gkcksdmn@gmail.com',
    pass: 'wrzu shni msfd uoqy'
  }
});

console.log('Testing SMTP connection...');
transporter.verify()
  .then(() => {
    console.log('✅ SMTP connection successful');
    
    // Test sending an actual email
    return transporter.sendMail({
      from: 'GKICKS <gkcksdmn@gmail.com>',
      to: 'creeck2@gmail.com',
      subject: 'Production SMTP Test',
      html: '<h1>Test Email</h1><p>This is a test email from production server.</p>'
    });
  })
  .then((info) => {
    console.log('✅ Test email sent successfully');
    console.log('Message ID:', info.messageId);
  })
  .catch((error) => {
    console.error('❌ SMTP Error:', error.message);
    console.error('Full error:', error);
  });