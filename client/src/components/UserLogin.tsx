
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { User } from '../../../server/src/schema';

interface UserLoginProps {
  users: User[];
  onLogin: (user: User) => void;
  isLoading?: boolean;
}

export function UserLogin({ users, onLogin, isLoading = false }: UserLoginProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const handleLogin = () => {
    const user = users.find((u: User) => u.id.toString() === selectedUserId);
    if (user) {
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🏗️</div>
          <CardTitle className="text-2xl">Sistem Inspeksi Forklift</CardTitle>
          <CardDescription>
            Silakan pilih pengguna untuk masuk ke sistem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading || users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                {isLoading ? 'Menghubungi server...' : 'Memuat data pengguna...'}
              </p>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
              {isLoading && (
                <p className="text-xs text-gray-400 mt-4">
                  Jika server tidak merespons dalam 5 detik, aplikasi akan beralih ke mode demo
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pilih Pengguna:</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pengguna..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: User) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span>{user.full_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {user.role === 'operator' && '👷 Operator'}
                            {user.role === 'mechanic' && '🔧 Mekanik'}
                            {user.role === 'supervisor' && '👔 Supervisor'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleLogin} 
                disabled={!selectedUserId}
                className="w-full"
              >
                Masuk
              </Button>
              <div className="text-center">
                <Badge variant="secondary" className="text-xs">
                  💡 Gunakan akun demo untuk mencoba aplikasi
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
