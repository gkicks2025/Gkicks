require('dotenv').config({ path: '.env.production' });

console.log('Environment Variables Check:');
console.log('GMAIL_USER:', process.env.GMAIL_USER || 'NOT SET');
console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'SET (length: ' + process.env.GMAIL_APP_PASSWORD.length + ')' : 'NOT SET');
console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET (length: ' + process.env.SMTP_PASS.length + ')' : 'NOT SET');
console.log('FROM_EMAIL:', process.env.FROM_EMAIL || 'NOT SET');
console.log('APP_URL:', process.env.APP_URL || 'NOT SET');
console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET');