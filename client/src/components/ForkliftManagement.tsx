
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
import type { Forklift, CreateForkliftInput } from '../../../server/src/schema';

interface ForkliftManagementProps {
  forklifts: Forklift[];
  onDataChange: () => void;
  isConnected: boolean;
}

export function ForkliftManagement({ forklifts, onDataChange, isConnected }: ForkliftManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateForkliftInput>({
    unit_number: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    serial_number: '',
    status: 'active'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isConnected) {
        await trpc.createForklift.mutate(formData);
      }
      
      // Reset form
      setFormData({
        unit_number: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        serial_number: '',
        status: 'active'
      });
      
      setIsDialogOpen(false);
      onDataChange();
      alert(isConnected ? '✅ Forklift berhasil ditambahkan!' : '✅ Forklift tercatat (mode demo)!');
    } catch (error) {
      console.error('Failed to create forklift:', error);
      alert('❌ Gagal menambahkan forklift. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">🟢 Aktif</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">🟡 Pemeliharaan</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">🔴 Tidak Aktif</Badge>;
      default:
        return <Badge variant="secondary">❓ Tidak Diketahui</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center space-x-2">
            <span>🏗️</span>
            <span>Manajemen Forklift</span>
          </CardTitle>
          <CardDescription>
            Kelola data forklift dalam sistem
            {!isConnected && ' (Mode demo)'}
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>➕ Tambah Forklift</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Forklift Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi forklift yang akan ditambahkan
                {!isConnected && ' (Mode demo - data tidak akan tersimpan)'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unit_number">Nomor Unit</Label>
                
                <Input
                  id="unit_number"
                  placeholder="Contoh: FL-001"
                  value={formData.unit_number}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateForkliftInput) => ({ ...prev, unit_number: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Merek</Label>
                <Input
                  id="brand"
                  placeholder="Contoh: Toyota"
                  value={formData.brand}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateForkliftInput) => ({ ...prev, brand: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="Contoh: 8FBE15"
                  value={formData.model}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateForkliftInput) => ({ ...prev, model: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Tahun</Label>
                <Input
                  id="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateForkliftInput) => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial_number">Nomor Seri</Label>
                <Input
                  id="serial_number"
                  placeholder="Contoh: ABC123456"
                  value={formData.serial_number}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateForkliftInput) => ({ ...prev, serial_number: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status || 'active'} 
                  onValueChange={(value: string) => 
                    setFormData((prev: CreateForkliftInput) => ({ ...prev, status: value as 'active' | 'maintenance' | 'inactive' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">🟢 Aktif</SelectItem>
                    <SelectItem value="maintenance">🟡 Pemeliharaan</SelectItem>
                    <SelectItem value="inactive">🔴 Tidak Aktif</SelectItem>
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
                <TableHead>Nomor Unit</TableHead>
                <TableHead>Merek & Model</TableHead>
                <TableHead>Tahun</TableHead>
                <TableHead>Nomor Seri</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terdaftar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forklifts.map((forklift: Forklift) => (
                <TableRow key={forklift.id}>
                  <TableCell className="font-medium">
                    {forklift.unit_number}
                  </TableCell>
                  <TableCell>
                    {forklift.brand} {forklift.model}
                  </TableCell>
                  <TableCell>{forklift.year}</TableCell>
                  <TableCell>{forklift.serial_number}</TableCell>
                  <TableCell>
                    {getStatusBadge(forklift.status)}
                  </TableCell>
                  <TableCell>
                    {forklift.created_at.toLocaleDateString('id-ID')}
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
