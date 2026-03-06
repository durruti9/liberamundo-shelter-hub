import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';
import logo from '@/assets/Logo2Liberamundo.png';
import { UserRole, UserAccount } from '@/types';
import { useI18n } from '@/i18n/I18nContext';
import { Language } from '@/i18n/translations';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { api, isApiAvailable } from '@/lib/api';
interface Props {
  onLogin: (role: UserRole, albergueIds: string[]) => void;
}

const LANG_FLAGS: Record<Language, string> = { es: '🇪🇸', fr: '🇫🇷', ar: '🇸🇦', en: '🇬🇧' };
const LANG_LABELS: Record<Language, string> = { es: 'Español', fr: 'Français', ar: 'العربية', en: 'English' };

function loadUsers(): UserAccount[] {
  try {
    const data = localStorage.getItem('users');
    if (data) {
      const users = JSON.parse(data) as UserAccount[];
      return users.map(u => ({ ...u, albergueIds: u.albergueIds || ['default'] }));
    }
    return [{ email: 'albergue@liberamundo.com', password: 'admin123', role: 'admin', nombre: 'Administrador', albergueIds: [] }];
  } catch {
    return [{ email: 'albergue@liberamundo.com', password: 'admin123', role: 'admin', nombre: 'Administrador', albergueIds: [] }];
  }
}

export default function LoginPage({ onLogin }: Props) {
  const { t, lang, setLang } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = loadUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem('auth', 'true');
      localStorage.setItem('authRole', user.role);
      onLogin(user.role, user.albergueIds);
    } else {
      setError(t.wrongCredentials);
    }
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
      <Card className="w-full max-w-md shadow-xl">
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
              <Label htmlFor="email">{t.email}</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="albergue@liberamundo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">{t.login}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
