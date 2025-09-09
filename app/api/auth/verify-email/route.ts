import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { executeQuery } from '@/lib/database/mysql'
import { sendWelcomeEmail } from '@/lib/email/email-service'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find the verification token in database
    const tokenResults = await executeQuery(
      `SELECT evt.*, u.email, u.first_name, u.last_name, u.id as user_id
       FROM email_verification_tokens evt
       JOIN users u ON evt.user_id = u.id
       WHERE evt.token = ? AND evt.used_at IS NULL AND evt.expires_at > NOW()`,
      [token]
    ) as any[]

    if (tokenResults.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    const tokenData = tokenResults[0]
    const userId = tokenData.user_id
    const email = tokenData.email
    const firstName = tokenData.first_name
    const lastName = tokenData.last_name

    // Check if user is already verified
    const userResults = await executeQuery(
      'SELECT email_verified FROM users WHERE id = ?',
      [userId]
    ) as any[]

    if (userResults.length > 0 && userResults[0].email_verified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Mark user as verified
    await executeQuery(
      'UPDATE users SET email_verified = TRUE, email_verified_at = NOW() WHERE id = ?',
      [userId]
    )

    // Mark token as used
    await executeQuery(
      'UPDATE email_verification_tokens SET used_at = NOW() WHERE token = ?',
      [token]
    )

    // Send welcome email
    const welcomeEmailSent = await sendWelcomeEmail(email, firstName)
    if (!welcomeEmailSent) {
      console.warn('⚠️ Failed to send welcome email, but verification was successful')
    }

    // Generate JWT token for the verified user
    const authToken = jwt.sign(
      { 
        userId, 
        email,
        role: 'user',
        verified: true
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    const response = NextResponse.json({
      message: 'Email verified successfully! Welcome to GKICKS Shop!',
      user: {
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        role: 'user',
        email_verified: true
      },
      token: authToken,
      welcomeEmailSent
    })

    // Set HTTP-only cookie
    response.cookies.set('auth-token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET method for email verification via URL (when user clicks link in email)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/verify-email?error=missing-token', request.url))
    }

    // Find the verification token in database
    const tokenResults = await executeQuery(
      `SELECT evt.*, u.email, u.first_name, u.last_name, u.id as user_id
       FROM email_verification_tokens evt
       JOIN users u ON evt.user_id = u.id
       WHERE evt.token = ? AND evt.used_at IS NULL AND evt.expires_at > NOW()`,
      [token]
    ) as any[]

    if (tokenResults.length === 0) {
      return NextResponse.redirect(new URL('/verify-email?error=invalid-token', request.url))
    }

    const tokenData = tokenResults[0]
    const userId = tokenData.user_id
    const email = tokenData.email
    const firstName = tokenData.first_name

    // Check if user is already verified
    const userResults = await executeQuery(
      'SELECT email_verified FROM users WHERE id = ?',
      [userId]
    ) as any[]

    if (userResults.length > 0 && userResults[0].email_verified) {
      return NextResponse.redirect(new URL('/verify-email?status=already-verified', request.url))
    }

    // Mark user as verified
    await executeQuery(
      'UPDATE users SET email_verified = TRUE, email_verified_at = NOW() WHERE id = ?',
      [userId]
    )

    // Mark token as used
    await executeQuery(
      'UPDATE email_verification_tokens SET used_at = NOW() WHERE token = ?',
      [token]
    )

    // Send welcome email
    const welcomeEmailSent = await sendWelcomeEmail(email, firstName)
    if (!welcomeEmailSent) {
      console.warn('⚠️ Failed to send welcome email, but verification was successful')
    }

    // Generate JWT token for the verified user
    const authToken = jwt.sign(
      { 
        userId, 
        email,
        role: 'user',
        verified: true
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Redirect to success page with auth token
    return NextResponse.redirect(new URL(`/verify-email?status=success&token=${authToken}`, request.url))

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(new URL('/verify-email?error=server-error', request.url))
  }
}