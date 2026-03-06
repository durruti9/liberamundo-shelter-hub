import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, BedDouble, History, CalendarPlus, UtensilsCrossed, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HabitacionesTab from './tabs/HabitacionesTab';
import HistorialTab from './tabs/HistorialTab';
import LlegadasTab from './tabs/LlegadasTab';
import ComedorTab from './tabs/ComedorTab';
import { useAlbergueStore } from '@/hooks/useAlbergueStore';

interface Props {
  onLogout: () => void;
}

export default function AppLayout({ onLogout }: Props) {
  const store = useAlbergueStore();
  const [tab, setTab] = useState('habitaciones');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold hidden sm:block">Albergue LiberaMundo</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem('auth'); onLogout(); }}>
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="habitaciones" className="flex items-center gap-2 py-3 text-xs sm:text-sm">
              <BedDouble className="w-4 h-4" />
              <span className="hidden sm:inline">Habitaciones</span>
            </TabsTrigger>
            <TabsTrigger value="historial" className="flex items-center gap-2 py-3 text-xs sm:text-sm">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Historial</span>
            </TabsTrigger>
            <TabsTrigger value="llegadas" className="flex items-center gap-2 py-3 text-xs sm:text-sm">
              <CalendarPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Llegadas</span>
            </TabsTrigger>
            <TabsTrigger value="comedor" className="flex items-center gap-2 py-3 text-xs sm:text-sm">
              <UtensilsCrossed className="w-4 h-4" />
              <span className="hidden sm:inline">Comedor</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="habitaciones">
            <HabitacionesTab store={store} />
          </TabsContent>
          <TabsContent value="historial">
            <HistorialTab store={store} />
          </TabsContent>
          <TabsContent value="llegadas">
            <LlegadasTab store={store} />
          </TabsContent>
          <TabsContent value="comedor">
            <ComedorTab store={store} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
