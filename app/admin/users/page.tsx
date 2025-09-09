'use client';

export const dynamic = 'force-dynamic'


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Users, Eye, EyeOff, Trash2, Edit } from 'lucide-react';

interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateUserForm {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export default function AdminUsersPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: ''
  });

  // Fetch admin users
  const fetchAdminUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/mysql');
      const data = await response.json();
      
      if (response.ok) {
        setAdminUsers(data.adminUsers || []);
      } else {
        setError(data.error || 'Failed to fetch admin users');
      }
    } catch (err) {
      setError('Network error while fetching admin users');
    } finally {
      setLoading(false);
    }
  };

  // Create new admin user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!createForm.email || !createForm.password || !createForm.first_name || !createForm.last_name) {
      setError('Please fill in all required fields');
      return;
    }

    if (createForm.password !== createForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (createForm.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/mysql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: createForm.email,
          password: createForm.password,
          first_name: createForm.first_name,
          last_name: createForm.last_name,
          phone: createForm.phone || null
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(`Admin user created successfully: ${data.email}`);
        setCreateForm({
          email: '',
          password: '',
          confirmPassword: '',
          first_name: '',
          last_name: '',
          phone: ''
        });
        fetchAdminUsers(); // Refresh the list
      } else {
        setError(data.error || 'Failed to create admin user');
      }
    } catch (err) {
      setError('Network error while creating admin user');
    } finally {
      setLoading(false);
    }
  };

  // Deactivate admin user
  const handleDeactivateUser = async (userId: number) => {
    if (!confirm('Are you sure you want to deactivate this admin user?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/mysql?id=${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Admin user deactivated successfully');
        fetchAdminUsers(); // Refresh the list
      } else {
        setError(data.error || 'Failed to deactivate admin user');
      }
    } catch (err) {
      setError('Network error while deactivating admin user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin User Management</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage admin accounts for the MySQL database
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Users className="w-4 h-4 mr-2" />
          {adminUsers.length} Admin Users
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Create Admin User
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Manage Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Admin User</CardTitle>
              <CardDescription>
                Create a new administrator account for the MySQL database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      type="text"
                      value={createForm.first_name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      type="text"
                      value={createForm.last_name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={createForm.password}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter secure password"
                        required
                        minLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={createForm.confirmPassword}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm password"
                        required
                        minLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create Admin User'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Existing Admin Users</CardTitle>
              <CardDescription>
                Manage existing administrator accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && adminUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p>Loading admin users...</p>
                </div>
              ) : adminUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No admin users found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create your first admin user using the "Create Admin User" tab
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {adminUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-medium">
                              {user.first_name} {user.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {user.phone && (
                              <p className="text-sm text-muted-foreground">{user.phone}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={user.is_active ? "default" : "secondary"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">Admin</Badge>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Created: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {user.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivateUser(user.id)}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}