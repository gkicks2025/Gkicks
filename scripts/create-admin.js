#!/usr/bin/env node

/**
 * CLI Script to Create Admin User in MySQL Database
 * Usage: node scripts/create-admin.js
 */

const readline = require('readline');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// MySQL connection configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'gkicks_shop',
  ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Test database connection
async function testConnection() {
  try {
    console.log('🔍 Testing MySQL connection...');
    const connection = await mysql.createConnection(dbConfig);
    await connection.ping();
    await connection.end();
    console.log('✅ MySQL connection successful!');
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    console.log('\n📝 Please check your MySQL configuration in .env.local:');
    console.log('   - MYSQL_HOST');
    console.log('   - MYSQL_PORT');
    console.log('   - MYSQL_USER');
    console.log('   - MYSQL_PASSWORD');
    console.log('   - MYSQL_DATABASE');
    return false;
  }
}

// Create admin user
async function createAdminUser(userData) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [userData.email]
    );
    
    if (existingUsers.length > 0) {
      throw new Error('User with this email already exists');
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    // Insert new admin user
    const [result] = await connection.execute(
      `INSERT INTO users (
        email, password_hash, first_name, last_name, 
        phone, is_admin, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.email,
        hashedPassword,
        userData.firstName,
        userData.lastName,
        userData.phone || null,
        true, // is_admin = true
        true  // is_active = true
      ]
    );
    
    console.log(`\n✅ Admin user created successfully!`);
    console.log(`   ID: ${result.insertId}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Name: ${userData.firstName} ${userData.lastName}`);
    
    return result.insertId;
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Main function
async function main() {
  console.log('🚀 GKicks Admin User Creation Tool\n');
  
  try {
    // Test database connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      process.exit(1);
    }
    
    console.log('\n📝 Please provide the following information:\n');
    
    // Collect user information
    const firstName = await question('First Name: ');
    if (!firstName.trim()) {
      console.error('❌ First name is required');
      process.exit(1);
    }
    
    const lastName = await question('Last Name: ');
    if (!lastName.trim()) {
      console.error('❌ Last name is required');
      process.exit(1);
    }
    
    const email = await question('Email Address: ');
    if (!email.trim() || !isValidEmail(email)) {
      console.error('❌ Valid email address is required');
      process.exit(1);
    }
    
    const phone = await question('Phone Number (optional): ');
    
    // Password input (hidden)
    console.log('\n🔐 Password Requirements:');
    console.log('   - Minimum 8 characters');
    console.log('   - Mix of letters, numbers, and symbols recommended\n');
    
    const password = await question('Password: ');
    if (!password || password.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      process.exit(1);
    }
    
    const confirmPassword = await question('Confirm Password: ');
    if (password !== confirmPassword) {
      console.error('❌ Passwords do not match');
      process.exit(1);
    }
    
    // Confirmation
    console.log('\n📋 Admin User Details:');
    console.log(`   Name: ${firstName} ${lastName}`);
    console.log(`   Email: ${email}`);
    console.log(`   Phone: ${phone || 'Not provided'}`);
    console.log(`   Role: Administrator`);
    
    const confirm = await question('\nCreate this admin user? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Admin user creation cancelled');
      process.exit(0);
    }
    
    // Create the admin user
    await createAdminUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || null,
      password
    });
    
    console.log('\n🎉 Admin user creation completed!');
    console.log('\n📱 You can now:');
    console.log('   1. Login to the admin panel at /admin/users');
    console.log('   2. Use the phpMyAdmin-like interface at /admin/mysql');
    console.log('   3. Access the API endpoints for user management');
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Admin user creation cancelled');
  rl.close();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createAdminUser, testConnection };