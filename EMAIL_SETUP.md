# Email Receipt Setup Guide

This guide explains how to set up email receipt functionality for order confirmations in the GKICKS e-commerce system.

## 📧 Features

- **Automatic Email Receipts**: Customers receive beautifully formatted email receipts after placing orders
- **Professional HTML Templates**: Modern, responsive email design with order details
- **Order Information**: Complete order summary including items, pricing, and shipping address
- **Error Handling**: Email failures don't affect order creation
- **Gmail Integration**: Easy setup with Gmail SMTP

## 🚀 Quick Setup

### 1. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=GKICKS <your-email@gmail.com>
```

### 2. Gmail Setup (Recommended)

#### For Gmail Users:
1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Copy the generated 16-character password
3. **Update Environment Variables**:
   - `SMTP_USER`: Your Gmail address
   - `SMTP_PASS`: The 16-character App Password (not your regular password)
   - `SMTP_FROM`: Display name and email (e.g., "GKICKS <your-email@gmail.com>")

### 3. Alternative SMTP Providers

#### Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### Yahoo Mail:
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### Custom SMTP:
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false  # or true for port 465
```

## 🧪 Testing

### Test Email Configuration

1. **Update test email** in `scripts/test-email.js`:
   ```javascript
   customerEmail: 'your-test-email@gmail.com'
   ```

2. **Run the test**:
   ```bash
   node scripts/test-email.js
   ```

3. **Check results**:
   - ✅ Configuration valid → SMTP settings are correct
   - ❌ Configuration invalid → Check your SMTP credentials
   - 📧 Email sent → Check your inbox for the test receipt

### Test with Real Orders

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Place a test order**:
   - Go to the cart page
   - Fill in customer email (use your email for testing)
   - Complete the checkout process

3. **Check your email** for the order receipt

## 📋 Email Template Features

- **Professional Design**: Modern, responsive HTML template
- **Order Details**: Complete order information including:
  - Order number and date
  - Customer information
  - Itemized product list with quantities and prices
  - Order summary with subtotal, tax, shipping, and total
  - Shipping address
- **Branding**: GKICKS branding and styling
- **Mobile Responsive**: Looks great on all devices

## 🔧 Customization

### Modify Email Template

Edit the HTML template in `lib/email-service.ts`:

```typescript
function generateOrderReceiptHTML(orderData: OrderEmailData): string {
  // Customize the HTML template here
}
```

### Add Additional Email Types

1. **Create new email functions** in `lib/email-service.ts`
2. **Import and use** in your API routes
3. **Add environment variables** for different email types

## 🚨 Troubleshooting

### Common Issues

#### "Authentication failed"
- ✅ **Solution**: Use App Password instead of regular password for Gmail
- ✅ **Check**: 2FA is enabled on your Google account

#### "Connection timeout"
- ✅ **Check**: SMTP_HOST and SMTP_PORT are correct
- ✅ **Try**: Different SMTP provider
- ✅ **Verify**: Firewall/antivirus isn't blocking SMTP

#### "Invalid login"
- ✅ **Verify**: SMTP_USER is your complete email address
- ✅ **Check**: SMTP_PASS is the App Password (16 characters)

#### Emails not received
- ✅ **Check**: Spam/junk folder
- ✅ **Verify**: Customer email address is correct
- ✅ **Test**: Send to different email provider

### Debug Mode

Enable detailed logging by checking the server console:
- ✅ Order creation logs
- 📧 Email sending status
- ❌ Error messages with details

## 🔒 Security Best Practices

1. **Never commit credentials** to version control
2. **Use App Passwords** instead of regular passwords
3. **Rotate credentials** regularly
4. **Use environment variables** for all sensitive data
5. **Enable 2FA** on email accounts

## 📞 Support

If you encounter issues:

1. **Check the logs** in your terminal/console
2. **Run the test script** to isolate the problem
3. **Verify environment variables** are set correctly
4. **Test with different email providers** if needed

---

**Happy emailing! 📧✨**