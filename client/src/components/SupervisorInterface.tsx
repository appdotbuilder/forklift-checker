
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { ForkliftManagement } from '@/components/ForkliftManagement';
import { UserManagement } from '@/components/UserManagement';
import type { User, Forklift } from '../../../server/src/schema';

// Define the interface locally since it's not exported from schema
interface ForkliftStatusSummary {
  forklift: Forklift;
  last_inspection_date: Date | null;
  last_inspection_status: 'pass' | 'fail' | 'needs_attention' | null;
  days_since_inspection: number | null;
  pending_defects: number;
}

interface SupervisorInterfaceProps {
  forklifts: Forklift[];
  users: User[];
  onDataChange: () => void;
  isConnected: boolean;
}

export function SupervisorInterface({ forklifts, users, onDataChange, isConnected }: SupervisorInterfaceProps) {
  const [statusSummary, setStatusSummary] = useState<ForkliftStatusSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Create demo status summary
  const createDemoStatusSummary = useCallback(() => {
    const demoSummary: ForkliftStatusSummary[] = forklifts.map((forklift: Forklift) => ({
      forklift,
      last_inspection_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      last_inspection_status: Math.random() > 0.7 ? 'needs_attention' : Math.random() > 0.3 ? 'pass' : 'fail',
      days_since_inspection: Math.floor(Math.random() * 7),
      pending_defects: Math.floor(Math.random() * 3)
    }));
    return demoSummary;
  }, [forklifts]);

  const loadStatusSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isConnected) {
        const summary = await trpc.getForkliftStatusSummary.query();
        setStatusSummary(summary.length > 0 ? summary : createDemoStatusSummary());
      } else {
        setStatusSummary(createDemoStatusSummary());
      }
    } catch (error) {
      console.error('Failed to load forklift status summary:', error);
      setStatusSummary(createDemoStatusSummary());
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, createDemoStatusSummary]);

  useEffect(() => {
    loadStatusSummary();
  }, [loadStatusSummary]);

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

  const getInspectionStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">➖ Belum Ada</Badge>;
    
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">✅ Lulus</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">❌ Gagal</Badge>;
      case 'needs_attention':
        return <Badge className="bg-yellow-100 text-yellow-800">⚠️ Perlu Perhatian</Badge>;
      default:
        return <Badge variant="secondary">❓ Tidak Diketahui</Badge>;
    }
  };

  const activeCount = forklifts.filter((f: Forklift) => f.status === 'active').length;
  const maintenanceCount = forklifts.filter((f: Forklift) => f.status === 'maintenance').length;
  const inactiveCount = forklifts.filter((f: Forklift) => f.status === 'inactive').length;

  const operatorCount = users.filter((u: User) => u.role === 'operator').length;
  const mechanicCount = users.filter((u: User) => u.role === 'mechanic').length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>🏗️</span>
              <span>Total Forklift</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forklifts.length}</div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>🟢 Aktif: {activeCount}</div>
              <div>🟡 Maintenance: {maintenanceCount}</div>
              <div>🔴 Tidak Aktif: {inactiveCount}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>👥</span>
              <span>Total Pengguna</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>👷 Operator: {operatorCount}</div>
              <div>🔧 Mekanik: {mechanicCount}</div>
              <div>👔 Supervisor: {users.filter((u: User) => u.role === 'supervisor').length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>📊</span>
              <span>Tingkat Operasional</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forklifts.length > 0 ? Math.round((activeCount / forklifts.length) * 100) : 0}%
            </div>
            <Progress 
              value={forklifts.length > 0 ? (activeCount / forklifts.length) * 100 : 0} 
              className="mt-2" 
            />
            <p className="text-sm text-gray-600 mt-1">
              Forklift dalam operasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>⚠️</span>
              <span>Perlu Perhatian</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statusSummary.filter((s: ForkliftStatusSummary) => s.pending_defects > 0).length}
            </div>
            <p className="text-sm text-gray-600">
              Forklift dengan masalah
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">📊 Ringkasan</TabsTrigger>
          <TabsTrigger value="forklifts">🏗️ Forklift</TabsTrigger>
          <TabsTrigger value="users">👥 Pengguna</TabsTrigger>
          <TabsTrigger value="reports">📈 Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>📋</span>
                  <span>Status Forklift Detail</span>
                </CardTitle>
                <CardDescription>
                  Monitoring kondisi dan riwayat inspeksi semua forklift
                  {!isConnected && ' (Data demo)'}
                </CardDescription>
              </div>
              <Button onClick={loadStatusSummary} disabled={isLoading}>
                {isLoading ? 'Memuat...' : '🔄 Refresh'}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p>Memuat data status forklift...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Inspeksi Terakhir</TableHead>
                        <TableHead>Status Inspeksi</TableHead>
                        <TableHead>Hari Sejak Inspeksi</TableHead>
                        <TableHead>Masalah Tertunda</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statusSummary.map((summary: ForkliftStatusSummary) => (
                        <TableRow key={summary.forklift.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{summary.forklift.unit_number}</div>
                              <div className="text-sm text-gray-600">
                                {summary.forklift.brand} {summary.forklift.model}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(summary.forklift.status)}
                          </TableCell>
                          <TableCell>
                            {summary.last_inspection_date
                              ? summary.last_inspection_date.toLocaleDateString('id-ID')
                              : 'Belum ada'
                            }
                          </TableCell>
                          <TableCell>
                            {getInspectionStatusBadge(summary.last_inspection_status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span>{summary.days_since_inspection ?? '-'}</span>
                              {(summary.days_since_inspection ?? 0) > 7 && (
                                <Badge variant="destructive" className="text-xs">
                                  Terlambat
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span>{summary.pending_defects}</span>
                              {summary.pending_defects > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  Urgent
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forklifts">
          <ForkliftManagement 
            forklifts={forklifts} 
            onDataChange={onDataChange}
            isConnected={isConnected}
          />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement 
            users={users} 
            onDataChange={onDataChange}
            isConnected={isConnected}
          />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📈</span>
                <span>Laporan & Analisis</span>
              </CardTitle>
              <CardDescription>
                Laporan operasional dan analisis performa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">
                  Fitur laporan akan segera tersedia
                </p>
                <Badge variant="secondary">
                  Coming Soon
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
