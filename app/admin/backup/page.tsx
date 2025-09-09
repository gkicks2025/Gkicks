'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, Database, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BackupPage() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupHistory, setBackupHistory] = useState<any[]>([]);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Backup failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `gkicks-backup-${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Database backup created successfully!');
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Failed to create backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) {
      toast.error('Please select a backup file');
      return;
    }

    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append('backup', selectedFile);

      const response = await fetch('/api/admin/restore', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Restore failed');
      }

      const result = await response.json();
      toast.success('Database restored successfully!');
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('backup-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore database');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Database Backup & Restore</h1>
          <p className="text-gray-600">Secure your data with backup and restore operations</p>
        </div>
      </div>

      {/* Security Warning */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Important:</strong> Always test backups in a development environment before using in production. 
          Restore operations will overwrite existing data.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              Create Backup
            </CardTitle>
            <CardDescription>
              Generate a complete backup of your database including all products, orders, and user data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Backup Contents
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Products and variants</li>
                <li>• User accounts and profiles</li>
                <li>• Orders and transactions</li>
                <li>• Admin settings</li>
                <li>• Analytics data</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleBackup} 
              disabled={isBackingUp}
              className="w-full"
              size="lg"
            >
              {isBackingUp ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Restore Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Restore Database
            </CardTitle>
            <CardDescription>
              Upload and restore a previous backup file to replace current database content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-file">Select Backup File</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".sql,.db"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Warning:</strong> This will permanently replace all current data. Make sure you have a recent backup before proceeding.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={handleRestore} 
              disabled={isRestoring || !selectedFile}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              {isRestoring ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Database
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Backup Guidelines</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create regular automated backups</li>
                <li>• Store backups in secure, off-site locations</li>
                <li>• Test backup integrity regularly</li>
                <li>• Keep multiple backup versions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Restore Guidelines</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Always backup current data before restore</li>
                <li>• Verify backup file integrity</li>
                <li>• Test restores in development first</li>
                <li>• Notify users of maintenance windows</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}