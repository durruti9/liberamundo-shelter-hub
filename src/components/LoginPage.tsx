import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Globe, MessageSquarePlus } from 'lucide-react';
import logo from '@/assets/Logo2Liberamundo.png';
import buzonImg from '@/assets/buzon-sugerencias.png';
import { UserRole, UserAccount } from '@/types';
import { useI18n } from '@/i18n/I18nContext';
import { Language } from '@/i18n/translations';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { api, isApiAvailable } from '@/lib/api';
import { Link } from 'react-router-dom';

interface Props {
  onLogin: (role: UserRole, albergueIds: string[]) => void;
}

const LANG_FLAGS: Record<Language, string> = { es: '🇪🇸', fr: '🇫🇷', ar: '🇸🇦', en: '🇬🇧', ru: '🇷🇺' };
const LANG_LABELS: Record<Language, string> = { es: 'Español', fr: 'Français', ar: 'العربية', en: 'English', ru: 'Русский' };

function loadUsers(): UserAccount[] {
  try {
    const data = localStorage.getItem('users');
    if (data) {
      return JSON.parse(data) as UserAccount[];
    }
    return [{ email: 'admin', password: 'admin123', role: 'admin' }];
  } catch {
    return [{ email: 'admin', password: 'admin123', role: 'admin' }];
  }
}

export default function LoginPage({ onLogin }: Props) {
  const { t, lang, setLang } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const apiAvailable = await isApiAvailable();
    if (apiAvailable) {
      try {
        const result = await api.login(email, password);
        localStorage.setItem('auth', 'true');
        localStorage.setItem('authRole', result.role);
        localStorage.setItem('authEmail', email);
        onLogin(result.role as UserRole, result.albergueIds);
        return;
      } catch {
        setError(t.wrongCredentials);
        return;
      }
    }
    
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
                <Input id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nombre" />
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
    </div>
  );
}
