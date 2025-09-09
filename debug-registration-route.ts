import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { executeQuery } from '@/lib/database/mysql'
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email/email-service'

export async function POST(request: NextRequest) {
  console.log('🔍 Registration request received')
  
  try {
    console.log('📝 Parsing request body...')
    const { email, password, firstName, lastName } = await request.json()
    console.log('✅ Request body parsed:', { email, firstName, lastName, passwordLength: password?.length })

    if (!email || !password || !firstName || !lastName) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    console.log('📧 Validating email format...')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format')
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    console.log('✅ Email format valid')

    // Validate password strength
    console.log('🔐 Validating password strength...')
    if (password.length < 6) {
      console.log('❌ Password too short')
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }
    console.log('✅ Password strength valid')

    // Check if user already exists
    console.log('🔍 Checking if user exists...')
    const existingUserArray = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[]
    console.log('✅ User existence check completed:', existingUserArray.length)
    
    if (existingUserArray.length > 0) {
      console.log('❌ User already exists')
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    console.log('🔐 Hashing password...')
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    console.log('✅ Password hashed successfully')

    // Create user with email_verified set to false
    console.log('👤 Creating user...')
    const insertResult = await executeQuery(
      'INSERT INTO users (email, password_hash, first_name, last_name, is_admin, email_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [email, hashedPassword, firstName, lastName, false, false]
    ) as any
    const userId = insertResult.insertId
    console.log('✅ User created with ID:', userId)

    // Generate verification token
    console.log('🎫 Generating verification token...')
    const verificationToken = generateVerificationToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    console.log('✅ Verification token generated')

    // Store verification token in database
    console.log('💾 Storing verification token...')
    await executeQuery(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, verificationToken, expiresAt]
    )
    console.log('✅ Verification token stored')

    // Send verification email
    console.log('📧 Sending verification email...')
    const emailSent = await sendVerificationEmail(email, firstName, verificationToken)
    if (!emailSent) {
      console.warn('⚠️ Failed to send verification email, but user was created')
    } else {
      console.log('✅ Verification email sent successfully')
    }

    console.log('🎉 Registration completed successfully!')
    
    // Return success response without JWT token (user needs to verify email first)
    const response = NextResponse.json({
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        role: 'user',
        email_verified: false
      },
      requiresVerification: true,
      emailSent
    })

    console.log('📤 Sending response')
    return response

  } catch (error) {
    console.error('❌ Registration error:', error)
    console.error('❌ Error stack:', (error as Error).stack)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}