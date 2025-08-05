
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput, UserRole } from '../../../server/src/schema';

interface UserManagementProps {
  users: User[];
  onDataChange: () => void;
  isConnected: boolean;
}

export function UserManagement({ users, onDataChange, isConnected }: UserManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateUserInput>({
    username: '',
    full_name: '',
    role: 'operator'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isConnected) {
        await trpc.createUser.mutate(formData);
      }
      
      // Reset form
      setFormData({
        username: '',
        full_name: '',
        role: 'operator'
      });
      
      setIsDialogOpen(false);
      onDataChange();
      alert(isConnected ? '✅ Pengguna berhasil ditambahkan!' : '✅ Pengguna tercatat (mode demo)!');
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('❌ Gagal menambahkan pengguna. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'operator':
        return <Badge className="bg-blue-100 text-blue-800">👷 Operator</Badge>;
      case 'mechanic':
        return <Badge className="bg-green-100 text-green-800">🔧 Mekanik</Badge>;
      case 'supervisor':
        return <Badge className="bg-purple-100 text-purple-800">👔 Supervisor</Badge>;
      default:
        return <Badge variant="secondary">❓ Tidak Diketahui</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center space-x-2">
            <span>👥</span>
            <span>Manajemen Pengguna</span>
          </CardTitle>
          <CardDescription>
            Kelola pengguna sistem inspeksi forklift
            {!isConnected && ' (Mode demo)'}
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>➕ Tambah Pengguna</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi pengguna yang akan ditambahkan
                {!isConnected && ' (Mode demo - data tidak akan tersimpan)'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Contoh: john_doe"
                  value={formData.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                  }
                  required
                  minLength={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap</Label>
                <Input
                  id="full_name"
                  placeholder="Contoh: John Doe"
                  value={formData.full_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>)  =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, full_name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Peran</Label>
                <Select 
                  value={formData.role || 'operator'} 
                  onValueChange={(value: string) => 
                    setFormData((prev: CreateUserInput) => ({ ...prev, role: value as UserRole }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">👷 Operator</SelectItem>
                    <SelectItem value="mechanic">🔧 Mekanik</SelectItem>
                    <SelectItem value="supervisor">👔 Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Menyimpan...' : '💾 Simpan'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Terdaftar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.username}
                  </TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell>
                    {user.created_at.toLocaleDateString('id-ID')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
