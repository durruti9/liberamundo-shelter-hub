import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, BedDouble, History, CalendarPlus, UtensilsCrossed, LogOut, Users, Plus, Trash2, FileWarning, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import HabitacionesTab from './tabs/HabitacionesTab';
import HistorialTab from './tabs/HistorialTab';
import LlegadasTab from './tabs/LlegadasTab';
import ComedorTab from './tabs/ComedorTab';
import IncidenciasTab from './tabs/IncidenciasTab';
import { useAlbergueStore } from '@/hooks/useAlbergueStore';
import { UserRole } from '@/types';
import { useI18n } from '@/i18n/I18nContext';
import { Language } from '@/i18n/translations';

interface Props {
  onLogout: () => void;
  role: UserRole;
}

const LANG_LABELS: Record<Language, string> = {
  es: 'Español',
  fr: 'Français',
  ar: 'العربية',
  en: 'English',
};

const LANG_FLAGS: Record<Language, string> = {
  es: '🇪🇸',
  fr: '🇫🇷',
  ar: '🇸🇦',
  en: '🇬🇧',
};

export default function AppLayout({ onLogout, role }: Props) {
  const store = useAlbergueStore();
  const { t, lang, setLang } = useI18n();
  const [tab, setTab] = useState('habitaciones');
  const [showUsers, setShowUsers] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', nombre: '', role: 'invitado' as UserRole });

  const handleAddUser = () => {
    if (!newUser.email || !newUser.password || !newUser.nombre) return;
    store.addUser(newUser);
    setNewUser({ email: '', password: '', nombre: '', role: 'invitado' });
  };

  const roleLabel: Record<UserRole, string> = { admin: t.administrator, gestor: t.manager, invitado: t.guest };

  const tabCount = role === 'invitado' ? 4 : 5;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold hidden sm:block">{t.appName}</h1>
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
              <Button variant="ghost" size="sm" onClick={() => setShowUsers(true)}>
                <Users className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">{t.users}</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem('auth'); localStorage.removeItem('authRole'); onLogout(); }}>
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t.logout}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className={`grid w-full h-auto`} style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}>
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
          </TabsList>

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
        </Tabs>
      </main>

      {/* User management dialog - admin only */}
      <Dialog open={showUsers} onOpenChange={setShowUsers}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t.userManagement}</DialogTitle></DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3 p-4 border rounded-lg">
              <h3 className="text-sm font-semibold">{t.inviteNewUser}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t.name}</Label>
                  <Input value={newUser.nombre} onChange={e => setNewUser(p => ({ ...p, nombre: e.target.value }))} placeholder={t.name} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t.email}</Label>
                  <Input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="email@ejemplo.com" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t.password}</Label>
                  <Input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="••••••" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t.role}</Label>
                  <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v as UserRole }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gestor">{t.manager}</SelectItem>
                      <SelectItem value="invitado">{t.guest}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" onClick={handleAddUser} className="w-full">
                <Plus className="w-4 h-4 mr-1" /> {t.createUser}
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.name}</TableHead>
                  <TableHead>{t.email}</TableHead>
                  <TableHead>{t.role}</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.users.map(u => (
                  <TableRow key={u.email}>
                    <TableCell className="text-sm">{u.nombre}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{roleLabel[u.role]}</Badge></TableCell>
                    <TableCell>
                      {u.role !== 'admin' && (
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
    </div>
  );
}
