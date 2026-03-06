import { useState, useEffect } from 'react';
import LoginPage from '@/components/LoginPage';
import AppLayout from '@/components/AppLayout';
import { UserRole, Albergue, DEFAULT_ALBERGUE } from '@/types';
import { I18nProvider } from '@/i18n/I18nContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

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

  const handleLogin = (userRole: UserRole, albergueIds: string[]) => {
    setAuthed(true);
    setRole(userRole);
    setUserAlbergueIds(albergueIds);
    localStorage.setItem('userAlbergueIds', JSON.stringify(albergueIds));
  };

  const albergues = loadAlbergues();
  const availableAlbergues = role === 'admin'
    ? albergues
    : albergues.filter(a => userAlbergueIds.includes(a.id));

  // Auto-select if only one available
  useEffect(() => {
    if (authed && !albergueId) {
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
    localStorage.removeItem('currentAlbergueId');
    localStorage.removeItem('userAlbergueIds');
  };

  return (
    <I18nProvider>
      {!authed ? (
        <LoginPage onLogin={handleLogin} />
      ) : !albergueId && availableAlbergues.length > 1 ? (
        // Albergue selector for admin with multiple albergues
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary-foreground" />
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
