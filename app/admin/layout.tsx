"use client"

export const dynamic = 'force-dynamic'


import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import { useAuth } from "@/contexts/auth-context"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login")
      return
    }

    if (!loading && user) {
      // Check if user has admin or staff access
      const hasAdminAccess = user.role === "admin"
      const hasStaffAccess = user.role === "staff"

      if (!hasAdminAccess && !hasStaffAccess) {
        console.log('❌ Admin Layout: User does not have admin/staff role:', user.role)
        router.push("/")
        return
      }
      
      console.log('✅ Admin Layout: User has access, role:', user.role)
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="flex-1">{children}</main>
    </div>
  )
}
