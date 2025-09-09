"use client"

export const dynamic = 'force-dynamic'


import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAdmin } from "@/contexts/admin-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, ShoppingBag, Eye, EyeOff, CreditCard } from "lucide-react"
import Image from "next/image"

export default function StaffLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { state, login } = useAdmin()
  const router = useRouter()

  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      // Check user role and redirect accordingly
      if (state.user.role === 'staff') {
        router.push("/admin/orders")
      } else if (state.user.role === 'admin') {
        router.push("/admin")
      } else {
        // For other roles or legacy users, redirect to orders
        router.push("/admin/orders")
      }
    }
  }, [state.isAuthenticated, state.user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const success = await login(email, password)
      if (!success) {
        setError("Invalid email or password")
      }
    } catch (err) {
      setError("An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  const fillCredentials = (userType: "staff" | "cashier") => {
    if (userType === "staff") {
      setEmail("gkicksstaff@gmail.com")
      setPassword("staff123456")
    } else if (userType === "cashier") {
      setEmail("gkickscashier@gmail.com")
      setPassword("cashier123")
    }
  }

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-primary">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-primary rounded-xl flex items-center justify-center p-2">
              <Image
                src="/images/gkicks-transparent-logo.png"
                alt="GKicks Staff"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-primary">GKicks Staff Portal</h2>
          <p className="mt-2 text-muted-foreground">Sign in to your staff account</p>
        </div>

        {/* Demo Credentials */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Demo Credentials</CardTitle>
            <CardDescription className="text-muted-foreground">Click to auto-fill login credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="staff" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger value="staff" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Staff
                </TabsTrigger>
                <TabsTrigger
                  value="cashier"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Cashier
                </TabsTrigger>
              </TabsList>

              <TabsContent value="staff" className="space-y-4">
                <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/30">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-secondary text-secondary-foreground font-semibold">Staff Member</Badge>
                    <User className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-foreground">
                      <strong>Email:</strong> gkicksstaff@gmail.com
                    </p>
                    <p className="text-foreground">
                      <strong>Password:</strong> staff123
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-secondary/30">
                    <p className="text-xs text-muted-foreground mb-2">
                      <strong>Limited Access:</strong>
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs border-secondary text-secondary">
                        <ShoppingBag className="h-3 w-3 mr-1" />
                        Orders Only
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Staff can only view and manage customer orders</p>
                  </div>
                  <Button
                    onClick={() => fillCredentials("staff")}
                    className="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  >
                    Use Staff Credentials
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="cashier" className="space-y-4">
                <div className="p-4 bg-accent/10 rounded-lg border border-accent/30">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-accent text-accent-foreground font-semibold">Cashier</Badge>
                    <CreditCard className="h-5 w-5 text-accent" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-foreground">
                      <strong>Email:</strong> gkickscashier@gmail.com
                    </p>
                    <p className="text-foreground">
                      <strong>Password:</strong> cashier123
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-accent/30">
                    <p className="text-xs text-muted-foreground mb-2">
                      <strong>POS Access:</strong>
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs border-accent text-accent">
                        <CreditCard className="h-3 w-3 mr-1" />
                        POS System
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Cashier can process sales and manage inventory deductions</p>
                  </div>
                  <Button
                    onClick={() => fillCredentials("cashier")}
                    className="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  >
                    Use Cashier Credentials
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Login Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-primary">Sign In</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your staff credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-primary">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-primary">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-primary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Admin Portal Link */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <p className="text-muted-foreground text-sm">Need administrator access?</p>
              <Button
                variant="outline"
                onClick={() => router.push("/admin/login")}
                className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Go to Admin Portal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Back to Store */}
        <div className="text-center">
          <Button variant="link" onClick={() => router.push("/")} className="text-primary hover:text-primary/80">
            ← Back to Store
          </Button>
        </div>
      </div>
    </div>
  )
}
