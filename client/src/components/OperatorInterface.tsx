
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { User, Forklift, ChecklistItem, CreateDailyInspectionInput } from '../../../server/src/schema';

interface OperatorInterfaceProps {
  user: User;
  forklifts: Forklift[];
  onDataChange: () => void;
  isConnected: boolean;
}

export function OperatorInterface({ user, forklifts, onDataChange, isConnected }: OperatorInterfaceProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    forklift_id: '',
    shift: '' as 'morning' | 'afternoon' | 'night' | '',
    hours_meter: '',
    fuel_level: '',
    notes: ''
  });
  const [checklistResults, setChecklistResults] = useState<Record<number, {
    status: 'ok' | 'defect' | 'not_applicable';
    notes: string;
  }>>({});

  // Demo checklist items
  const createDemoChecklist = useCallback(() => {
    const demoItems: ChecklistItem[] = [
      {
        id: 1,
        category: 'Pemeriksaan Visual',
        item_name: 'Kondisi ban',
        description: 'Periksa kondisi ban, tekanan, dan keausan',
        is_active: true,
        created_at: new Date()
      },
      {
        id: 2,
        category: 'Pemeriksaan Visual',
        item_name: 'Lampu kerja',
        description: 'Pastikan semua lampu berfungsi normal',
        is_active: true,
        created_at: new Date()
      },
      {
        id: 3,
        category: 'Sistem Hidrolik',
        item_name: 'Kebocoran oli hidrolik',
        description: 'Periksa kebocoran pada sistem hidrolik',
        is_active: true,
        created_at: new Date()
      },
      {
        id: 4,
        category: 'Sistem Hidrolik',
        item_name: 'Fungsi lift',
        description: 'Test fungsi naik turun fork',
        is_active: true,
        created_at: new Date()
      },
      {
        id: 5,
        category: 'Keselamatan',
        item_name: 'Klakson',
        description: 'Test fungsi klakson',
        is_active: true,
        created_at: new Date()
      },
      {
        id: 6,
        category: 'Keselamatan',
        item_name: 'Sabuk pengaman',
        description: 'Periksa kondisi dan fungsi sabuk pengaman',
        is_active: true,
        created_at: new Date()
      }
    ];
    
    setChecklistItems(demoItems);
    
    // Initialize checklist results
    const initialResults: Record<number, { status: 'ok' | 'defect' | 'not_applicable'; notes: string }> = {};
    demoItems.forEach((item: ChecklistItem) => {
      initialResults[item.id] = { status: 'ok', notes: '' };
    });
    setChecklistResults(initialResults);
  }, []);

  const loadChecklistItems = useCallback(async () => {
    if (!isConnected) {
      createDemoChecklist();
      return;
    }

    try {
      const items = await trpc.getChecklistItems.query();
      if (items.length === 0) {
        createDemoChecklist();
      } else {
        setChecklistItems(items);
        
        // Initialize checklist results
        const initialResults: Record<number, { status: 'ok' | 'defect' | 'not_applicable'; notes: string }> = {};
        items.forEach((item: ChecklistItem) => {
          initialResults[item.id] = { status: 'ok', notes: '' };
        });
        setChecklistResults(initialResults);
      }
    } catch (error) {
      console.error('Failed to load checklist items:', error);
      createDemoChecklist();
    }
  }, [isConnected, createDemoChecklist]);

  useEffect(() => {
    loadChecklistItems();
  }, [loadChecklistItems]);

  const handleChecklistChange = (itemId: number, field: 'status' | 'notes', value: string) => {
    setChecklistResults((prev: Record<number, { status: 'ok' | 'defect' | 'not_applicable'; notes: string }>) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isConnected) {
        const inspectionData: CreateDailyInspectionInput = {
          forklift_id: parseInt(formData.forklift_id),
          operator_id: user.id,
          inspection_date: new Date(),
          shift: formData.shift as 'morning' | 'afternoon' | 'night',
          hours_meter: formData.hours_meter ? parseFloat(formData.hours_meter) : null,
          fuel_level: formData.fuel_level ? parseFloat(formData.fuel_level) : null,
          notes: formData.notes || null,
          checklist_results: Object.entries(checklistResults).map(([itemId, result]) => ({
            checklist_item_id: parseInt(itemId),
            status: result.status,
            notes: result.notes || null
          }))
        };

        await trpc.createDailyInspection.mutate(inspectionData);
      }
      
      // Reset form
      setFormData({
        forklift_id: '',
        shift: '',
        hours_meter: '',
        fuel_level: '',
        notes: ''
      });
      
      // Reset checklist
      const resetResults: Record<number, { status: 'ok' | 'defect' | 'not_applicable'; notes: string }> = {};
      checklistItems.forEach((item: ChecklistItem) => {
        resetResults[item.id] = { status: 'ok', notes: '' };
      });
      setChecklistResults(resetResults);

      onDataChange();
      alert(isConnected ? '✅ Inspeksi berhasil disimpan!' : '✅ Inspeksi tercatat (mode demo)!');
    } catch (error) {
      console.error('Failed to create inspection:', error);
      alert('❌ Gagal menyimpan inspeksi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const activeForklifts = forklifts.filter((f: Forklift) => f.status === 'active');
  const groupedItems = checklistItems.reduce((groups: Record<string, ChecklistItem[]>, item: ChecklistItem) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  const hasDefects = Object.values(checklistResults).some(result => result.status === 'defect');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📝</span>
            <span>Inspeksi Harian Forklift</span>
          </CardTitle>
          <CardDescription>
            Lakukan inspeksi harian sebelum mengoperasikan forklift
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="forklift">Pilih Forklift</Label>
                <Select 
                  value={formData.forklift_id || ''} 
                  onValueChange={(value: string) => setFormData((prev) => ({ ...prev, forklift_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih forklift..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeForklifts.map((forklift: Forklift) => (
                      <SelectItem key={forklift.id} value={forklift.id.toString()}>
                        {forklift.unit_number} - {forklift.brand} {forklift.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift">Shift</Label>
                <Select 
                  value={formData.shift || ''} 
                  onValueChange={(value: string) => setFormData((prev) => ({ ...prev, shift: value as 'morning' | 'afternoon' | 'night' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih shift..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">🌅 Pagi</SelectItem>
                    <SelectItem value="afternoon">☀️ Siang</SelectItem>
                    <SelectItem value="night">🌙 Malam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours_meter">Hour Meter</Label>
                <Input
                  id="hours_meter"
                  type="number"
                  step="0.1"
                  placeholder="Contoh: 1250.5"
                  value={formData.hours_meter}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData((prev) => ({ ...prev, hours_meter: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuel_level">Level Bahan Bakar (%)</Label>
                <Input
                  id="fuel_level"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Contoh: 75"
                  value={formData.fuel_level}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData((prev) => ({ ...prev, fuel_level: e.target.value }))
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Checklist Items */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Daftar Periksa</h3>
              
              {Object.entries(groupedItems).map(([category, items]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-base">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {items.map((item: ChecklistItem) => (
                      <div key={item.id} className="space-y-3 p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{item.item_name}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                        
                        <RadioGroup
                          value={checklistResults[item.id]?.status || 'ok'}
                          onValueChange={(value: string) => 
                            handleChecklistChange(item.id, 'status', value)
                          }
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ok" id={`${item.id}-ok`} />
                            <Label htmlFor={`${item.id}-ok`} className="text-green-700">
                              ✅ OK
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="defect" id={`${item.id}-defect`} />
                            <Label htmlFor={`${item.id}-defect`} className="text-red-700">
                              ❌ Rusak
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="not_applicable" id={`${item.id}-na`} />
                            <Label htmlFor={`${item.id}-na`} className="text-gray-600">
                              ➖ Tidak Berlaku
                            </Label>
                          </div>
                        </RadioGroup>

                        {checklistResults[item.id]?.status === 'defect' && (
                          <Textarea
                            placeholder="Jelaskan masalah yang ditemukan..."
                            value={checklistResults[item.id]?.notes || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                              handleChecklistChange(item.id, 'notes', e.target.value)
                            }
                            className="border-red-200 focus:border-red-500"
                          />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Tambahan</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tambahan tentang kondisi forklift..."
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>

            {/* Status Summary */}
            {hasDefects && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">⚠️</span>
                  <span className="font-medium text-red-800">
                    Ditemukan masalah pada forklift ini
                  </span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Harap laporkan ke mekanik untuk tindak lanjut
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading || !formData.forklift_id || !formData.shift}
              className="w-full"
            >
              {isLoading ? 'Menyimpan...' : '💾 Simpan Inspeksi'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
