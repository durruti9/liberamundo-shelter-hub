import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, BedDouble, History, CalendarPlus, UtensilsCrossed, LogOut, Users, Globe, Settings, ChevronDown, LayoutDashboard, ListChecks, Mailbox, StickyNote, Clock, Package, FileWarning, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';
import logo from '@/assets/Logo2Liberamundo.png';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

import ThemeToggle from './ThemeToggle';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';
import ConnectionIndicator from './ConnectionIndicator';
import SettingsDialog from './SettingsDialog';
import UserManagementDialog from './UserManagementDialog';
import { useAlbergueStore } from '@/hooks/useAlbergueStore';
import { UserRole } from '@/types';
import { useI18n } from '@/i18n/I18nContext';
import { Language } from '@/i18n/translations';

// Lazy-loaded tabs
const DashboardTab = lazy(() => import('./tabs/DashboardTab'));
const HabitacionesTab = lazy(() => import('./tabs/HabitacionesTab'));
const HistorialTab = lazy(() => import('./tabs/HistorialTab'));
const LlegadasTab = lazy(() => import('./tabs/LlegadasTab'));
const ComedorTab = lazy(() => import('./tabs/ComedorTab'));
const IncidenciasTab = lazy(() => import('./tabs/IncidenciasTab'));
const TareasEmpleadosTab = lazy(() => import('./tabs/TareasEmpleadosTab'));
const SugerenciasTab = lazy(() => import('./tabs/SugerenciasTab'));
const NotasTab = lazy(() => import('./tabs/NotasTab'));
const RegistroHorarioTab = lazy(() => import('./tabs/RegistroHorarioTab'));
const InventarioTab = lazy(() => import('./tabs/InventarioTab'));
const InformesTab = lazy(() => import('./tabs/InformesTab'));

interface Props {
  onLogout: () => void;
  role: UserRole;
  albergueId: string;
  onSwitchAlbergue: (id: string) => void;
}

const LANG_LABELS: Record<Language, string> = { es: 'Español', fr: 'Français', ar: 'العربية', en: 'English', ru: 'Русский' };
const LANG_FLAGS: Record<Language, string> = { es: '🇪🇸', fr: '🇫🇷', ar: '🇸🇦', en: '🇬🇧', ru: '🇷🇺' };

const TAB_STORAGE_KEY = 'lm_active_tab';

function TabFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export default function AppLayout({ onLogout, role, albergueId, onSwitchAlbergue }: Props) {
  const store = useAlbergueStore(albergueId);
  const { t, lang, setLang } = useI18n();
  const [tab, setTab] = useState(() => {
    const saved = sessionStorage.getItem(TAB_STORAGE_KEY);
    return saved || 'dashboard';
  });
  const [showUsers, setShowUsers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Backup reminder for admin (every 7 days)
  useEffect(() => {
    if (role !== 'admin') return;
    const BACKUP_REMINDER_KEY = 'lm_last_backup_reminder';
    const BACKUP_INTERVAL = 7 * 24 * 60 * 60 * 1000;
    const lastReminder = parseInt(localStorage.getItem(BACKUP_REMINDER_KEY) || '0');
    if (Date.now() - lastReminder > BACKUP_INTERVAL) {
      const timer = setTimeout(() => {
        toast.info('💾 Recordatorio: hace más de una semana que no se realiza un backup. Accede a Configuración > Backup.', {
          duration: 10000,
          action: {
            label: 'Ir a backup',
            onClick: () => setShowSettings(true),
          },
        });
        localStorage.setItem(BACKUP_REMINDER_KEY, Date.now().toString());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [role]);

  const handleTabChange = useCallback((value: string) => {
    setTab(value);
    sessionStorage.setItem(TAB_STORAGE_KEY, value);
  }, []);

  const roleLabel: Record<UserRole, string> = {
    admin: 'Administración',
    gestor: 'Personal gestor',
    personal_albergue: 'Personal laboral',
  };

  const tabCount = role === 'admin' ? 11 : role === 'personal_albergue' ? 8 : 6;

  const handleAlbergueDeleted = (deletedId: string) => {
    if (deletedId === albergueId && store.albergues.length > 0) {
      const remaining = store.albergues.filter(a => a.id !== deletedId);
      if (remaining.length > 0) onSwitchAlbergue(remaining[0].id);
    }
  };

  const handleSearchNavigate = useCallback((targetTab: string) => {
    handleTabChange(targetTab);
  }, [handleTabChange]);

  const handleNotificationNavigate = useCallback((targetTab: string) => {
    handleTabChange(targetTab);
  }, [handleTabChange]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Libera Mundo" className="h-9" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-tight">{store.currentAlbergue?.nombre || t.appName}</h1>
              {(() => {
                const userAlbergueIds = JSON.parse(localStorage.getItem('userAlbergueIds') || '[]');
                const switchable = role === 'admin'
                  ? store.albergues
                  : store.albergues.filter(a => userAlbergueIds.includes(a.id));
                return switchable.length > 1 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                        {t.switchShelter} <ChevronDown className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {switchable.map(a => (
                        <DropdownMenuItem
                          key={a.id}
                          onClick={() => onSwitchAlbergue(a.id)}
                          className={a.id === albergueId ? 'bg-accent font-medium' : ''}
                        >
                          <Building2 className="w-4 h-4 mr-2" /> {a.nombre}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null;
              })()}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <GlobalSearch
              huespedes={store.huespedes}
              incidencias={store.incidencias}
              llegadas={store.llegadas}
              boardMessages={store.boardMessages}
              onNavigate={handleSearchNavigate}
            />
            <NotificationBell
              albergueId={albergueId}
              role={role}
              onNavigate={handleNotificationNavigate}
            />
            <ConnectionIndicator />
            <ThemeToggle />

            {/* Language switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Globe className="w-4 h-4" />
                  <span className="text-xs">{LANG_FLAGS[lang]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(LANG_LABELS) as Language[]).map(l => (
                  <DropdownMenuItem key={l} onClick={() => setLang(l)} className={l === lang ? 'bg-accent' : ''}>
                    {LANG_FLAGS[l]} {LANG_LABELS[l]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Badge variant="outline" className="text-xs hidden sm:flex">{roleLabel[role]}</Badge>

            {role === 'admin' && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowUsers(true)}>
                  <Users className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">{t.users}</span>
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem('auth'); localStorage.removeItem('authRole'); localStorage.removeItem('authEmail'); localStorage.removeItem('currentAlbergueId'); onLogout(); }}>
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t.logout}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full h-auto" style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}>
              {(role === 'admin' || role === 'gestor' || role === 'personal_albergue') && (
                <TabsTrigger value="dashboard" className="flex items-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm whitespace-nowrap">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{t.dashboard}</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="habitaciones" className="flex items-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm whitespace-nowrap">
                <BedDouble className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{t.rooms}</span>
              </TabsTrigger>
              {(role === 'admin' || role === 'gestor') && (
                <TabsTrigger value="historial" className="flex items-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm whitespace-nowrap">
                  <History className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{t.history}</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="llegadas" className="flex items-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm whitespace-nowrap">
                <CalendarPlus className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{t.arrivals}</span>
              </TabsTrigger>
              <TabsTrigger value="comedor" className="flex items-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm whitespace-nowrap">
                <UtensilsCrossed className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{t.dining}</span>
              </TabsTrigger>
              <TabsTrigger value="incidencias" className="flex items-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm whitespace-nowrap">
                <FileWarning className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{t.incidents}</span>
              </TabsTrigger>
              {(role === 'admin' || role === 'personal_albergue') && (
                <TabsTrigger value="tareas" className="flex items-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm whitespace-nowrap">
                  <ListChecks className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{t.employeeTasks}</span>
                </TabsTrigger>
              )}
              {(role === 'admin' || role === 'personal_albergue') && (
                <TabsTrigger value="registro_horario" className="flex items-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm whitespace-nowrap">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Horarios</span>
                </TabsTrigger>
              )}
              {(role === 'admin' || role === 'personal_albergue') && (
                <TabsTrigger value="inventario" className="flex items-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm whitespace-nowrap">
                  <Package className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Inventario</span>
                </TabsTrigger>
              )}
              {(role === 'admin' || role === 'gestor') && (
                <TabsTrigger value="informes" className="flex items-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm whitespace-nowrap">
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Informes</span>
                </TabsTrigger>
              )}
              {role === 'admin' && (
                <TabsTrigger value="sugerencias" className="flex items-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm whitespace-nowrap">
                  <Mailbox className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Buzón</span>
                </TabsTrigger>
              )}
              {role === 'admin' && (
                <TabsTrigger value="notas" className="flex items-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm whitespace-nowrap">
                  <StickyNote className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Notas</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <Suspense fallback={<TabFallback />}>
            {(role === 'admin' || role === 'gestor' || role === 'personal_albergue') && (
              <TabsContent value="dashboard">
                <DashboardTab store={store} role={role} onNavigate={handleTabChange} />
              </TabsContent>
            )}
            <TabsContent value="habitaciones">
              <HabitacionesTab store={store} role={role} />
            </TabsContent>
            {(role === 'admin' || role === 'gestor') && (
              <TabsContent value="historial">
                <HistorialTab store={store} role={role} />
              </TabsContent>
            )}
            <TabsContent value="llegadas">
              <LlegadasTab store={store} role={role} />
            </TabsContent>
            <TabsContent value="comedor">
              <ComedorTab store={store} role={role} />
            </TabsContent>
            <TabsContent value="incidencias">
              <IncidenciasTab store={store} role={role} />
            </TabsContent>
            {(role === 'admin' || role === 'personal_albergue') && (
              <TabsContent value="tareas">
                <TareasEmpleadosTab role={role} albergueId={albergueId} />
              </TabsContent>
            )}
            {(role === 'admin' || role === 'gestor') && (
              <TabsContent value="informes">
                <InformesTab store={store} role={role} />
              </TabsContent>
            )}
            {role === 'admin' && (
              <TabsContent value="sugerencias">
                <SugerenciasTab role={role} albergueId={albergueId} />
              </TabsContent>
            )}
            {role === 'admin' && (
              <TabsContent value="notas">
                <NotasTab userEmail={localStorage.getItem('authEmail') || ''} />
              </TabsContent>
            )}
            {(role === 'admin' || role === 'personal_albergue') && (
              <TabsContent value="registro_horario">
                <RegistroHorarioTab role={role} albergueId={albergueId} />
              </TabsContent>
            )}
            {(role === 'admin' || role === 'personal_albergue') && (
              <TabsContent value="inventario">
                <InventarioTab role={role} albergueId={albergueId} />
              </TabsContent>
            )}
          </Suspense>
        </Tabs>
      </main>

      {/* Settings dialog */}
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        store={store}
        albergueId={albergueId}
        onAlbergueDeleted={handleAlbergueDeleted}
      />

      {/* User management dialog */}
      <UserManagementDialog
        open={showUsers}
        onClose={() => setShowUsers(false)}
        store={store}
      />
    </div>
  );
}
