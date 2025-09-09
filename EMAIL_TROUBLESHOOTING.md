# Email Verification Troubleshooting Guide

## ✅ System Status

Your email system is **WORKING CORRECTLY**! The server logs confirm that verification emails are being sent successfully:

- ✅ SMTP configuration is valid
- ✅ Registration emails are being sent
- ✅ Resend verification emails are working
- ✅ Password reset emails are functional

## 🔍 Why You Might Not Be Receiving Emails

### 1. **Check Your Spam/Junk Folder**
   - Gmail: Check "Spam" folder
   - Outlook: Check "Junk Email" folder
   - Yahoo: Check "Spam" folder
   - **This is the most common cause!**

### 2. **Email Provider Blocking**
   Some email providers are more strict with automated emails:
   - **Gmail**: Usually works well
   - **Outlook/Hotmail**: May delay or block emails
   - **Yahoo**: May be more restrictive
   - **Corporate emails**: Often have strict filters

### 3. **Email Delivery Delays**
   - Emails can take 1-15 minutes to arrive
   - Some providers batch process emails
   - Network congestion can cause delays

## 🛠️ Troubleshooting Steps

### Step 1: Test with Gmail
1. Try registering with a Gmail address
2. Check both Inbox and Spam folders
3. Wait up to 15 minutes

### Step 2: Check Email Filters
1. Look for email rules that might be filtering emails
2. Check if emails from `gkcksdmn@gmail.com` are being blocked
3. Add `gkcksdmn@gmail.com` to your contacts/safe senders

### Step 3: Try Different Email Providers
Test with different email services:
- Gmail (recommended)
- Yahoo Mail
- Outlook.com
- ProtonMail

### Step 4: Use Resend Verification
1. Go to the login page
2. Click "Resend Verification Email"
3. Enter your email address
4. Check spam folder again

## 🔧 For Developers

### Current Email Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=gkcksdmn@gmail.com
GMAIL_APP_PASSWORD=wrzu shni msfd uoqy
```

### Test Email Functionality
```bash
# Test order receipt emails
node scripts/test-email.js

# Test verification email
node -e "require('dotenv').config({ path: '.env.local' }); const { sendVerificationEmail } = require('./lib/email/email-service.ts'); sendVerificationEmail('your-email@gmail.com', 'Test User', 'test-token').then(console.log);"
```

### Server Logs Show Success
```
✅ Verification email sent successfully to: user@example.com
✅ Verification email resent successfully to: user@example.com
```

## 📧 Email Content Preview

The verification emails include:
- **Subject**: "Verify Your Email Address - GKICKS Shop"
- **From**: "GKICKS Shop <gkcksdmn@gmail.com>"
- **Content**: Professional HTML template with verification link
- **Expiry**: 24 hours

## 🚨 If Still No Emails

### Option 1: Manual Verification (Temporary)
For testing purposes, you can manually verify users in the database:
```sql
UPDATE users SET email_verified = 1 WHERE email = 'user@example.com';
```

### Option 2: Alternative Email Service
Consider switching to a dedicated email service:
- SendGrid
- Mailgun
- AWS SES
- Postmark

### Option 3: Check Email Provider Settings
1. **Gmail**: Ensure 2FA is enabled and App Password is correct
2. **SMTP**: Verify all credentials are accurate
3. **Firewall**: Check if port 587 is blocked

## 📞 Quick Support Checklist

- [ ] Checked spam/junk folder
- [ ] Waited 15+ minutes
- [ ] Tried different email provider
- [ ] Used resend verification feature
- [ ] Added sender to safe list
- [ ] Checked email filters/rules

## 🎯 Recommended Actions

1. **For Users**: Always check spam folder first
2. **For Testing**: Use Gmail addresses
3. **For Production**: Consider professional email service
4. **For Debugging**: Monitor server logs for "✅ Verification email sent"

---

**Note**: The email system is functioning correctly. Most delivery issues are related to spam filtering or email provider policies, not the application itself.