
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import type { Forklift, DailyInspection, GetInspectionHistoryInput } from '../../../server/src/schema';

interface MechanicInterfaceProps {
  forklifts: Forklift[];
  isConnected: boolean;
}

export function MechanicInterface({ forklifts, isConnected }: MechanicInterfaceProps) {
  const [inspectionHistory, setInspectionHistory] = useState<DailyInspection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<GetInspectionHistoryInput>({
    forklift_id: undefined,
    start_date: undefined,
    end_date: undefined,
    status: undefined
  });

  // Create demo inspection data
  const createDemoInspections = useCallback(() => {
    const demoInspections: DailyInspection[] = [
      {
        id: 1,
        forklift_id: 1,
        operator_id: 1,
        inspection_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        shift: 'morning',
        hours_meter: 1245.5,
        fuel_level: 85,
        overall_status: 'pass',
        notes: null,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        forklift_id: 2,
        operator_id: 1,
        inspection_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        shift: 'afternoon',
        hours_meter: 2156.2,
        fuel_level: 60,
        overall_status: 'needs_attention',
        notes: 'Suara aneh dari sistem hidrolik',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        id: 3,
        forklift_id: 3,
        operator_id: 1,
        inspection_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        shift: 'morning',
        hours_meter: 3200.1,
        fuel_level: 40,
        overall_status: 'fail',
        notes: 'Kebocoran oli hidrolik, fork tidak bisa naik',
        created_at: new Date(Date.now() - 2 * 24 * 60 *  60 * 1000)
      }
    ];
    return demoInspections;
  }, []);

  const loadInspectionHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isConnected) {
        const history = await trpc.getInspectionHistory.query(filters);
        setInspectionHistory(history.length > 0 ? history : createDemoInspections());
      } else {
        // Use demo data when not connected
        setInspectionHistory(createDemoInspections());
      }
    } catch (error) {
      console.error('Failed to load inspection history:', error);
      setInspectionHistory(createDemoInspections());
    } finally {
      setIsLoading(false);
    }
  }, [filters, isConnected, createDemoInspections]);

  useEffect(() => {
    loadInspectionHistory();
  }, [loadInspectionHistory]);

  const getStatusBadge = (status: 'pass' | 'fail' | 'needs_attention') => {
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

  const getShiftLabel = (shift: 'morning' | 'afternoon' | 'night') => {
    switch (shift) {
      case 'morning':
        return '🌅 Pagi';
      case 'afternoon':
        return '☀️ Siang';
      case 'night':
        return '🌙 Malam';
      default:
        return shift;
    }
  };

  const failedInspections = inspectionHistory.filter(
    (inspection: DailyInspection) => inspection.overall_status === 'fail' || inspection.overall_status === 'needs_attention'
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>📊</span>
              <span>Total Inspeksi</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inspectionHistory.length}
            </div>
            <p className="text-sm text-gray-600">Inspeksi dalam periode ini</p>
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
              {failedInspections.length}
            </div>
            <p className="text-sm text-gray-600">Inspeksi dengan masalah</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>🏗️</span>
              <span>Forklift Aktif</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forklifts.filter((f: Forklift) => f.status === 'active').length}
            </div>
            <p className="text-sm text-gray-600">Unit dalam operasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔍</span>
            <span>Filter Riwayat Inspeksi</span>
          </CardTitle>
          <CardDescription>
            Filter data inspeksi untuk analisis pemeliharaan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Forklift</Label>
              <Select 
                value={filters.forklift_id?.toString() || 'all'} 
                onValueChange={(value: string) => 
                  setFilters((prev: GetInspectionHistoryInput) => ({ 
                    ...prev, 
                    forklift_id: value === 'all' ? undefined : parseInt(value) 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua forklift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Forklift</SelectItem>
                  {forklifts.map((forklift: Forklift) => (
                    <SelectItem key={forklift.id} value={forklift.id.toString()}>
                      {forklift.unit_number} - {forklift.brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={filters.start_date ? filters.start_date.toISOString().split('T')[0] : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: GetInspectionHistoryInput) => ({
                    ...prev,
                    start_date: e.target.value ? new Date(e.target.value) : undefined
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <Input
                type="date"
                value={filters.end_date ? filters.end_date.toISOString().split('T')[0] : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: GetInspectionHistoryInput) => ({
                    ...prev,
                    end_date: e.target.value ? new Date(e.target.value) : undefined
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(value: string) => 
                  setFilters((prev: GetInspectionHistoryInput) => ({ 
                    ...prev, 
                    status: value === 'all' ? undefined : value as 'pass' | 'fail' | 'needs_attention'
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pass">✅ Lulus</SelectItem>
                  <SelectItem value="fail">❌ Gagal</SelectItem>
                  <SelectItem value="needs_attention">⚠️ Perlu Perhatian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={loadInspectionHistory} disabled={isLoading}>
              {isLoading ? 'Memuat...' : '🔄 Refresh Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inspection History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📋</span>
            <span>Riwayat Inspeksi</span>
          </CardTitle>
          <CardDescription>
            Data inspeksi harian untuk analisis dan pemeliharaan
            {!isConnected && ' (Data demo)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Memuat data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Forklift</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hour Meter</TableHead>
                    <TableHead>Bahan Bakar</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspectionHistory.map((inspection: DailyInspection) => {
                    const forklift = forklifts.find((f: Forklift) => f.id === inspection.forklift_id);
                    return (
                      <TableRow key={inspection.id}>
                        <TableCell>
                          {inspection.inspection_date.toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>
                          {forklift ? `${forklift.unit_number} - ${forklift.brand}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {getShiftLabel(inspection.shift)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(inspection.overall_status)}
                        </TableCell>
                        <TableCell>
                          {inspection.hours_meter || '-'}
                        </TableCell>
                        <TableCell>
                          {inspection.fuel_level ? `${inspection.fuel_level}%` : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={inspection.notes || ''}>
                            {inspection.notes || '-'}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Priority Issues */}
      {failedInspections.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <span>🚨</span>
              <span>Prioritas Pemeliharaan</span>
            </CardTitle>
            <CardDescription>
              Forklift yang memerlukan perhatian segera
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failedInspections.slice(0, 5).map((inspection: DailyInspection) => {
                const forklift = forklifts.find((f: Forklift) => f.id === inspection.forklift_id);
                return (
                  <div 
                    key={inspection.id} 
                    className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div>
                      <div className="font-medium">
                        {forklift ? `${forklift.unit_number} - ${forklift.brand} ${forklift.model}` : 'Forklift N/A'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {inspection.inspection_date.toLocaleDateString('id-ID')} - {getShiftLabel(inspection.shift)}
                      </div>
                      {inspection.notes && (
                        <div className="text-sm text-red-700 mt-1">
                          {inspection.notes}
                        </div>
                      )}
                    </div>
                    <div>
                      {getStatusBadge(inspection.overall_status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
