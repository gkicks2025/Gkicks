const mysql = require('mysql2/promise');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

async function resendVerificationEmail() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gkicks'
  });

  try {
    // Get user details
    const [users] = await connection.execute(
      'SELECT id, email, first_name, last_name FROM users WHERE email = ?',
      ['jikjikqt@gmail.com']
    );
    
    if (users.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = users[0];
    console.log('✅ User found:', user.email, 'ID:', user.id);
    
    // Check existing verification token
    const [tokens] = await connection.execute(
      'SELECT token, expires_at, used_at FROM email_verification_tokens WHERE user_id = ? AND used_at IS NULL ORDER BY created_at DESC LIMIT 1',
      [user.id]
    );
    
    let verificationToken;
    
    if (tokens.length > 0) {
      verificationToken = tokens[0].token;
      console.log('✅ Using existing verification token');
      console.log('🕒 Token expires at:', tokens[0].expires_at);
    } else {
      // Generate new verification token
      verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Insert new verification token (expires in 24 hours)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await connection.execute(
        'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, verificationToken, expiresAt]
      );
      
      console.log('✅ New verification token generated');
    }
    
    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'gkcksdmn@gmail.com',
        pass: 'wrzu shni msfd uoqy'
      }
    });
    
    // Verify SMTP connection
    console.log('🔍 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified');
    
    // Send verification email
    const verificationUrl = `https://g-kicks.shop/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: '"G-Kicks Shop" <gkcksdmn@gmail.com>',
      to: user.email,
      subject: 'Verify Your G-Kicks Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to G-Kicks, ${user.first_name}!</h2>
          <p>Thank you for registering with G-Kicks. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't create this account, please ignore this email.</p>
        </div>
      `
    };
    
    console.log('📧 Sending verification email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('🔗 Verification URL:', verificationUrl);
    console.log('📬 Check your Gmail inbox and spam folder!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
  } finally {
    await connection.end();
  }
}

resendVerificationEmail();