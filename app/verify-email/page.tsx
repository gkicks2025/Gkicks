"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Mail, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type VerificationStatus = 'loading' | 'success' | 'error' | 'already-verified' | 'expired'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<VerificationStatus>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')
    const statusParam = searchParams.get('status')

    // Handle URL parameters from GET request redirect
    if (error) {
      switch (error) {
        case 'missing-token':
          setStatus('error')
          setMessage('Verification token is missing. Please check your email for the correct link.')
          break
        case 'invalid-token':
          setStatus('expired')
          setMessage('This verification link is invalid or has expired. Please request a new verification email.')
          break
        case 'server-error':
          setStatus('error')
          setMessage('A server error occurred. Please try again later.')
          break
        default:
          setStatus('error')
          setMessage('An unknown error occurred.')
      }
      return
    }

    if (statusParam) {
      switch (statusParam) {
        case 'success':
          setStatus('success')
          setMessage('Your email has been verified successfully! Welcome to GKICKS Shop!')
          // Store a flag to indicate successful verification
          localStorage.setItem('email_verified', 'true')
          
          // Check if auth token is provided in URL
          const authToken = searchParams.get('token')
          if (authToken) {
            localStorage.setItem('auth_token', authToken)
          }
          
          // Redirect to profile page immediately
          setTimeout(() => {
            router.push('/profile')
          }, 1500)
          break
        case 'already-verified':
          setStatus('already-verified')
          setMessage('Your email is already verified. You can sign in to your account.')
          break
      }
      return
    }

    // If we have a token, verify it via POST API
    if (token) {
      verifyEmailToken(token)
    } else {
      setStatus('error')
      setMessage('No verification token provided.')
    }
  }, [searchParams, router])

  const verifyEmailToken = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message || 'Email verified successfully!')
        
        // Store auth token if provided
        if (data.token) {
          localStorage.setItem('auth_token', data.token)
        }
        
        toast({
          title: "Email Verified!",
          description: "Welcome to GKICKS Shop! You can now access all features.",
        })
        
        // Redirect to profile page immediately
        setTimeout(() => {
          router.push('/profile')
        }, 1500)
      } else {
        if (data.error?.includes('already verified')) {
          setStatus('already-verified')
          setMessage('Your email is already verified. You can sign in to your account.')
        } else if (data.error?.includes('expired') || data.error?.includes('invalid')) {
          setStatus('expired')
          setMessage('This verification link has expired or is invalid. Please request a new verification email.')
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed. Please try again.')
        }
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('error')
      setMessage('A network error occurred. Please check your connection and try again.')
    }
  }

  const handleResendVerification = () => {
    router.push('/auth?action=resend-verification')
  }

  const handleGoToLogin = () => {
    router.push('/auth')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const handleGoToProfile = () => {
    router.push('/profile')
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />
      case 'already-verified':
        return <CheckCircle className="h-16 w-16 text-blue-500" />
      case 'expired':
        return <AlertCircle className="h-16 w-16 text-yellow-500" />
      case 'error':
      default:
        return <XCircle className="h-16 w-16 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'already-verified':
        return 'text-blue-600'
      case 'expired':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      case 'loading':
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'already-verified' && 'Already Verified'}
            {status === 'expired' && 'Link Expired'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription className={`text-center ${getStatusColor()}`}>
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <Mail className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-green-700">
                  A welcome email has been sent to your inbox!
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Redirecting you to your account in a few seconds...
              </p>
              <Button onClick={handleGoToProfile} className="w-full">
                Go to My Account Now
              </Button>
              <Button onClick={handleGoHome} variant="outline" className="w-full">
                Go to Homepage
              </Button>
            </div>
          )}
          
          {status === 'already-verified' && (
            <div className="text-center space-y-4">
              <Button onClick={handleGoToLogin} className="w-full">
                Sign In to Your Account
              </Button>
              <Button onClick={handleGoHome} variant="outline" className="w-full">
                Go to Homepage
              </Button>
            </div>
          )}
          
          {(status === 'expired' || status === 'error') && (
            <div className="text-center space-y-4">
              {status === 'expired' && (
                <Button onClick={handleResendVerification} className="w-full">
                  Request New Verification Email
                </Button>
              )}
              <Button onClick={handleGoToLogin} variant="outline" className="w-full">
                Back to Sign In
              </Button>
              <Button onClick={handleGoHome} variant="ghost" className="w-full">
                Go to Homepage
              </Button>
            </div>
          )}
          
          {status === 'loading' && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Please wait while we verify your email address...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}