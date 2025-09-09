// Simple environment variables test for production
require('dotenv').config({ path: '.env.production' });

console.log('=== Environment Variables Test ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '[SET]' : '[NOT SET]');
console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);

// Test if we can access the variables that the Next.js app should see
const envVars = {
  NODE_ENV: process.env.NODE_ENV,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS ? '[SET]' : '[NOT SET]',
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL
};

console.log('\n=== Environment Variables JSON ===');
console.log(JSON.stringify(envVars, null, 2));

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.log('\n❌ MISSING SMTP CONFIGURATION!');
  console.log('The Next.js app may not be loading .env.production correctly.');
} else {
  console.log('\n✅ SMTP configuration found!');
  console.log('Environment variables are being loaded correctly.');
}