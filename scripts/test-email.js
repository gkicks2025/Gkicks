// Test script for email functionality
// Run with: node scripts/test-email.js

require('dotenv').config({ path: '.env.local' });

const { sendOrderReceipt, testEmailConfiguration } = require('../lib/email-service.ts');

// Sample order data for testing
const sampleOrderData = {
  orderNumber: 'GK' + Date.now(),
  customerEmail: 'gkcksdam@gmail.com', // Your actual email for testing
  customerName: 'John Doe',
  items: [
    {
      name: 'Nike Air Max 270',
      quantity: 1,
      price: 2500.00,
      size: '42',
      color: 'Black'
    },
    {
      name: 'Adidas Ultraboost 22',
      quantity: 2,
      price: 3200.00,
      size: '41',
      color: 'White'
    }
  ],
  subtotal: 8900.00,
  tax: 0.00,
  shipping: 150.00,
  total: 9050.00,
  shippingAddress: {
    fullName: 'John Doe',
    address: '123 Main Street, Barangay Sample',
    city: 'Manila',
    state: 'Metro Manila',
    postalCode: '1000',
    country: 'Philippines'
  },
  orderDate: new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
};

async function testEmail() {
  console.log('🧪 Testing email configuration...');
  
  // Test email configuration
  const configValid = await testEmailConfiguration();
  if (!configValid) {
    console.error('❌ Email configuration is invalid. Please check your SMTP settings in .env.local');
    console.log('\n📝 Required environment variables:');
    console.log('   - SMTP_HOST (e.g., smtp.gmail.com)');
    console.log('   - SMTP_PORT (e.g., 587)');
    console.log('   - SMTP_USER (your email address)');
    console.log('   - SMTP_PASS (your app password for Gmail)');
    console.log('\n💡 For Gmail users:');
    console.log('   1. Enable 2-Factor Authentication');
    console.log('   2. Generate App Password at: https://myaccount.google.com/apppasswords');
    console.log('   3. Use the App Password as SMTP_PASS');
    return;
  }
  
  console.log('✅ Email configuration is valid!');
  console.log('\n📧 Sending test order receipt...');
  
  // Send test email
  const emailSent = await sendOrderReceipt(sampleOrderData);
  
  if (emailSent) {
    console.log('✅ Test email sent successfully!');
    console.log(`📬 Check your inbox at: ${sampleOrderData.customerEmail}`);
  } else {
    console.error('❌ Failed to send test email');
  }
}

// Run the test
testEmail().catch(console.error);