'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, User, Database } from 'lucide-react'

interface User {
  id: number
  email: string
  full_name: string
  phone?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  is_admin: boolean
  avatar_url?: string
  created_at: string
  updated_at: string
}

interface ApiResponse {
  success: boolean
  data: User[]
  source: string
  error?: string
  details?: string
}

export default function RealUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<string>('')

  const fetchRealUsers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/real-users')
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        setUsers(data.data)
        setSource(data.source)
        console.log('✅ Real users fetched:', data.data)
      } else {
        setError(data.error || 'Failed to fetch real users')
        console.error('❌ API Error:', data.error, data.details)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('❌ Fetch Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRealUsers()
  }, [])

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Real Users Database</h1>
            <p className="text-gray-600">Users from the actual MySQL database</p>
          </div>
        </div>
        <Button 
          onClick={fetchRealUsers} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {source && (
        <div className="mb-4">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Source: {source}
          </Badge>
        </div>
      )}

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-lg">Loading real users...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-gray-600">
              Found <strong>{users.length}</strong> real users in the database
            </p>
          </div>

          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <User className="h-5 w-5 text-blue-600" />
                      <span>{user.full_name || 'No Name'}</span>
                      <Badge variant={user.is_admin ? 'default' : 'secondary'}>
                        {user.is_admin ? 'Admin' : 'Customer'}
                      </Badge>
                    </CardTitle>
                    <span className="text-sm text-gray-500">ID: {user.id}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Email:</span>
                      <p className="text-gray-600">{user.email}</p>
                    </div>
                    {user.phone && (
                      <div>
                        <span className="font-semibold text-gray-700">Phone:</span>
                        <p className="text-gray-600">{user.phone}</p>
                      </div>
                    )}
                    {user.city && (
                      <div>
                        <span className="font-semibold text-gray-700">Location:</span>
                        <p className="text-gray-600">{user.city}{user.country && `, ${user.country}`}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-gray-700">Created:</span>
                      <p className="text-gray-600">{new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Updated:</span>
                      <p className="text-gray-600">{new Date(user.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {users.length === 0 && !loading && !error && (
            <Card className="text-center py-12">
              <CardContent>
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Real Users Found</h3>
                <p className="text-gray-500">
                  No users were found in the MySQL database. This could mean:
                </p>
                <ul className="text-gray-500 mt-2 text-left max-w-md mx-auto">
                  <li>• The users table is empty</li>
                  <li>• The MySQL database is not properly connected</li>
                  <li>• Users are stored in a different table or database</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}