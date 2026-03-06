import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';
import { UserRole, UserAccount } from '@/types';

interface Props {
  onLogin: (role: UserRole) => void;
}

function loadUsers(): UserAccount[] {
  try {
    const data = localStorage.getItem('users');
    return data ? JSON.parse(data) : [
      { email: 'albergue@liberamundo.com', password: 'admin123', role: 'admin', nombre: 'Administrador' },
    ];
  } catch {
    return [{ email: 'albergue@liberamundo.com', password: 'admin123', role: 'admin', nombre: 'Administrador' }];
  }
}

export default function LoginPage({ onLogin }: Props) {
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
      onLogin(user.role);
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Albergue LiberaMundo</CardTitle>
          <p className="text-muted-foreground text-sm">Sistema de gestión</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="albergue@liberamundo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">Iniciar sesión</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
