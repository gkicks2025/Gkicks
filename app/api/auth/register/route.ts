import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { executeQuery } from '@/lib/database/mysql'
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email/email-service'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUserArray = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[]
    if (existingUserArray.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user with email_verified set to false
    const insertResult = await executeQuery(
      'INSERT INTO users (email, password_hash, first_name, last_name, is_admin, email_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [email, hashedPassword, firstName, lastName, false, false]
    ) as any
    const userId = insertResult.insertId

    // Generate verification token
    const verificationToken = generateVerificationToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

    // Store verification token in database
    await executeQuery(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, verificationToken, expiresAt]
    )

    // Send verification email
    const emailSent = await sendVerificationEmail(email, firstName, verificationToken)
    if (!emailSent) {
      console.warn('⚠️ Failed to send verification email, but user was created')
    }

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

    return response

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}