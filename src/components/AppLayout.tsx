import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, BedDouble, History, CalendarPlus, UtensilsCrossed, LogOut, Users, Plus, Trash2, FileWarning, Globe, Settings, ChevronDown, LayoutDashboard, KeyRound, ListChecks, Mailbox, StickyNote, Clock } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';
import logo from '@/assets/Logo2Liberamundo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

import HabitacionesTab from './tabs/HabitacionesTab';
import HistorialTab from './tabs/HistorialTab';
import LlegadasTab from './tabs/LlegadasTab';
import ComedorTab from './tabs/ComedorTab';
import IncidenciasTab from './tabs/IncidenciasTab';
import SettingsDialog from './SettingsDialog';
import DashboardTab from './tabs/DashboardTab';
import TareasEmpleadosTab from './tabs/TareasEmpleadosTab';
import SugerenciasTab from './tabs/SugerenciasTab';
import NotasTab from './tabs/NotasTab';
import RegistroHorarioTab from './tabs/RegistroHorarioTab';
import { useAlbergueStore } from '@/hooks/useAlbergueStore';
import { UserRole } from '@/types';
import { useI18n } from '@/i18n/I18nContext';
import { Language } from '@/i18n/translations';

interface Props {
  onLogout: () => void;
  role: UserRole;
  albergueId: string;
  onSwitchAlbergue: (id: string) => void;
}

const LANG_LABELS: Record<Language, string> = { es: 'Español', fr: 'Français', ar: 'العربية', en: 'English', ru: 'Русский' };
const LANG_FLAGS: Record<Language, string> = { es: '🇪🇸', fr: '🇫🇷', ar: '🇸🇦', en: '🇬🇧', ru: '🇷🇺' };

