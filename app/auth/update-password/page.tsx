'use client'

export const dynamic = 'force-dynamic'

import dynamicImport from 'next/dynamic'
import { Suspense } from 'react'

// Dynamic import with SSR disabled to prevent context issues
const UpdatePasswordClient = dynamicImport(
  () => import('@/components/auth/update-password-client'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }
)

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    }>
      <UpdatePasswordClient />
    </Suspense>
  )
}
