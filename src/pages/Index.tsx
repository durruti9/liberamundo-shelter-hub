import { useState, useEffect, useCallback } from 'react';
import LoginPage from '@/components/LoginPage';
import AppLayout from '@/components/AppLayout';
import { UserRole, Albergue, DEFAULT_ALBERGUE } from '@/types';
import { I18nProvider } from '@/i18n/I18nContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PasswordInput from '@/components/PasswordInput';
import logo from '@/assets/Logo2Liberamundo.png';
import { api, isApiAvailable, clearToken } from '@/lib/api';

// Session timeout: 2 hours of inactivity
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000;

function loadAlbergues(): Albergue[] {
  try {
    const data = localStorage.getItem('albergues');
    return data ? JSON.parse(data) : [DEFAULT_ALBERGUE];
  } catch {
    return [DEFAULT_ALBERGUE];
  }
}

const Index = () => {
  const [authed, setAuthed] = useState(() => localStorage.getItem('auth') === 'true');
  const [role, setRole] = useState<UserRole>(() => (localStorage.getItem('authRole') as UserRole) || 'admin');
  const [albergueId, setAlbergueId] = useState<string | null>(() => localStorage.getItem('currentAlbergueId'));
  const [userAlbergueIds, setUserAlbergueIds] = useState<string[]>(() => {
    try {
      const data = localStorage.getItem('userAlbergueIds');
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  });
  const [isDefaultAdmin, setIsDefaultAdmin] = useState(() => localStorage.getItem('authEmail') === 'admin');

  // Force admin replacement state
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<UserRole>('admin');
  const [replacingAdmin, setReplacingAdmin] = useState(false);
  const [replaceError, setReplaceError] = useState('');

  // Session expiration
  const resetSessionTimer = useCallback(() => {
    localStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  useEffect(() => {
    if (!authed) return;
    
    const checkExpiration = () => {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
      if (lastActivity && Date.now() - lastActivity > SESSION_TIMEOUT) {
        handleLogout();
      }
    };

    // Check on mount
    checkExpiration();

    // Check every minute
    const interval = setInterval(checkExpiration, 60 * 1000);

    // Reset timer on user activity
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetSessionTimer));

    return () => {
      clearInterval(interval);
      events.forEach(e => window.removeEventListener(e, resetSessionTimer));
    };
  }, [authed, resetSessionTimer]);

  const handleLogin = (userRole: UserRole, albergueIds: string[], defaultAdmin?: boolean) => {
    setAuthed(true);
    setRole(userRole);
    setUserAlbergueIds(albergueIds);
    setIsDefaultAdmin(!!defaultAdmin);
    localStorage.setItem('userAlbergueIds', JSON.stringify(albergueIds));
    resetSessionTimer();

    // Always set albergueId from login response to ensure consistency
    if (albergueIds.length > 0) {
      setAlbergueId(albergueIds[0]);
      localStorage.setItem('currentAlbergueId', albergueIds[0]);
    }
  };

  const albergues = loadAlbergues();
  // For non-admin users, also include albergues by their assigned IDs
  // (localStorage may not have them yet, but the store will fetch from API)
  const availableAlbergues = role === 'admin'
    ? albergues
    : (() => {
        const matched = albergues.filter(a => userAlbergueIds.includes(a.id));
        // If no match in localStorage, create placeholder entries from userAlbergueIds
        // so the user can still enter the app (real data loads from API in the store)
        if (matched.length === 0 && userAlbergueIds.length > 0) {
          return userAlbergueIds.map(id => ({ id, nombre: 'Cargando...', rooms: [] as any[] }));
        }
        return matched;
      })();

  useEffect(() => {
    if (authed && !albergueId && availableAlbergues.length > 0) {
      if (availableAlbergues.length === 1) {
        setAlbergueId(availableAlbergues[0].id);
        localStorage.setItem('currentAlbergueId', availableAlbergues[0].id);
      }
    }
  }, [authed, albergueId, availableAlbergues]);

  const selectAlbergue = (id: string) => {
    setAlbergueId(id);
    localStorage.setItem('currentAlbergueId', id);
  };

  const handleLogout = () => {
    setAuthed(false);
    setAlbergueId(null);
    setRole('admin');
    setUserAlbergueIds([]);
    setIsDefaultAdmin(false);
    clearToken();
    localStorage.removeItem('auth');
    localStorage.removeItem('authRole');
    localStorage.removeItem('authEmail');
    localStorage.removeItem('currentAlbergueId');
    localStorage.removeItem('userAlbergueIds');
    localStorage.removeItem('lastActivity');
  };

  const handleReplaceAdmin = async () => {
    if (!newAdminUser.trim() || !newAdminPass.trim()) return;
    if (newAdminPass.trim().length < 4) {
      setReplaceError('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    setReplacingAdmin(true);
    setReplaceError('');
    try {
      const apiAvailable = await isApiAvailable();
      if (apiAvailable) {
        // Create new user
        await api.addUser({ email: newAdminUser, password: newAdminPass, role: newAdminRole });
        // Delete default admin
        await api.removeUser('admin');
        // Re-login as the new user to get a valid JWT
        try {
          const result = await api.login(newAdminUser, newAdminPass);
          if (result.token) {
            const { setToken } = await import('@/lib/api');
            setToken(result.token);
          }
          localStorage.setItem('authEmail', result.email);
          localStorage.setItem('authRole', result.role);
          setIsDefaultAdmin(false);
          setRole(result.role as UserRole);
          setUserAlbergueIds(result.albergueIds || []);
          localStorage.setItem('userAlbergueIds', JSON.stringify(result.albergueIds || []));
        } catch {
          // If re-login fails, just log out and let them log in manually
          handleLogout();
          return;
        }
      } else {
        // localStorage fallback
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const filtered = users.filter((u: any) => u.email !== 'admin');
        filtered.push({ email: newAdminUser, password: newAdminPass, role: newAdminRole });
        localStorage.setItem('users', JSON.stringify(filtered));
        localStorage.setItem('authEmail', newAdminUser);
        localStorage.setItem('authRole', newAdminRole);
        setIsDefaultAdmin(false);
        setRole(newAdminRole);
      }
    } catch (err: any) {
      setReplaceError(err.message || 'Error al crear usuario');
    } finally {
      setReplacingAdmin(false);
    }
  };

  return (
    <I18nProvider>
      {!authed ? (
        <LoginPage onLogin={handleLogin} />
      ) : isDefaultAdmin ? (
        /* Force admin replacement screen */
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md shadow-xl border-destructive/30">
            <CardHeader className="text-center space-y-3">
              <div className="mx-auto">
                <img src={logo} alt="Libera Mundo" className="h-16 mx-auto" />
              </div>
              <div className="flex items-center justify-center gap-2 text-destructive">
                <ShieldAlert className="w-6 h-6" />
                <CardTitle className="text-xl">Seguridad: cuenta por defecto</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Estás usando la cuenta <strong>admin/admin</strong>. Por seguridad, debes crear un nuevo usuario administrador. La cuenta por defecto será eliminada automáticamente.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nuevo usuario</Label>
                <Input value={newAdminUser} onChange={e => setNewAdminUser(e.target.value)} placeholder="Nombre de usuario" />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <PasswordInput value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)} placeholder="Contraseña segura" />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={newAdminRole} onValueChange={v => setNewAdminRole(v as UserRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administración</SelectItem>
                    <SelectItem value="gestor">Personal gestor</SelectItem>
                    <SelectItem value="personal_albergue">Personal laboral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {replaceError && <p className="text-sm text-destructive">{replaceError}</p>}
              <Button
                className="w-full"
                disabled={!newAdminUser.trim() || !newAdminPass.trim() || replacingAdmin}
                onClick={handleReplaceAdmin}
              >
                {replacingAdmin ? 'Creando...' : 'Crear usuario y eliminar cuenta por defecto'}
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : !albergueId && availableAlbergues.length > 1 ? (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center space-y-3">
              <div className="mx-auto">
                <img src={logo} alt="Libera Mundo" className="h-16 mx-auto" />
              </div>
              <CardTitle className="text-xl">Selecciona un albergue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableAlbergues.map(a => (
                <Button key={a.id} variant="outline" className="w-full justify-start gap-3 h-14" onClick={() => selectAlbergue(a.id)}>
                  <Building2 className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">{a.nombre}</div>
                    <div className="text-xs text-muted-foreground">{a.rooms.length} habitaciones</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <AppLayout
          key={albergueId || 'default'}
          onLogout={handleLogout}
          role={role}
          albergueId={albergueId || availableAlbergues[0]?.id || 'default'}
          onSwitchAlbergue={selectAlbergue}
        />
      )}
    </I18nProvider>
  );
};

export default Index;
