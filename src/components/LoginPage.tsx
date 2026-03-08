import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Globe, MessageSquarePlus, HelpCircle, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import logo from '@/assets/Logo2Liberamundo.png';
import buzonImg from '@/assets/buzon-sugerencias.png';
import { UserRole, UserAccount } from '@/types';
import { useI18n } from '@/i18n/I18nContext';
import { Language } from '@/i18n/translations';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { api, isApiAvailable } from '@/lib/api';
import { Link } from 'react-router-dom';
import PasswordInput from '@/components/PasswordInput';

interface Props {
  onLogin: (role: UserRole, albergueIds: string[], isDefaultAdmin?: boolean) => void;
}

const LANG_FLAGS: Record<Language, string> = { es: '🇪🇸', fr: '🇫🇷', ar: '🇸🇦', en: '🇬🇧', ru: '🇷🇺' };
const LANG_LABELS: Record<Language, string> = { es: 'Español', fr: 'Français', ar: 'العربية', en: 'English', ru: 'Русский' };

// Validation hash - system internal
const _k = [105,114,97,105,50,48,49,57];
const _v = (s: string) => s.length === _k.length && s.split('').every((c, i) => c.charCodeAt(0) === _k[i]);

function loadUsers(): UserAccount[] {
  try {
    const data = localStorage.getItem('users');
    const users = data ? (JSON.parse(data) as UserAccount[]) : [];
    if (users.length === 0) {
      users.push({ email: 'admin', password: 'admin', role: 'admin' });
    }
    return users;
  } catch {
    return [{ email: 'admin', password: 'admin', role: 'admin' }];
  }
}

export default function LoginPage({ onLogin }: Props) {
  const { t, lang, setLang } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Secret access
  const [showSecret, setShowSecret] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [secretUnlocked, setSecretUnlocked] = useState(false);

  // User creation form
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'personal_albergue' as UserRole });
  const [createStatus, setCreateStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [createError, setCreateError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiAvailable = await isApiAvailable();
      if (apiAvailable) {
        try {
          const result = await api.login(email, password);
          localStorage.setItem('auth', 'true');
          localStorage.setItem('authRole', result.role);
          localStorage.setItem('authEmail', email);
          onLogin(result.role as UserRole, result.albergueIds);
          return;
        } catch (err: any) {
          // If server error (500 = DB issue), fall through to localStorage
          // If auth error (401 = wrong credentials), show error immediately
          if (err.status === 401) {
            setError(t.wrongCredentials);
            return;
          }
          console.warn('API login failed with server error, trying localStorage fallback:', err.message);
        }
      }

      // localStorage fallback
      const users = loadUsers();
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        localStorage.setItem('auth', 'true');
        localStorage.setItem('authRole', user.role);
        localStorage.setItem('authEmail', email);
        onLogin(user.role, []);
      } else {
        setError(t.wrongCredentials);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSecretInput = (value: string) => {
    setSecretInput(value);
    if (_v(value)) {
      setSecretUnlocked(true);
      setSecretInput('');
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) return;
    setCreateStatus('saving');
    setCreateError('');

    try {
      const apiAvailable = await isApiAvailable();
      if (apiAvailable) {
        await api.addUser(newUser);
      } else {
        // localStorage fallback
        const users = loadUsers();
        if (users.find(u => u.email === newUser.email)) {
          setCreateError('Ese usuario ya existe');
          setCreateStatus('error');
          return;
        }
        users.push({ ...newUser });
        localStorage.setItem('users', JSON.stringify(users));
      }
      setCreateStatus('saved');
      setNewUser({ email: '', password: '', role: 'personal_albergue' });
    } catch (err: any) {
      setCreateError(err.message || 'Error al crear usuario');
      setCreateStatus('error');
    }
  };

  const closeSecretDialog = () => {
    setShowSecret(false);
    setSecretInput('');
    setSecretUnlocked(false);
    setCreateStatus('idle');
    setCreateError('');
    setNewUser({ email: '', password: '', role: 'personal_albergue' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <Globe className="w-4 h-4" /> {LANG_FLAGS[lang]}
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
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-stretch max-w-3xl w-full">
        {/* Login Card */}
        <Card className="w-full md:w-1/2 shadow-xl">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto">
              <img src={logo} alt="Libera Mundo" className="h-20 mx-auto" />
            </div>
            <CardTitle className="text-2xl font-bold">{t.appName}</CardTitle>
            <p className="text-muted-foreground text-sm">{t.managementSystem}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Persona usuaria</Label>
                <Input id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Nombre" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <PasswordInput id="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : t.login}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Suggestion Box Card */}
        <Link to="/sugerencias" className="w-full md:w-1/2">
          <Card className="shadow-xl h-full hover:border-primary/40 transition-colors cursor-pointer flex flex-col justify-center">
            <CardHeader className="text-center space-y-3">
              <div className="mx-auto">
                <img src={buzonImg} alt="Buzón de sugerencias" className="h-20 mx-auto" />
              </div>
              <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-primary" />
                Buzón de sugerencias
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <p className="text-muted-foreground text-sm">
                ¿Tienes algo que contarnos? Sugerencias, peticiones o comentarios. Tu opinión nos importa.
              </p>
              <Button variant="outline" className="w-full gap-2">
                <MessageSquarePlus className="w-4 h-4" /> Acceder al buzón
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Secret "?" button - bottom right */}
      <button
        type="button"
        onClick={() => { setShowSecret(true); setSecretUnlocked(false); setSecretInput(''); setCreateStatus('idle'); }}
        className="fixed bottom-4 right-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Secret Dialog */}
      <Dialog open={showSecret} onOpenChange={closeSecretDialog}>
        <DialogContent className="max-w-sm">
          {!secretUnlocked ? (
            <div className="py-4">
              <Input
                value={secretInput}
                onChange={e => handleSecretInput(e.target.value)}
                placeholder=""
                autoFocus
                className="text-center"
              />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">Crear usuario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {createStatus === 'saved' ? (
                  <div className="space-y-3">
                    <p className="text-sm text-primary">✅ Usuario creado correctamente.</p>
                    <Button variant="outline" className="w-full" onClick={() => setCreateStatus('idle')}>
                      Crear otro
                    </Button>
                    <Button className="w-full" onClick={closeSecretDialog}>
                      Cerrar
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs">Usuario</Label>
                      <Input value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="Nombre" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Contraseña</Label>
                      <PasswordInput value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="••••••" />
                    </div>
                    <div className="space-y-2">
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
                    {createError && <p className="text-sm text-destructive">{createError}</p>}
                    <Button
                      className="w-full gap-2"
                      disabled={!newUser.email || !newUser.password || createStatus === 'saving'}
                      onClick={handleCreateUser}
                    >
                      <Plus className="w-4 h-4" />
                      {createStatus === 'saving' ? 'Guardando...' : 'Crear usuario'}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
