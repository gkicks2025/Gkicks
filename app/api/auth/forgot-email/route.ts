import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql'
import { sendEmailRecoveryNotification } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
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

    // Check if user exists with this email
    const userArray = await executeQuery(
      'SELECT id, email, first_name, phone FROM users WHERE email = ?',
      [email]
    ) as any[]

    // Always return success to prevent email enumeration attacks
    if (userArray.length === 0) {
      return NextResponse.json(
        { message: 'If an account with that email exists, recovery information has been sent.' },
        { status: 200 }
      )
    }

    const user = userArray[0]

    // For now, we'll send the email address via email (since SMS requires additional setup)
    // In a real implementation, you would integrate with an SMS service like Twilio
    try {
      const emailSent = await sendEmailRecoveryNotification(user.email, user.first_name || 'User', user.email)
      
      if (!emailSent) {
        console.error('Failed to send email recovery notification')
        // Continue anyway - don't fail the request if email fails
      } else {
        console.log(`Email recovery notification sent to: ${user.email}`)
      }
    } catch (emailError) {
      console.error('Failed to send email recovery notification:', emailError)
      // Continue without failing the request
    }

    return NextResponse.json(
      { message: 'If an account with that email exists, recovery information has been sent to your email address.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Forgot email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}