export default function AppLayout({ onLogout, role, albergueId, onSwitchAlbergue }: Props) {
  const store = useAlbergueStore(albergueId);
  const { t, lang, setLang } = useI18n();
  const [tab, setTab] = useState('dashboard');
  const [showUsers, setShowUsers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'personal_albergue' as UserRole });
  const [changingPasswordFor, setChangingPasswordFor] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const handleAddUser = () => {
    if (!newUser.email || !newUser.password) return;
    store.addUser(newUser);
    setNewUser({ email: '', password: '', role: 'personal_albergue' });
  };

  const roleLabel: Record<UserRole, string> = {
    admin: 'Administración',
    gestor: 'Personal gestor',
    personal_albergue: 'Personal laboral',
  };

  const adminCount = store.users.filter(u => u.role === 'admin').length;

  const tabCount = role === 'admin' ? 11 : role === 'gestor' ? 7 : 7;

  const handleAlbergueDeleted = (deletedId: string) => {
    if (deletedId === albergueId && store.albergues.length > 0) {
      const remaining = store.albergues.filter(a => a.id !== deletedId);
      if (remaining.length > 0) onSwitchAlbergue(remaining[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Libera Mundo" className="h-9" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-tight">{store.currentAlbergue?.nombre || t.appName}</h1>
              {role === 'admin' && store.albergues.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                      {t.switchShelter} <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {store.albergues.map(a => (
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
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
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

            <Badge variant="outline" className="text-xs">{roleLabel[role]}</Badge>

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
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full h-auto" style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}>
            {(role === 'admin' || role === 'gestor') && (
              <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3 text-xs sm:text-sm">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">{t.dashboard}</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="habitaciones" className="flex items-center gap-2 py-3 text-xs sm:text-sm">
              <BedDouble className="w-4 h-4" />
              <span className="hidden sm:inline">{t.rooms}</span>
            </TabsTrigger>
            {(role === 'admin' || role === 'gestor') && (
              <TabsTrigger value="historial" className="flex items-center gap-2 py-3 text-xs sm:text-sm">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">{t.history}</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="llegadas" className="flex items-center gap-2 py-3 text-xs sm:text-sm">
              <CalendarPlus className="w-4 h-4" />
              <span className="hidden sm:inline">{t.arrivals}</span>
            </TabsTrigger>
            <TabsTrigger value="comedor" className="flex items-center gap-2 py-3 text-xs sm:text-sm">
              <UtensilsCrossed className="w-4 h-4" />
              <span className="hidden sm:inline">{t.dining}</span>
            </TabsTrigger>
            <TabsTrigger value="incidencias" className="flex items-center gap-2 py-3 text-xs sm:text-sm">
              <FileWarning className="w-4 h-4" />
              <span className="hidden sm:inline">{t.incidents}</span>
            </TabsTrigger>
            {(role === 'admin' || role === 'personal_albergue') && (
              <TabsTrigger value="tareas" className="flex items-center gap-2 py-3 text-xs sm:text-sm">
                <ListChecks className="w-4 h-4" />
                <span className="hidden sm:inline">{t.employeeTasks}</span>
              </TabsTrigger>
            )}
            {(role === 'admin' || role === 'personal_albergue') && (
              <TabsTrigger value="registro_horario" className="flex items-center gap-2 py-3 text-xs sm:text-sm">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Horarios</span>
              </TabsTrigger>
            )}
            {role === 'admin' && (
              <TabsTrigger value="sugerencias" className="flex items-center gap-2 py-3 text-xs sm:text-sm">
                <Mailbox className="w-4 h-4" />
                <span className="hidden sm:inline">Buzón</span>
              </TabsTrigger>
            )}
            {role === 'admin' && (
              <TabsTrigger value="notas" className="flex items-center gap-2 py-3 text-xs sm:text-sm">
                <StickyNote className="w-4 h-4" />
                <span className="hidden sm:inline">Notas</span>
              </TabsTrigger>
            )}
          </TabsList>

          {(role === 'admin' || role === 'gestor') && (
            <TabsContent value="dashboard">
              <DashboardTab store={store} role={role} />
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

      {/* User management dialog - admin only */}
      <Dialog open={showUsers} onOpenChange={setShowUsers}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t.userManagement}</DialogTitle></DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3 p-4 border rounded-lg">
              <h3 className="text-sm font-semibold">Crear nuevo usuario</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Usuario</Label>
                  <Input value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="Nombre" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Contraseña</Label>
                  <PasswordInput value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="••••••" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rol</Label>
                  <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v as UserRole }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administración</SelectItem>
                      <SelectItem value="gestor">Personal gestor</SelectItem>
                      <SelectItem value="personal_albergue">Personal laboral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" onClick={handleAddUser} className="w-full">
                <Plus className="w-4 h-4 mr-1" /> Crear usuario
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.users.map(u => (
                  <TableRow key={u.email}>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{roleLabel[u.role]}</Badge></TableCell>
                    <TableCell className="space-x-1">
                      <Button size="icon" variant="ghost" title="Cambiar contraseña" onClick={() => { setChangingPasswordFor(u.email); setNewPasswordValue(''); }}>
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      {!(u.role === 'admin' && adminCount <= 1) && (
                        <Button size="icon" variant="ghost" onClick={() => store.removeUser(u.email)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change password dialog */}
      <Dialog open={!!changingPasswordFor} onOpenChange={() => setChangingPasswordFor(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" /> {t.changePassword}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{changingPasswordFor}</p>
            <div className="space-y-2">
              <Label>{t.newPassword}</Label>
              <PasswordInput value={newPasswordValue} onChange={e => setNewPasswordValue(e.target.value)} placeholder="••••••" autoFocus />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setChangingPasswordFor(null)}>{t.cancel}</Button>
              <Button disabled={newPasswordValue.length < 4} onClick={async () => {
                try {
                  await store.changePassword(changingPasswordFor!, newPasswordValue);
                  const { toast } = await import('sonner');
                  toast.success(t.passwordChanged);
                  setChangingPasswordFor(null);
                } catch { /* error handled by api */ }
              }}>{t.save}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
