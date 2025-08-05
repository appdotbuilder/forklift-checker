
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { OperatorInterface } from '@/components/OperatorInterface';
import { MechanicInterface } from '@/components/MechanicInterface';
import { SupervisorInterface } from '@/components/SupervisorInterface';
import { UserLogin } from '@/components/UserLogin';
import type { User, Forklift } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [forklifts, setForklifts] = useState<Forklift[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create demo data for when the backend is not available
  const createDemoData = useCallback(() => {
    const demoUsers: User[] = [
      {
        id: 1,
        username: 'operator1',
        full_name: 'Ahmad Operator',
        role: 'operator',
        created_at: new Date()
      },
      {
        id: 2,
        username: 'mechanic1',
        full_name: 'Budi Mekanik',
        role: 'mechanic',
        created_at: new Date()
      },
      {
        id: 3,
        username: 'supervisor1',
        full_name: 'Citra Supervisor',
        role: 'supervisor',
        created_at: new Date()
      }
    ];

    const demoForklifts: Forklift[] = [
      {
        id: 1,
        unit_number: 'FL-001',
        brand: 'Toyota',
        model: '8FBE15',
        year: 2020,
        serial_number: 'TOY001234',
        status: 'active',
        created_at: new Date()
      },
      {
        id: 2,
        unit_number: 'FL-002',
        brand: 'Mitsubishi',
        model: 'FBE18',
        year: 2019,
        serial_number: 'MIT005678',
        status: 'active',
        created_at: new Date()
      },
      {
        id: 3,
        unit_number: 'FL-003',
        brand: 'Komatsu',
        model: 'FB20',
        year: 2021,
        serial_number: 'KOM009876',
        status: 'maintenance',
        created_at: new Date()
      }
    ];

    setUsers(demoUsers);
    setForklifts(demoForklifts);
    setIsConnected(false);
    setError('Server tidak tersedia - menggunakan data demo');
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      // Try to load real data from the server
      const [usersData, forkliftsData] = await Promise.all([
        trpc.getUsers.query(),
        trpc.getForklifts.query()
      ]);
      
      // If we get data (even empty arrays), the server is working
      setUsers(usersData);
      setForklifts(forkliftsData);
      setIsConnected(true);
      setError(null);
    } catch (error) {
      console.warn('Server not available, using demo data:', error);
      createDemoData();
    }
  }, [createDemoData]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
        {error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        <UserLogin users={users} onLogin={setCurrentUser} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                🏗️ Sistem Inspeksi Forklift
              </h1>
              <Badge variant="outline" className="text-sm">
                {currentUser.role === 'operator' && '👷 Operator'}
                {currentUser.role === 'mechanic' && '🔧 Mekanik'}
                {currentUser.role === 'supervisor' && '👔 Supervisor'}
              </Badge>
              {!isConnected && (
                <Badge variant="secondary" className="text-xs">
                  📱 Mode Demo
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Selamat datang, <strong>{currentUser.full_name}</strong>
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {!isConnected && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="container mx-auto">
            <p className="text-sm text-blue-700">
              🔄 Aplikasi berjalan dalam mode demo. Data yang disimpan tidak akan tersimpan permanen.
            </p>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
        {currentUser.role === 'operator' && (
          <OperatorInterface 
            user={currentUser} 
            forklifts={forklifts}
            onDataChange={loadInitialData}
            isConnected={isConnected}
          />
        )}
        {currentUser.role === 'mechanic' && (
          <MechanicInterface 
            forklifts={forklifts}
            isConnected={isConnected}
          />
        )}
        {currentUser.role === 'supervisor' && (
          <SupervisorInterface 
            forklifts={forklifts}
            users={users}
            onDataChange={loadInitialData}
            isConnected={isConnected}
          />
        )}
      </main>
    </div>
  );
}

export default App;
